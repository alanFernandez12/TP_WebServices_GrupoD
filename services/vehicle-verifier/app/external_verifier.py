"""Verificador de patentes para el Flujo B."""

from __future__ import annotations

import json
import logging
import os
import time

import pika
from dotenv import load_dotenv

from police_registry import PoliceRegistry

import sys
from pathlib import Path

SERVICES_DIRECTORY = Path(__file__).resolve().parents[2]
if str(SERVICES_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIRECTORY))

from messaging.topology import (  # noqa: E402
    EXCHANGE_NAME,
    EXTERNAL_PATENT_QUEUE,
    EXTERNAL_PATENT_VALIDATION,
    RabbitMqSettings,
    declare_flow_a_topology,
    EXTERNAL_VEHICLE_REGISTERED,
)

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("external-vehicle-verifier")
DELAY_SECONDS = float(os.getenv("EXTERNAL_PATENT_VERIFIER_DELAY_SECONDS", "30"))


class ExternalVehicleVerifier:
    """Consume altas externas y publica exclusivamente el resultado de patente."""

    def __init__(
        self,
        registry: PoliceRegistry,
        settings: RabbitMqSettings | None = None,
    ) -> None:
        self.registry = registry
        self.settings = settings or RabbitMqSettings()

    def handle_message(self, channel, method, properties, body: bytes) -> None:
        try:
            request = json.loads(body.decode("utf-8"))
            vehicle_id = int(request["vehiculoExternoId"])
            patente = str(request["patente"]).strip().upper()
            if vehicle_id <= 0 or not patente:
                raise ValueError("vehiculoExternoId y patente son obligatorios")

            logger.info(
                "Consulta policial simulada Flujo B: vehiculoExternoId=%s demora=%ss",
                vehicle_id,
                DELAY_SECONDS,
            )
            time.sleep(DELAY_SECONDS)
            resultado = "ROBADO" if self.registry.is_stolen(patente) else "VALIDADO"
            payload = {
                "vehiculoExternoId": vehicle_id,
                "patente": patente,
                "resultado": "RECHAZADO" if resultado == "ROBADO" else resultado,
            }
            channel.basic_publish(
                exchange=EXCHANGE_NAME,
                routing_key=EXTERNAL_PATENT_VALIDATION,
                body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                properties=pika.BasicProperties(
                    content_type="application/json",
                    delivery_mode=pika.DeliveryMode.Persistent,
                    type=EXTERNAL_PATENT_VALIDATION,
                ),
                mandatory=True,
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(
                "Patente externa verificada: vehiculoExternoId=%s resultado=%s",
                vehicle_id,
                payload["resultado"],
            )
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
            logger.error("Mensaje inválido rechazado: %s", error)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        except Exception:
            logger.exception("Error procesando la validación de patente externa")
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    def run(self) -> None:
        connection = pika.BlockingConnection(self.settings.parameters())
        try:
            channel = connection.channel()
            declare_flow_a_topology(channel)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=EXTERNAL_PATENT_QUEUE,
                on_message_callback=self.handle_message,
                auto_ack=False,
            )
            logger.info("Esperando altas externas en %s", EXTERNAL_PATENT_QUEUE)
            channel.start_consuming()
        finally:
            connection.close()


def main() -> None:
    ExternalVehicleVerifier(PoliceRegistry()).run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Verificador externo detenido")
