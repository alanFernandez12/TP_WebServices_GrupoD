import os
from contextlib import contextmanager

import mysql.connector
from mysql.connector import pooling


class Database:
    """Administra el pool de conexiones a la base de datos Rentar."""

    def __init__(self):
        self.pool = pooling.MySQLConnectionPool(
            pool_name="vehicle_pool",
            pool_size=5,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_NAME", "Rentar"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
        )

    @contextmanager
    def connection(self):
        """Entrega una conexión y la devuelve al pool al terminar."""
        connection = self.pool.get_connection()
        try:
            yield connection
        finally:
            connection.close()

    def check_connection(self):
        """Comprueba que MySQL esté disponible."""
        with self.connection() as connection:
            connection.ping(reconnect=True, attempts=1, delay=0)
