from typing import Optional

from database import Database


class VehicleRepository:
    """Contiene las operaciones de persistencia de vehículos y reservas."""

    def __init__(self, database: Database):
        self.database = database

    @staticmethod
    def _map_vehicle(row) -> dict:
        """Convierte una fila de MySQL al mensaje definido en vehicle.proto."""
        return {
            "id": int(row[0]),
            "patente": row[1],
            "marca": row[2],
            "modelo": row[3],
            "estado": row[4],
            "anio": int(row[5]),
            "tipoVehiculo": row[6],
            "color": row[7] or "",
            "precio_diario": str(row[8]),
            "activo": bool(row[9]),
            "cliente_id": int(row[10]) if row[10] is not None else 0,
        }

    def find_all(self) -> list[dict]:
        """Devuelve todos los vehículos activos."""
        query = """
            SELECT id_vehiculo, cod_patente, desc_marca, desc_modelo,
                   desc_estado_vehiculo, num_anio, desc_tipo_vehiculo,
                   desc_color, f_val_precio_diario, flag_activo, id_cliente
            FROM lk_vehiculos
            WHERE flag_activo = 1
            ORDER BY id_vehiculo
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            cursor.close()
        return [self._map_vehicle(row) for row in rows]

    def find_by_id(self, vehicle_id: int) -> Optional[dict]:
        """Devuelve un vehículo por su identificador, esté activo o no."""
        query = """
            SELECT id_vehiculo, cod_patente, desc_marca, desc_modelo,
                   desc_estado_vehiculo, num_anio, desc_tipo_vehiculo,
                   desc_color, f_val_precio_diario, flag_activo, id_cliente
            FROM lk_vehiculos
            WHERE id_vehiculo = %s
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (vehicle_id,))
            row = cursor.fetchone()
            cursor.close()
        return self._map_vehicle(row) if row else None

    def create(
        self,
        patente: str,
        marca: str,
        modelo: str,
        anio: int,
        tipo_vehiculo: str,
        color: str,
        precio_diario: str,
    ) -> dict:
        """Inserta un vehículo nuevo y devuelve la fila creada."""
        query = """
            INSERT INTO lk_vehiculos (
                cod_patente, desc_marca, desc_modelo, num_anio,
                desc_color, desc_tipo_vehiculo, f_val_precio_diario,
                desc_estado_vehiculo, flag_activo
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'DISPONIBLE', 1)
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                query,
                (
                    patente,
                    marca,
                    modelo,
                    anio,
                    color,
                    tipo_vehiculo,
                    precio_diario,
                ),
            )
            connection.commit()
            vehicle_id = cursor.lastrowid
            cursor.close()
        return self.find_by_id(vehicle_id)

    def create_external(
        self,
        patente: str,
        marca: str,
        modelo: str,
        anio: int,
        tipo_vehiculo: str,
        color: str,
        precio_diario: str,
        client_id: int,
    ) -> dict:
        """Inserta una incorporación externa pendiente y asociada al cliente."""
        query = """
            INSERT INTO lk_vehiculos (
                cod_patente, desc_marca, desc_modelo, num_anio,
                desc_color, desc_tipo_vehiculo, f_val_precio_diario,
                desc_estado_vehiculo, flag_activo, id_cliente
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDIENTE', 1, %s)
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                query,
                (
                    patente,
                    marca,
                    modelo,
                    anio,
                    color,
                    tipo_vehiculo,
                    precio_diario,
                    client_id,
                ),
            )
            connection.commit()
            vehicle_id = cursor.lastrowid
            cursor.close()
        return self.find_by_id(vehicle_id)

    def find_external_by_client(self, client_id: int) -> list[dict]:
        """Devuelve solicitudes externas y sus resultados de validación."""
        query = """
            SELECT v.id_vehiculo, v.cod_patente, v.desc_marca,
                   v.desc_modelo, v.desc_estado_vehiculo,
                   c.resultado_patente, c.resultado_titularidad
            FROM lk_vehiculos v
            LEFT JOIN incorporacion_correlacion c
              ON c.vehiculo_externo_id = v.id_vehiculo
            WHERE v.id_cliente = %s
            ORDER BY v.id_vehiculo DESC
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (client_id,))
            rows = cursor.fetchall()
            cursor.close()
        return [
            {
                "id": int(row[0]),
                "patente": row[1],
                "marca": row[2],
                "modelo": row[3],
                "estado": row[4],
                "validacion_patente": row[5] or "",
                "validacion_titularidad": row[6] or "",
            }
            for row in rows
        ]

    def update(
        self,
        vehicle_id: int,
        marca: str,
        modelo: str,
        anio: int,
        tipo_vehiculo: str,
        color: str,
        precio_diario: str,
    ) -> Optional[dict]:
        """Modifica los datos editables de un vehículo activo."""
        query = """
            UPDATE lk_vehiculos
            SET desc_marca = %s,
                desc_modelo = %s,
                num_anio = %s,
                desc_tipo_vehiculo = %s,
                desc_color = %s,
                f_val_precio_diario = %s
            WHERE id_vehiculo = %s AND flag_activo = 1
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                query,
                (
                    marca,
                    modelo,
                    anio,
                    tipo_vehiculo,
                    color,
                    precio_diario,
                    vehicle_id,
                ),
            )
            connection.commit()
            updated = cursor.rowcount > 0
            cursor.close()
        return self.find_by_id(vehicle_id) if updated else None

    def has_active_reservations(self, vehicle_id: int) -> bool:
        """Indica si el vehículo tiene reservas futuras no canceladas."""
        query = """
            SELECT 1
            FROM ft_reservas
            WHERE id_vehiculo = %s
              AND desc_estado_reserva IN ('PENDIENTE', 'CONFIRMADA')
              AND hora_fin >= NOW()
            LIMIT 1
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (vehicle_id,))
            result = cursor.fetchone()
            cursor.close()
        return result is not None

    def deactivate(self, vehicle_id: int) -> Optional[dict]:
        """Realiza la baja lógica de un vehículo activo."""
        query = """
            UPDATE lk_vehiculos
            SET flag_activo = 0
            WHERE id_vehiculo = %s AND flag_activo = 1
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (vehicle_id,))
            connection.commit()
            updated = cursor.rowcount > 0
            cursor.close()
        return self.find_by_id(vehicle_id) if updated else None

    def reactivate(self, vehicle_id: int) -> Optional[dict]:
        """Reactiva un vehículo y conserva su estado operativo actual."""
        query = """
            UPDATE lk_vehiculos
            SET flag_activo = 1
            WHERE id_vehiculo = %s AND flag_activo = 0
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (vehicle_id,))
            connection.commit()
            updated = cursor.rowcount > 0
            cursor.close()
        return self.find_by_id(vehicle_id) if updated else None

    def find_available(self, fecha_inicio: str, fecha_fin: str) -> list[dict]:
        """Devuelve vehículos disponibles sin reservas superpuestas."""
        query = """
            SELECT v.id_vehiculo, v.cod_patente, v.desc_marca,
                   v.desc_modelo, v.desc_estado_vehiculo, v.num_anio,
                   v.desc_tipo_vehiculo, v.desc_color, v.f_val_precio_diario,
                   v.flag_activo, v.id_cliente
            FROM lk_vehiculos v
            WHERE v.flag_activo = 1
              AND v.desc_estado_vehiculo = 'DISPONIBLE'
              AND NOT EXISTS (
                  SELECT 1
                  FROM ft_reservas r
                  WHERE r.id_vehiculo = v.id_vehiculo
                    AND r.desc_estado_reserva <> 'CANCELADA'
                    AND r.hora_inicio < %s
                    AND r.hora_fin > %s
              )
            ORDER BY v.id_vehiculo
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (fecha_fin, fecha_inicio))
            rows = cursor.fetchall()
            cursor.close()
        return [self._map_vehicle(row) for row in rows]

    def update_status(self, vehicle_id: int, status: str) -> Optional[dict]:
        """Actualiza el estado de un vehículo activo y devuelve el resultado."""
        query = """
            UPDATE lk_vehiculos
            SET desc_estado_vehiculo = %s
            WHERE id_vehiculo = %s AND flag_activo = 1
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (status, vehicle_id))
            connection.commit()
            updated = cursor.rowcount > 0
            cursor.close()
        return self.find_by_id(vehicle_id) if updated else None

    def update_verification(
        self,
        vehicle_id: int,
        patente: str,
        verification: str,
    ) -> bool:
        """Aplica el resultado y desactiva el vehículo si fue denunciado.

        La patente se incluye en el filtro para evitar aplicar por error un
        resultado a otro vehículo si un mensaje llega con datos inconsistentes.
        Los resultados `VALIDADO` no modifican la base. La operación es
        idempotente para resultados `ROBADO` repetidos.
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                """
                SELECT 1
                FROM lk_vehiculos
                WHERE id_vehiculo = %s
                  AND cod_patente = %s
                LIMIT 1
                """,
                (vehicle_id, patente),
            )
            exists = cursor.fetchone() is not None
            if not exists:
                cursor.close()
                connection.rollback()
                return False

            if verification == "ROBADO":
                cursor.execute(
                    """
                    UPDATE lk_vehiculos
                    SET flag_activo = 0
                    WHERE id_vehiculo = %s
                      AND cod_patente = %s
                    """,
                    (vehicle_id, patente),
                )
                connection.commit()
            cursor.close()
        return True
