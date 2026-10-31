"""Prueba de integración del consumer de titularidad mediante RabbitMQ."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import pika
from dotenv import load_dotenv

SERVICE_DIRECTORY = Path(__file__).resolve().parent
SERVICES_DIRECTORY = SERVICE_DIRECTORY.parent
if str(SERVICES_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIRECTORY))

load_dotenv(SERVICE_DIRECTORY / ".env")

from messaging.topology import (  # noqa: E402
    EXCHANGE_NAME,
    EXTERNAL_VEHICLE_OWNERSHIP_QUEUE,
    EXTERNAL_VEHICLE_OWNERSHIP_VALIDATION,
    EXTERNAL_VEHICLE_REGISTERED,
    RabbitMqSettings,
    declare_ownership_validation_topology,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Publica casos de titularidad y verifica sus respuestas RabbitMQ."
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=int(os.getenv("OWNERSHIP_TEST_TIMEOUT_SECONDS", "90")),
        help="Segundos máximos para recibir todos los resultados (default: 90).",
    )
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error("--timeout debe ser mayor que cero")

    connection = pika.BlockingConnection(RabbitMqSettings().parameters())
    channel = connection.channel()
    result_queue = None
    try:
        declare_ownership_validation_topology(channel)
        input_queue = channel.queue_declare(
            queue=EXTERNAL_VEHICLE_OWNERSHIP_QUEUE,
            passive=True,
        ).method
        if input_queue.consumer_count == 0:
            raise RuntimeError(
                "No hay un consumer escuchando "
                f"{EXTERNAL_VEHICLE_OWNERSHIP_QUEUE}. Inicia primero "
                "app.ownership_consumer."
            )

        result_queue = channel.queue_declare(
            queue="",
            exclusive=True,
            auto_delete=True,
        ).method.queue
        channel.queue_bind(
            queue=result_queue,
            exchange=EXCHANGE_NAME,
            routing_key=EXTERNAL_VEHICLE_OWNERSHIP_VALIDATION,
        )

        first_id = int(time.time()) * 10
        cases = {
            first_id: {
                "documento": "30111222",
                "expected": "VALIDADO",
            },
            first_id + 1: {
                "documento": "30111223",
                "expected": "RECHAZADO",
            },
        }

        for external_vehicle_id, case in cases.items():
            payload = {
                "vehiculoExternoId": external_vehicle_id,
                "clienteId": 89,
                "patente": "AA-123-BB",
                "documento": case["documento"],
            }
            channel.basic_publish(
                exchange=EXCHANGE_NAME,
                routing_key=EXTERNAL_VEHICLE_REGISTERED,
                body=json.dumps(payload).encode("utf-8"),
                properties=pika.BasicProperties(
                    content_type="application/json",
                    delivery_mode=pika.DeliveryMode.Persistent,
                    type=EXTERNAL_VEHICLE_REGISTERED,
                    correlation_id=str(external_vehicle_id),
                ),
                mandatory=True,
            )
            print(f"Solicitud enviada: vehiculoExternoId={external_vehicle_id}")

        received: dict[int, str] = {}
        deadline = time.monotonic() + args.timeout
        while len(received) < len(cases):
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                missing = sorted(set(cases) - set(received))
                raise TimeoutError(
                    "No llegaron todos los resultados. IDs pendientes: "
                    + ", ".join(map(str, missing))
                    + ". Revisa los logs del consumer y la conexión a MySQL."
                )

            method, properties, body = channel.basic_get(
                queue=result_queue,
                auto_ack=False,
            )
            if method is None:
                time.sleep(min(0.5, remaining))
                continue

            try:
                response = json.loads(body.decode("utf-8"))
                external_vehicle_id = int(response["vehiculoExternoId"])
                result = response["resultado"]
            except (UnicodeDecodeError, json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
                channel.basic_ack(delivery_tag=method.delivery_tag)
                raise RuntimeError(
                    "El consumer publicó un resultado con formato inválido."
                ) from error

            channel.basic_ack(delivery_tag=method.delivery_tag)
            if external_vehicle_id in cases:
                received[external_vehicle_id] = result

        failed = False
        for external_vehicle_id, case in cases.items():
            actual = received[external_vehicle_id]
            passed = actual == case["expected"]
            failed = failed or not passed
            status = "OK" if passed else "ERROR"
            print(
                f"{status}: vehiculoExternoId={external_vehicle_id}, "
                f"esperado={case['expected']}, recibido={actual}"
            )

        return 1 if failed else 0
    finally:
        if result_queue and channel.is_open:
            channel.queue_delete(queue=result_queue)
        if connection.is_open:
            connection.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (pika.exceptions.AMQPError, OSError, RuntimeError, TimeoutError) as error:
        print(f"Prueba RabbitMQ fallida: {error}", file=sys.stderr)
        raise SystemExit(1) from error
