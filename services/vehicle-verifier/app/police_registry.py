"""Acceso al registro policial simulado del Flujo A."""

from __future__ import annotations

import os
from contextlib import contextmanager

import mysql.connector
from mysql.connector import pooling


class PoliceRegistry:
    """Consulta patentes denunciadas en la base externa simulada."""

    def __init__(self) -> None:
        self.pool = pooling.MySQLConnectionPool(
            pool_name="police_registry_pool",
            pool_size=3,
            host=os.getenv("POLICE_DB_HOST", "localhost"),
            port=int(os.getenv("POLICE_DB_PORT", "3306")),
            database=os.getenv("POLICE_DB_NAME", "rentar_policial"),
            user=os.getenv("POLICE_DB_USER", "root"),
            password=os.getenv("POLICE_DB_PASSWORD", ""),
        )

    @contextmanager
    def connection(self):
        """Entrega una conexión y la devuelve al pool al terminar."""
        connection = self.pool.get_connection()
        try:
            yield connection
        finally:
            connection.close()

    def is_stolen(self, patente: str) -> bool:
        """Devuelve true si la patente existe y está marcada como robada."""
        query = """
            SELECT flag_robada
            FROM lk_registro_policial
            WHERE cod_patente = %s
        """
        with self.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (patente,))
            row = cursor.fetchone()
            cursor.close()
        return bool(row and row[0])
