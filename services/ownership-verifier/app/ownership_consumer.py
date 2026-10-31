"""Consumer RabbitMQ para la validación asíncrona de titularidad."""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import time
from pathlib import Path

import mysql.connector
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
    EXTERNAL_VEHICLE_OWNERSHIP_QUEUE,
    EXTERNAL_VEHICLE_OWNERSHIP_VALIDATION,
    RabbitMqSettings,
    declare_ownership_validation_topology,
)
logger = logging.getLogger("ownership-verifier")

# Demora simulada de la consulta externa; configurar en segundos.
DELAY_SECONDS = float(os.getenv("OWNERSHIP_VERIFIER_DELAY_SECONDS", "30"))


def get_owner_document(patente: str) -> str | None:
    """Obtiene el documento del titular desde el registro externo."""
    time.sleep(DELAY_SECONDS)
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "rentar_titularidad"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
    )
    try:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT cod_documento_titular
                FROM lk_registro_titularidad
                WHERE cod_patente = %s
                """,
                (patente,),
            )
            record = cursor.fetchone()
        finally:
            cursor.close()

        if record is None:
            return None
        return re.sub(r"\D", "", str(record["cod_documento_titular"]))
    finally:
        connection.close()


def _positive_id(value: object, field: str) -> int:
    identifier = int(value)
    if identifier <= 0:
        raise ValueError(f"{field} debe ser un entero positivo")
    return identifier


def handle_message(channel, method, properties, body: bytes) -> None:
    """Valida la titularidad, publica el resultado y confirma la solicitud."""
    try:
        request = json.loads(body.decode("utf-8"))
        external_vehicle_id = _positive_id(request["vehiculoExternoId"], "vehiculoExternoId")
        customer_id = _positive_id(request["clienteId"], "clienteId")
        patente = re.sub(r"[\s-]", "", str(request["patente"])).upper()
        documento = re.sub(r"\D", "", str(request["documento"]))
        if not re.fullmatch(r"[A-Z0-9]{6,7}", patente):
            raise ValueError("patente debe tener entre 6 y 7 caracteres alfanuméricos")
        if not 7 <= len(documento) <= 11:
            raise ValueError("documento debe tener entre 7 y 11 dígitos")

        registered_document = get_owner_document(patente)
        result = (
            "VALIDADO"
            if registered_document is not None and registered_document == documento
            else "RECHAZADO"
        )
        payload = {
            "vehiculoExternoId": external_vehicle_id,
            "clienteId": customer_id,
            "documento": documento,
            "patente": patente,
            "resultado": result,
        }
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=EXTERNAL_VEHICLE_OWNERSHIP_VALIDATION,
            body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=pika.DeliveryMode.Persistent,
                type=EXTERNAL_VEHICLE_OWNERSHIP_VALIDATION,
                correlation_id=str(external_vehicle_id),
            ),
            mandatory=True,
        )
        channel.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(
            "Titularidad validada: vehiculoExternoId=%s clienteId=%s "
            "patente=%s resultado=%s",
            external_vehicle_id,
            customer_id,
            patente,
            result,
        )
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
        logger.error("Solicitud de titularidad inválida rechazada: %s", error)
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception:
        logger.exception("Error procesando la validación de titularidad")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    connection = pika.BlockingConnection(RabbitMqSettings().parameters())
    try:
        channel = connection.channel()
        declare_ownership_validation_topology(channel)
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(
            queue=EXTERNAL_VEHICLE_OWNERSHIP_QUEUE,
            on_message_callback=handle_message,
            auto_ack=False,
        )
        logger.info(
            "Esperando solicitudes de titularidad en %s",
            EXTERNAL_VEHICLE_OWNERSHIP_QUEUE,
        )
        channel.start_consuming()
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Consumer de titularidad detenido")
