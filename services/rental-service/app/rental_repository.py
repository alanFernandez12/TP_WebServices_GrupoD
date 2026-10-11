from decimal import Decimal, ROUND_HALF_UP

from errors import RentalConflict, RentalNotFound, ResourceNotFound


class RentalRepository:
    """Acceso a reservas y tablas relacionadas en MySQL."""

    def __init__(self, database):
        self.database = database

    @staticmethod
    def _find_rental(cursor, rental_id):
        cursor.execute(
            """
            SELECT id_reserva, id_cliente, id_vehiculo, hora_inicio, hora_fin,
                   num_duracion_dias, f_val_precio_diario_historico,
                   f_val_importe_total, desc_estado_reserva
            FROM ft_reservas
            WHERE id_reserva = %s
            """,
            (rental_id,),
        )
        return cursor.fetchone()

    def create(self, client_id, vehicle_id, start, end, duration_days):
        with self.database.connection() as connection:
            try:
                connection.start_transaction()
                with connection.cursor(dictionary=True) as cursor:
                    cursor.execute(
                        """
                        SELECT flag_activo
                        FROM lk_clientes
                        WHERE id_cliente = %s
                            FOR UPDATE
                        """,
                        (client_id,),
                    )
                    client = cursor.fetchone()
                    if client is None:
                        raise ResourceNotFound("Cliente no encontrado")
                    if not client["flag_activo"]:
                        raise RentalConflict("El cliente no está activo")

                    cursor.execute(
                        """
                        SELECT flag_activo, desc_estado_vehiculo,
                               f_val_precio_diario
                        FROM lk_vehiculos
                        WHERE id_vehiculo = %s
                            FOR UPDATE
                        """,
                        (vehicle_id,),
                    )
                    vehicle = cursor.fetchone()
                    if vehicle is None:
                        raise ResourceNotFound("Vehículo no encontrado")
                    if not vehicle["flag_activo"]:
                        raise RentalConflict("El vehículo no está activo")
                    if vehicle["desc_estado_vehiculo"] != "DISPONIBLE":
                        raise RentalConflict("El vehículo no está disponible")

                    cursor.execute(
                        """
                        SELECT 1
                        FROM ft_reservas
                        WHERE id_vehiculo = %s
                          AND desc_estado_reserva <> 'CANCELADA'
                          AND hora_inicio < %s
                          AND hora_fin > %s
                        LIMIT 1
                        """,
                        (vehicle_id, end, start),
                    )
                    if cursor.fetchone():
                        raise RentalConflict(
                            "El vehículo no está disponible durante el período solicitado"
                        )

                    start_date = start.date()
                    cursor.execute(
                        """
                        SELECT id_tiempo
                        FROM lk_tiempo
                        WHERE fecha_calendario = %s
                        ORDER BY id_tiempo
                        LIMIT 1
                        """,
                        (start_date,),
                    )
                    time_row = cursor.fetchone()

                    if time_row is None:
                        cursor.execute(
                            """
                            INSERT INTO lk_tiempo (
                                fecha_calendario, num_anio, num_mes, num_dia,
                                desc_nombre_mes, desc_dia_semana
                            )
                            VALUES (%s, %s, %s, %s, %s, %s)
                            """,
                            (
                                start_date,
                                start_date.year,
                                start_date.month,
                                start_date.day,
                                start_date.strftime("%B").upper(),
                                start_date.strftime("%A").upper(),
                            ),
                        )
                        time_id = cursor.lastrowid
                    else:
                        time_id = time_row["id_tiempo"]

                    daily_price = Decimal(
                        str(vehicle["f_val_precio_diario"])
                    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    total = (daily_price * duration_days).quantize(
                        Decimal("0.01"), rounding=ROUND_HALF_UP
                    )

                    cursor.execute(
                        """
                        INSERT INTO ft_reservas (
                            id_tiempo, id_cliente, id_vehiculo, hora_inicio,
                            hora_fin, num_duracion_dias,
                            f_val_precio_diario_historico, f_val_importe_total,
                            desc_estado_reserva
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'CONFIRMADA')
                        """,
                        (
                            time_id,
                            client_id,
                            vehicle_id,
                            start,
                            end,
                            duration_days,
                            daily_price,
                            total,
                        ),
                    )
                    rental_id = cursor.lastrowid
                    rental = self._find_rental(cursor, rental_id)

                connection.commit()
                return rental
            except Exception:
                connection.rollback()
                raise

    def find_all(self):
        with self.database.connection() as connection:
            with connection.cursor(dictionary=True) as cursor:
                cursor.execute(
                    """
                    SELECT id_reserva, id_cliente, id_vehiculo, hora_inicio,
                           hora_fin, num_duracion_dias,
                           f_val_precio_diario_historico, f_val_importe_total,
                           desc_estado_reserva
                    FROM ft_reservas
                    ORDER BY id_reserva
                    """
                )
                return cursor.fetchall()

    def find_by_id(self, rental_id):
        with self.database.connection() as connection:
            with connection.cursor(dictionary=True) as cursor:
                rental = self._find_rental(cursor, rental_id)
                if rental is None:
                    raise RentalNotFound("Reserva no encontrada")
                return rental

    def cancel(self, rental_id, now):
        with self.database.connection() as connection:
            try:
                connection.start_transaction()
                with connection.cursor(dictionary=True) as cursor:
                    cursor.execute(
                        """
                        SELECT id_reserva, desc_estado_reserva, hora_inicio
                        FROM ft_reservas
                        WHERE id_reserva = %s
                            FOR UPDATE
                        """,
                        (rental_id,),
                    )
                    reservation = cursor.fetchone()
                    if reservation is None:
                        raise RentalNotFound("Reserva no encontrada")
                    if reservation["desc_estado_reserva"] == "CANCELADA":
                        raise RentalConflict("La reserva ya está cancelada")
                    if reservation["hora_inicio"] <= now:
                        raise RentalConflict(
                            "La cancelación solo puede realizarse antes del inicio del alquiler"
                        )

                    cursor.execute(
                        """
                        UPDATE ft_reservas
                        SET desc_estado_reserva = 'CANCELADA'
                        WHERE id_reserva = %s
                        """,
                        (rental_id,),
                    )
                    rental = self._find_rental(cursor, rental_id)

                connection.commit()
                return rental
            except Exception:
                connection.rollback()
                raise

    def find_history(self, client_id):
        with self.database.connection() as connection:
            with connection.cursor(dictionary=True) as cursor:
                cursor.execute(
                    "SELECT id_cliente FROM lk_clientes WHERE id_cliente = %s",
                    (client_id,),
                )
                if cursor.fetchone() is None:
                    raise ResourceNotFound("Cliente no encontrado")

                cursor.execute(
                    """
                    SELECT id_reserva, id_cliente, id_vehiculo, hora_inicio,
                           hora_fin, num_duracion_dias,
                           f_val_precio_diario_historico, f_val_importe_total,
                           desc_estado_reserva
                    FROM ft_reservas
                    WHERE id_cliente = %s
                      AND desc_estado_reserva IN ('TERMINADA', 'CANCELADA')
                    ORDER BY hora_inicio DESC
                    """,
                    (client_id,),
                )
                return cursor.fetchall()