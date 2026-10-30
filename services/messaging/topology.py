"""Declaración de la topología RabbitMQ del Flujo A.

El flujo completo queda representado por dos recorridos independientes:

1. Rentar publica una solicitud de verificación y el verificador la consume.
2. El verificador publica el resultado y Rentar lo consume.

Los productores publican al exchange, nunca directamente a una cola. El
exchange utiliza la routing key para entregar cada mensaje a la cola del
componente que debe procesarlo.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import pika


# Exchange central por el que circulan los eventos de Rentar. Al ser de tipo
# topic, cada mensaje se dirige usando una routing key con el nombre del
# evento. Es durable para conservar su configuración después de reiniciar
# RabbitMQ.
EXCHANGE_NAME = "rentar.events"
EXCHANGE_TYPE = "topic"

# Evento publicado por Rentar inmediatamente después de registrar un vehículo.
# El payload definido por el Hito 3 contiene vehiculoId y patente.
VEHICLE_VERIFICATION_REQUESTED = "vehiculos.verificacion.solicitada"

# Evento publicado por el verificador después de consultar el registro
# policial simulado. El payload contiene vehiculoId, patente y resultado.
VEHICLE_VERIFICATION_RESULT = "vehiculos.verificacion.resultado"

# Eventos de incorporación de vehículos registrados por clientes.
EXTERNAL_VEHICLE_REGISTERED = "vehiculos.externos.registrados"
EXTERNAL_PATENT_VALIDATION = "vehiculos.externos.validacion.patente"
EXTERNAL_OWNERSHIP_VALIDATION = "vehiculos.externos.validacion.titularidad"
EXTERNAL_VALIDATION_COMPLETED = "vehiculos.externos.validacion.completada"

# Cola exclusiva del componente verificador. Recibe solicitudes desde Rentar
# mediante VEHICLE_VERIFICATION_REQUESTED.
VERIFIER_QUEUE = "rentar.verificador.vehiculos"

# Cola del componente Rentar. Recibe los resultados publicados por el
# verificador mediante VEHICLE_VERIFICATION_RESULT.
RENTAR_QUEUE = "rentar.vehiculos.verificacion.resultado"

EXTERNAL_PATENT_QUEUE = "rentar.verificador.externos.patente"
EXTERNAL_OWNERSHIP_QUEUE = "rentar.verificador.externos.titularidad"
EXTERNAL_CORRELATOR_QUEUE = "rentar.correlador.externos"
EXTERNAL_INCORPORATION_QUEUE = "rentar.incorporacion.externos"


@dataclass(frozen=True)
class RabbitMqSettings:
    """Configuración de conexión de un componente con RabbitMQ.

    Todos los servicios pueden reutilizar esta configuración. Los valores
    predeterminados sirven para el entorno local y pueden reemplazarse con
    variables de entorno sin cambiar la topología.
    """

    host: str = os.getenv("RABBITMQ_HOST", "localhost")
    port: int = int(os.getenv("RABBITMQ_PORT", "5672"))
    username: str = os.getenv("RABBITMQ_USERNAME", "guest")
    password: str = os.getenv("RABBITMQ_PASSWORD", "guest")
    virtual_host: str = os.getenv("RABBITMQ_VIRTUAL_HOST", "/")

    def credentials(self) -> pika.PlainCredentials:
        return pika.PlainCredentials(self.username, self.password)

    def parameters(self) -> pika.ConnectionParameters:
        return pika.ConnectionParameters(
            host=self.host,
            port=self.port,
            virtual_host=self.virtual_host,
            credentials=self.credentials(),
        )


def declare_flow_a_topology(channel: pika.adapters.blocking_connection.BlockingChannel) -> None:
    """Declara el exchange, las colas y los bindings del Flujo A.

    Canal de ida:
        Rentar -> rentar.events -> vehiculos.verificacion.solicitada
        -> rentar.verificador.vehiculos -> Verificador.

    Canal de vuelta:
        Verificador -> rentar.events -> vehiculos.verificacion.resultado
        -> rentar.vehiculos.verificacion.resultado -> Rentar.

    Las dos colas son durables para no perder la cola ni sus bindings cuando
    RabbitMQ se reinicia. La declaración es idempotente mientras se mantengan
    los mismos nombres y propiedades.
    """
    # 1. Exchange central: recibe los mensajes de los productores y los
    #    enruta según la routing key. No contiene lógica de negocio.
    channel.exchange_declare(
        exchange=EXCHANGE_NAME,
        exchange_type=EXCHANGE_TYPE,
        durable=True,
    )

    # 2. Cola de entrada del verificador: queda esperando solicitudes
    #    producidas por Rentar cuando se registra un vehículo.
    channel.queue_declare(queue=VERIFIER_QUEUE, durable=True)

    # 3. Binding del canal de ida: solo las solicitudes de verificación se
    #    entregan a la cola del verificador.
    channel.queue_bind(
        queue=VERIFIER_QUEUE,
        exchange=EXCHANGE_NAME,
        routing_key=VEHICLE_VERIFICATION_REQUESTED,
    )

    # 4. Cola de resultados de Rentar: queda esperando la respuesta
    #    asíncrona del verificador.
    channel.queue_declare(queue=RENTAR_QUEUE, durable=True)

    # 5. Binding del canal de vuelta: solo los resultados de verificación se
    #    entregan a la cola que consumirá Rentar.
    channel.queue_bind(
        queue=RENTAR_QUEUE,
        exchange=EXCHANGE_NAME,
        routing_key=VEHICLE_VERIFICATION_RESULT,
    )

    channel.queue_declare(queue=EXTERNAL_PATENT_QUEUE, durable=True)
    channel.queue_bind(
        queue=EXTERNAL_PATENT_QUEUE,
        exchange=EXCHANGE_NAME,
        routing_key=EXTERNAL_VEHICLE_REGISTERED,
    )

    channel.queue_declare(queue=EXTERNAL_OWNERSHIP_QUEUE, durable=True)
    channel.queue_bind(
        queue=EXTERNAL_OWNERSHIP_QUEUE,
        exchange=EXCHANGE_NAME,
        routing_key=EXTERNAL_VEHICLE_REGISTERED,
    )

    channel.queue_declare(queue=EXTERNAL_CORRELATOR_QUEUE, durable=True)
    channel.queue_bind(
        queue=EXTERNAL_CORRELATOR_QUEUE,
        exchange=EXCHANGE_NAME,
        routing_key=EXTERNAL_PATENT_VALIDATION,
    )
    channel.queue_bind(
        queue=EXTERNAL_CORRELATOR_QUEUE,
        exchange=EXCHANGE_NAME,
        routing_key=EXTERNAL_OWNERSHIP_VALIDATION,
    )

    channel.queue_declare(queue=EXTERNAL_INCORPORATION_QUEUE, durable=True)
    channel.queue_bind(
        queue=EXTERNAL_INCORPORATION_QUEUE,
        exchange=EXCHANGE_NAME,
        routing_key=EXTERNAL_VALIDATION_COMPLETED,
    )


def declare_topology(settings: RabbitMqSettings | None = None) -> None:
    """Conecta al broker y deja declarada la topología del Flujo A.

    Esta función solo crea la infraestructura de mensajería. La publicación
    de eventos y el consumo pertenecen a los componentes de Rentar y del
    verificador.
    """
    connection = pika.BlockingConnection(
        (settings or RabbitMqSettings()).parameters()
    )
    try:
        declare_flow_a_topology(connection.channel())
    finally:
        connection.close()


if __name__ == "__main__":
    declare_topology()
    print("Topología RabbitMQ del Flujo A declarada correctamente.")
