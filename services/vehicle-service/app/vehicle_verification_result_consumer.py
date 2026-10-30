"""Consumidor del resultado de verificación del Flujo A.

Este componente pertenece a Rentar porque es el único responsable de
actualizar la base principal. El verificador policial solo publica el
resultado y no conoce la base `Rentar`.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import pika

APP_DIRECTORY = Path(__file__).resolve().parent
SERVICES_DIRECTORY = APP_DIRECTORY.parents[1]
if str(SERVICES_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIRECTORY))

from messaging.topology import (  # noqa: E402
    RENTAR_QUEUE,
    RabbitMqSettings,
    declare_flow_a_topology,
)
from vehicle_repository import VehicleRepository  # noqa: E402

logger = logging.getLogger("vehicle-verification-result-consumer")


class VehicleVerificationResultConsumer:
    """Consume resultados y actualiza `lk_vehiculos` de forma idempotente."""

    def __init__(
        self,
        repository: VehicleRepository,
        settings: RabbitMqSettings | None = None,
    ) -> None:
        self.repository = repository
        self.settings = settings or RabbitMqSettings()

    def handle_message(self, channel, method, properties, body: bytes) -> None:
        """Procesa un resultado y confirma solo mensajes válidos."""
        try:
            result = json.loads(body.decode("utf-8"))
            vehicle_id = int(result["vehiculoId"])
            patente = str(result["patente"]).strip().upper()
            verification = str(result["resultado"]).strip().upper()

            if vehicle_id <= 0 or not patente:
                raise ValueError("vehiculoId y patente son obligatorios")
            if verification not in {"VALIDADO", "ROBADO"}:
                raise ValueError("resultado debe ser VALIDADO o ROBADO")

            updated = self.repository.update_verification(
                vehicle_id,
                patente,
                verification,
            )
            if not updated:
                raise LookupError(
                    f"Vehículo no encontrado o patente inconsistente: {vehicle_id}"
                )

            channel.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(
                "Verificación aplicada: vehiculoId=%s patente=%s resultado=%s",
                vehicle_id,
                patente,
                verification,
            )
        except (json.JSONDecodeError, KeyError, TypeError, ValueError, LookupError) as error:
            logger.error("Resultado inválido rechazado: %s", error)
            channel.basic_nack(
                delivery_tag=method.delivery_tag,
                requeue=False,
            )
        except Exception:
            logger.exception("Error actualizando el resultado de verificación")
            channel.basic_nack(
                delivery_tag=method.delivery_tag,
                requeue=True,
            )

    def run(self) -> None:
        """Conecta al broker y consume la cola de resultados de Rentar."""
        connection = pika.BlockingConnection(self.settings.parameters())
        try:
            channel = connection.channel()
            declare_flow_a_topology(channel)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=RENTAR_QUEUE,
                on_message_callback=self.handle_message,
                auto_ack=False,
            )
            logger.info("Esperando resultados en %s", RENTAR_QUEUE)
            channel.start_consuming()
        finally:
            connection.close()
