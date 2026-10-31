"""Publicador de solicitudes del Flujo B."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pika

SERVICES_DIRECTORY = Path(__file__).resolve().parents[2]
if str(SERVICES_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIRECTORY))

from messaging.topology import (  # noqa: E402
    EXCHANGE_NAME,
    EXTERNAL_VEHICLE_REGISTERED,
    RabbitMqSettings,
    declare_flow_a_topology,
)


class ExternalVehiclePublisher:
    """Publica el evento de registro para los verificadores independientes."""

    def __init__(self, settings: RabbitMqSettings | None = None):
        self.settings = settings or RabbitMqSettings()

    def publish(
        self,
        vehicle_id: int,
        client_id: int,
        patente: str,
        documento: str,
    ) -> None:
        payload = {
            "vehiculoExternoId": vehicle_id,
            "clienteId": client_id,
            "patente": patente,
            "documento": documento,
        }
        connection = pika.BlockingConnection(self.settings.parameters())
        try:
            channel = connection.channel()
            declare_flow_a_topology(channel)
            channel.basic_publish(
                exchange=EXCHANGE_NAME,
                routing_key=EXTERNAL_VEHICLE_REGISTERED,
                body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                properties=pika.BasicProperties(
                    content_type="application/json",
                    delivery_mode=pika.DeliveryMode.Persistent,
                    type=EXTERNAL_VEHICLE_REGISTERED,
                ),
                mandatory=True,
            )
        finally:
            connection.close()
