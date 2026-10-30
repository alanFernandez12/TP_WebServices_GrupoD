"""Persistencia transaccional de la correlación del Flujo B."""

from __future__ import annotations

import os
from contextlib import contextmanager

import mysql.connector
from mysql.connector import pooling


class CorrelationRepository:
    """Actualiza correlaciones y vehículos de forma idempotente."""

    def __init__(self) -> None:
        self.pool = pooling.MySQLConnectionPool(
            pool_name="external_vehicle_correlation_pool",
            pool_size=3,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_NAME", "Rentar"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
        )

    @contextmanager
    def connection(self):
        connection = self.pool.get_connection()
        try:
            yield connection
        finally:
            connection.close()

    def register_result(
        self,
        vehicle_id: int,
        validation_type: str,
        result: str,
        patente: str = "",
        client_id: int | None = None,
    ) -> bool:
        """Guarda un resultado y devuelve si debe publicarse el evento final."""
        column = {
            "patente": "resultado_patente",
            "titularidad": "resultado_titularidad",
        }[validation_type]

        with self.connection() as connection:
            cursor = connection.cursor(dictionary=True)
            try:
                cursor.execute(
                    """
                    SELECT id_correlacion, resultado_patente,
                           resultado_titularidad, resultado_final,
                           evento_completada_publicado
                    FROM incorporacion_correlacion
                    WHERE vehiculo_externo_id = %s
                    FOR UPDATE
                    """,
                    (vehicle_id,),
                )
                state = cursor.fetchone()
                if state is None:
                    cursor.execute(
                        """
                        INSERT INTO incorporacion_correlacion (
                            vehiculo_externo_id, cliente_id, patente
                        )
                        SELECT id_vehiculo, %s, cod_patente
                        FROM lk_vehiculos
                        WHERE id_vehiculo = %s
                        """,
                        (client_id, vehicle_id),
                    )
                    if cursor.rowcount != 1:
                        raise LookupError(
                            f"Vehículo externo inexistente: {vehicle_id}"
                        )
                    cursor.execute(
                        """
                        SELECT id_correlacion, resultado_patente,
                               resultado_titularidad, resultado_final,
                               evento_completada_publicado
                        FROM incorporacion_correlacion
                        WHERE vehiculo_externo_id = %s
                        FOR UPDATE
                        """,
                        (vehicle_id,),
                    )
                    state = cursor.fetchone()

                if (
                    state["resultado_final"] == "VALIDADO"
                    and not state["evento_completada_publicado"]
                ):
                    connection.commit()
                    return True
                if state["resultado_final"] is not None:
                    connection.commit()
                    return False

                cursor.execute(
                    f"""
                    UPDATE incorporacion_correlacion
                    SET {column} = %s,
                        patente = CASE
                            WHEN %s <> '' THEN %s
                            ELSE patente
                        END,
                        cliente_id = COALESCE(%s, cliente_id)
                    WHERE vehiculo_externo_id = %s
                      AND resultado_final IS NULL
                    """,
                    (result, patente, patente, client_id, vehicle_id),
                )

                if result == "RECHAZADO":
                    cursor.execute(
                        """
                        UPDATE incorporacion_correlacion
                        SET resultado_final = 'RECHAZADO',
                            fecha_finalizacion = CURRENT_TIMESTAMP
                        WHERE vehiculo_externo_id = %s
                          AND resultado_final IS NULL
                        """,
                        (vehicle_id,),
                    )
                    cursor.execute(
                        """
                        UPDATE lk_vehiculos
                        SET desc_estado_vehiculo = 'PENDIENTE',
                            flag_activo = 0
                        WHERE id_vehiculo = %s
                        """,
                        (vehicle_id,),
                    )
                    connection.commit()
                    return False

                cursor.execute(
                    """
                    UPDATE incorporacion_correlacion
                    SET resultado_final = 'VALIDADO',
                        fecha_finalizacion = CURRENT_TIMESTAMP
                    WHERE vehiculo_externo_id = %s
                      AND resultado_patente = 'VALIDADO'
                      AND resultado_titularidad = 'VALIDADO'
                      AND resultado_final IS NULL
                    """,
                    (vehicle_id,),
                )
                completed = cursor.rowcount == 1
                if completed:
                    cursor.execute(
                        """
                        UPDATE lk_vehiculos
                        SET desc_estado_vehiculo = 'DISPONIBLE',
                            flag_activo = 1
                        WHERE id_vehiculo = %s
                        """,
                        (vehicle_id,),
                    )
                connection.commit()
                return completed
            except Exception:
                connection.rollback()
                raise
            finally:
                cursor.close()

    def mark_completion_published(self, vehicle_id: int) -> None:
        """Marca el evento final después de publicarlo en RabbitMQ."""
        with self.connection() as connection:
            cursor = connection.cursor()
            try:
                cursor.execute(
                    """
                    UPDATE incorporacion_correlacion
                    SET evento_completada_publicado = 1
                    WHERE vehiculo_externo_id = %s
                      AND resultado_final = 'VALIDADO'
                    """,
                    (vehicle_id,),
                )
                connection.commit()
            except Exception:
                connection.rollback()
                raise
            finally:
                cursor.close()
