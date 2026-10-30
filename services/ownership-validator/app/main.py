import logging
import os
import re
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Validador de titularidad")


class SolicitudValidacion(BaseModel):
    patente: str
    numero_documento: str

    @field_validator("patente")
    @classmethod
    def normalizar_patente(cls, value: str) -> str:
        patente = re.sub(r"[\s-]", "", value).upper()
        if not re.fullmatch(r"[A-Z0-9]{6,7}", patente):
            raise ValueError("La patente debe tener entre 6 y 7 caracteres alfanuméricos")
        return patente

    @field_validator("numero_documento")
    @classmethod
    def normalizar_documento(cls, value: str) -> str:
        documento = re.sub(r"\D", "", value)
        if not 7 <= len(documento) <= 11:
            raise ValueError("El número de documento debe tener entre 7 y 11 dígitos")
        return documento


def consultar_titular(patente: str) -> str | None:
    connection = None
    cursor = None

    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_NAME", "Rentar_RegistroAutomotor"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
        )
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT cod_documento_titular
            FROM lk_registro_titularidad
            WHERE cod_patente = %s
            """,
            (patente,),
        )
        registro = cursor.fetchone()
        return registro["cod_documento_titular"] if registro else None
    except mysql.connector.Error as error:
        logger.exception("No se pudo consultar el registro de titularidad")
        raise HTTPException(
            status_code=503,
            detail={
                "codigo": "REGISTRO_NO_DISPONIBLE",
                "mensaje": "No se pudo consultar el registro de titularidad",
            },
        ) from error
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


@app.post("/api/titularidad/validar")
def validar_titularidad(solicitud: SolicitudValidacion):
    documento_registrado = consultar_titular(solicitud.patente)

    if documento_registrado is None:
        return {
            "valido": False,
            "codigo": "PATENTE_NO_REGISTRADA",
            "mensaje": "La patente no figura en el registro de titularidad",
        }

    if documento_registrado != solicitud.numero_documento:
        return {
            "valido": False,
            "codigo": "DOCUMENTO_NO_COINCIDE",
            "mensaje": "El documento no coincide con el titular registrado",
        }

    return {
        "valido": True,
        "codigo": "TITULARIDAD_VALIDADA",
        "mensaje": "La patente y el documento coinciden con el registro",
    }