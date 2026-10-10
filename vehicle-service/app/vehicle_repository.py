from typing import Optional

from database import Database


class VehicleRepository:
    """Contiene las consultas a lk_vehiculos y ft_reservas."""

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
        }

    def find_all(self) -> list[dict]:
        """Devuelve todos los vehículos activos."""
        query = """
            SELECT id_vehiculo, cod_patente, desc_marca, desc_modelo,
                   desc_estado_vehiculo
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
        """Devuelve un vehículo activo por su identificador."""
        query = """
            SELECT id_vehiculo, cod_patente, desc_marca, desc_modelo,
                   desc_estado_vehiculo
            FROM lk_vehiculos
            WHERE id_vehiculo = %s AND flag_activo = 1
        """
        with self.database.connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, (vehicle_id,))
            row = cursor.fetchone()
            cursor.close()
        return self._map_vehicle(row) if row else None

    def find_available(self, fecha_inicio: str, fecha_fin: str) -> list[dict]:
        """Devuelve vehículos disponibles sin reservas superpuestas."""
        query = """
            SELECT v.id_vehiculo, v.cod_patente, v.desc_marca,
                   v.desc_modelo, v.desc_estado_vehiculo
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
