"""Eventos del Flujo B (mantenimiento) del lado de Reservas.

MaintenancePublisher avisa que una reserva fue confirmada y
MaintenanceResultConsumer guarda el resultado en ft_reservas.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import pika

SERVICES_DIRECTORY = Path(__file__).resolve().parents[2]
if str(SERVICES_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIRECTORY))

from messaging.topology import (  # noqa: E402
    EXCHANGE_NAME,
    RESERVATION_CONFIRMED,
    RESERVATION_MAINTENANCE_QUEUE,
    RabbitMqSettings,
    declare_flow_b_topology,
)

logger = logging.getLogger("maintenance-events")

VALID_RESULTS = {"REALIZADO", "NO_REALIZADO"}


class MaintenancePublisher:
    """Publica reserva.confirmada sin esperar el resultado."""

    def __init__(self, settings: RabbitMqSettings | None = None) -> None:
        self.settings = settings or RabbitMqSettings()

    def publish(self, reservation_id, vehicle_id, start, end) -> None:
        payload = {
            "reservaId": reservation_id,
            "vehiculoId": vehicle_id,
            "fechaInicio": start.isoformat(timespec="seconds"),
            "fechaFin": end.isoformat(timespec="seconds"),
        }
        connection = pika.BlockingConnection(self.settings.parameters())
        try:
            channel = connection.channel()
            declare_flow_b_topology(channel)
            channel.basic_publish(
                exchange=EXCHANGE_NAME,
                routing_key=RESERVATION_CONFIRMED,
                body=json.dumps(payload).encode("utf-8"),
                properties=pika.BasicProperties(
                    content_type="application/json",
                    delivery_mode=pika.DeliveryMode.Persistent,
                    type=RESERVATION_CONFIRMED,
                ),
            )
        finally:
            connection.close()


class MaintenanceResultConsumer:
    """Consume mantenimiento.resultado y actualiza desc_mantenimiento."""

    def __init__(self, repository, settings: RabbitMqSettings | None = None) -> None:
        self.repository = repository
        self.settings = settings or RabbitMqSettings()

    def handle_message(self, channel, method, properties, body: bytes) -> None:
        try:
            event = json.loads(body.decode("utf-8"))
            reservation_id = int(event["reservaId"])
            result = str(event["resultado"]).strip().upper()
            if result not in VALID_RESULTS:
                raise ValueError(f"Resultado desconocido: {result}")

            if self.repository.update_maintenance(reservation_id, result):
                logger.info(
                    "Reserva %s: desc_mantenimiento = %s", reservation_id, result
                )
            else:
                logger.warning("No existe la reserva %s", reservation_id)
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
            logger.error("Resultado inválido rechazado: %s", error)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        except Exception:
            logger.exception("Error guardando el resultado de mantenimiento")
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    def run(self) -> None:
        connection = pika.BlockingConnection(self.settings.parameters())
        try:
            channel = connection.channel()
            declare_flow_b_topology(channel)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=RESERVATION_MAINTENANCE_QUEUE,
                on_message_callback=self.handle_message,
                auto_ack=False,
            )
            logger.info("Esperando resultados en %s", RESERVATION_MAINTENANCE_QUEUE)
            channel.start_consuming()
        finally:
            connection.close()
