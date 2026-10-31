"""Servicio de mantenimiento preventivo (Flujo B).

Consume reserva.confirmada, simula el mantenimiento con una demora y publica
mantenimiento.resultado. No accede a ninguna base de datos.
"""

from __future__ import annotations

import json
import logging
import os
import random
import sys
import time
from pathlib import Path

import pika

SERVICES_DIRECTORY = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SERVICES_DIRECTORY))

from messaging.topology import (  # noqa: E402
    EXCHANGE_NAME,
    MAINTENANCE_QUEUE,
    MAINTENANCE_RESULT,
    RabbitMqSettings,
    declare_flow_b_topology,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("maintenance-service")

# Demora simulada del mantenimiento y resultado forzado (vacío = aleatorio).
DELAY_SECONDS = float(os.getenv("MAINTENANCE_DELAY_SECONDS", "30"))
FORCED_RESULT = os.getenv("MAINTENANCE_FORCE_RESULT", "")


def handle_message(channel, method, properties, body: bytes) -> None:
    """Registra la solicitud, simula el mantenimiento y publica el resultado."""
    try:
        event = json.loads(body.decode("utf-8"))
        reservation_id = int(event["reservaId"])
        vehicle_id = int(event["vehiculoId"])

        logger.info(
            "[SOLICITUD] Mantenimiento preventivo: reserva=%s vehiculo=%s (%s a %s)",
            reservation_id,
            vehicle_id,
            event.get("fechaInicio"),
            event.get("fechaFin"),
        )

        time.sleep(DELAY_SECONDS)
        if FORCED_RESULT:
            result = FORCED_RESULT
        else:
            result = "REALIZADO" if random.random() < 0.8 else "NO_REALIZADO"

        payload = {
            "reservaId": reservation_id,
            "vehiculoId": vehicle_id,
            "resultado": result,
        }
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=MAINTENANCE_RESULT,
            body=json.dumps(payload).encode("utf-8"),
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=pika.DeliveryMode.Persistent,
                type=MAINTENANCE_RESULT,
            ),
        )
        channel.basic_ack(delivery_tag=method.delivery_tag)
        logger.info("[RESULTADO] reserva=%s -> %s", reservation_id, result)
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
        logger.error("Mensaje inválido rechazado: %s", error)
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception:
        logger.exception("Error procesando el mantenimiento")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main() -> None:
    connection = pika.BlockingConnection(RabbitMqSettings().parameters())
    try:
        channel = connection.channel()
        declare_flow_b_topology(channel)
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(
            queue=MAINTENANCE_QUEUE,
            on_message_callback=handle_message,
            auto_ack=False,
        )
        logger.info("Esperando solicitudes en %s", MAINTENANCE_QUEUE)
        channel.start_consuming()
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Servicio de mantenimiento detenido")
