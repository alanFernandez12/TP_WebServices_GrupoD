"""Correlador persistente de las validaciones del Flujo B."""

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
if str(SERVICES_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIRECTORY))

load_dotenv(SERVICE_DIRECTORY / ".env")

from messaging.topology import (  # noqa: E402
    EXCHANGE_NAME,
    EXTERNAL_CORRELATOR_QUEUE,
    EXTERNAL_OWNERSHIP_VALIDATION,
    EXTERNAL_PATENT_VALIDATION,
    EXTERNAL_VALIDATION_COMPLETED,
    RabbitMqSettings,
    declare_flow_a_topology,
)
from correlation_repository import CorrelationRepository  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("external-vehicle-correlator")


class ExternalVehicleCorrelator:
    """Correlaciona patente y titularidad con persistencia transaccional."""

    def __init__(
        self,
        settings: RabbitMqSettings | None = None,
        repository: CorrelationRepository | None = None,
    ):
        self.settings = settings or RabbitMqSettings()
        self.repository = repository or CorrelationRepository()

    def handle_message(self, channel, method, properties, body: bytes) -> None:
        try:
            result = json.loads(body.decode("utf-8"))
            vehicle_id = int(result["vehiculoExternoId"])
            patente = str(result.get("patente", "")).strip().upper()
            validation_type = self._validation_type(properties)
            outcome = str(result["resultado"]).strip().upper()
            client_id = result.get("clienteId")

            if vehicle_id <= 0 or outcome not in {"VALIDADO", "RECHAZADO"}:
                raise ValueError(
                    "vehiculoExternoId y resultado VALIDADO/RECHAZADO son obligatorios"
                )
            if validation_type == "patente" and not patente:
                raise ValueError("patente es obligatoria para su validación")
            if client_id is not None:
                client_id = int(client_id)
                if client_id <= 0:
                    raise ValueError("clienteId no es válido")

            completed = self.repository.register_result(
                vehicle_id,
                validation_type,
                outcome,
                patente,
                client_id,
            )
            if completed:
                self._publish_completed(
                    channel,
                    {"vehiculoExternoId": vehicle_id},
                )
                self.repository.mark_completion_published(vehicle_id)

            channel.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(
                "Resultado correlacionado: vehiculoExternoId=%s tipo=%s resultado=%s",
                vehicle_id,
                validation_type,
                outcome,
            )
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
            logger.error("Resultado inválido rechazado: %s", error)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        except Exception:
            logger.exception("Error correlacionando validación externa")
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    @staticmethod
    def _validation_type(properties) -> str:
        event_type = getattr(properties, "type", None)
        if event_type == EXTERNAL_PATENT_VALIDATION:
            return "patente"
        if event_type == EXTERNAL_OWNERSHIP_VALIDATION:
            return "titularidad"
        raise ValueError("tipo de validación desconocido")

    @staticmethod
    def _publish_completed(channel, payload: dict) -> None:
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=EXTERNAL_VALIDATION_COMPLETED,
            body=json.dumps(payload).encode("utf-8"),
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=pika.DeliveryMode.Persistent,
                type=EXTERNAL_VALIDATION_COMPLETED,
            ),
            mandatory=True,
        )

    def run(self) -> None:
        connection = pika.BlockingConnection(self.settings.parameters())
        try:
            channel = connection.channel()
            declare_flow_a_topology(channel)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=EXTERNAL_CORRELATOR_QUEUE,
                on_message_callback=self.handle_message,
                auto_ack=False,
            )
            logger.info(
                "Esperando resultados del Flujo B en %s",
                EXTERNAL_CORRELATOR_QUEUE,
            )
            channel.start_consuming()
        finally:
            connection.close()


def main() -> None:
    ExternalVehicleCorrelator().run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Correlador del Flujo B detenido")
