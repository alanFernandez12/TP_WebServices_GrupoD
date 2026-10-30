"""Consumidor y publicador del verificador policial del Flujo A."""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import pika
from dotenv import load_dotenv

APP_DIRECTORY = Path(__file__).resolve().parent
SERVICE_DIRECTORY = APP_DIRECTORY.parent
SERVICES_DIRECTORY = SERVICE_DIRECTORY.parent
sys.path.insert(0, str(SERVICES_DIRECTORY))

load_dotenv(SERVICE_DIRECTORY / ".env")

from messaging.topology import (  # noqa: E402
    EXCHANGE_NAME,
    RENTAR_QUEUE,
    VERIFIER_QUEUE,
    RabbitMqSettings,
    VEHICLE_VERIFICATION_RESULT,
    declare_flow_a_topology,
)
from police_registry import PoliceRegistry  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vehicle-verifier")


class VehicleVerifier:
    """Procesa solicitudes y emite resultados sin acceder a Rentar."""

    def __init__(
        self,
        registry: PoliceRegistry,
        settings: RabbitMqSettings | None = None,
    ) -> None:
        self.registry = registry
        self.settings = settings or RabbitMqSettings()

    def handle_message(self, channel, method, properties, body: bytes) -> None:
        """Verifica un mensaje, publica el resultado y confirma su consumo."""
        try:
            request = json.loads(body.decode("utf-8"))
            vehicle_id = int(request["vehiculoId"])
            patente = str(request["patente"]).strip().upper()
            if vehicle_id <= 0 or not patente:
                raise ValueError("vehiculoId y patente son obligatorios")

            resultado = "ROBADO" if self.registry.is_stolen(patente) else "VALIDADO"
            payload = {
                "vehiculoId": vehicle_id,
                "patente": patente,
                "resultado": resultado,
            }
            channel.basic_publish(
                exchange=EXCHANGE_NAME,
                routing_key=VEHICLE_VERIFICATION_RESULT,
                body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                properties=pika.BasicProperties(
                    content_type="application/json",
                    delivery_mode=pika.DeliveryMode.Persistent,
                    type=VEHICLE_VERIFICATION_RESULT,
                ),
                mandatory=True,
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(
                "Solicitud verificada: vehiculoId=%s patente=%s resultado=%s",
                vehicle_id,
                patente,
                resultado,
            )
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
            logger.error("Mensaje inválido rechazado: %s", error)
            channel.basic_nack(
                delivery_tag=method.delivery_tag,
                requeue=False,
            )
        except Exception:
            logger.exception("Error procesando la solicitud de verificación")
            channel.basic_nack(
                delivery_tag=method.delivery_tag,
                requeue=True,
            )

    def run(self) -> None:
        """Declara la topología y consume solicitudes continuamente."""
        connection = pika.BlockingConnection(self.settings.parameters())
        try:
            channel = connection.channel()
            declare_flow_a_topology(channel)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=VERIFIER_QUEUE,
                on_message_callback=self.handle_message,
                auto_ack=False,
            )
            logger.info("Esperando solicitudes en %s", VERIFIER_QUEUE)
            channel.start_consuming()
        finally:
            connection.close()


def main() -> None:
    """Punto de entrada del proceso verificador."""
    VehicleVerifier(PoliceRegistry()).run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Verificador detenido")
