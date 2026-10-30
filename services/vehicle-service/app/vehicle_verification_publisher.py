"""Publicador RabbitMQ del evento de solicitud de verificación de vehículos.

Este módulo contiene solamente integración de mensajería. La validación de la
patente y la consulta del registro policial pertenecen al futuro verificador.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pika

# Permite reutilizar la topología común aunque el servicio se ejecute desde
# services/vehicle-service, cuyo nombre contiene un guion y no es un paquete
# Python importable por su ruta completa.
SERVICES_DIRECTORY = Path(__file__).resolve().parents[2]
if str(SERVICES_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIRECTORY))

from messaging.topology import (  # noqa: E402
    EXCHANGE_NAME,
    RabbitMqSettings,
    VEHICLE_VERIFICATION_REQUESTED,
    declare_flow_a_topology,
)


class VehicleVerificationPublisher:
    """Publica solicitudes de verificación en el exchange compartido."""

    def __init__(self, settings: RabbitMqSettings | None = None):
        """Inicializa el publicador con la configuración del broker local."""
        self.settings = settings or RabbitMqSettings()

    def publish(self, vehicle_id: int, patente: str) -> None:
        """Publica una solicitud con el payload exacto definido por el Hito 3.

        El mensaje se marca como persistente y se declara la topología antes
        de publicar, por lo que el publicador también puede ejecutarse contra
        un RabbitMQ recién levantado.
        """
        payload = {
            "vehiculoId": vehicle_id,
            "patente": patente,
        }
        connection = pika.BlockingConnection(self.settings.parameters())
        try:
            channel = connection.channel()
            declare_flow_a_topology(channel)
            channel.basic_publish(
                exchange=EXCHANGE_NAME,
                routing_key=VEHICLE_VERIFICATION_REQUESTED,
                body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                properties=pika.BasicProperties(
                    content_type="application/json",
                    delivery_mode=pika.DeliveryMode.Persistent,
                    type=VEHICLE_VERIFICATION_REQUESTED,
                ),
                mandatory=True,
            )
        finally:
            connection.close()
