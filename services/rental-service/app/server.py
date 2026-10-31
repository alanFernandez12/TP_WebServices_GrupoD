import logging
import os
import sys
from concurrent import futures
from datetime import datetime
from pathlib import Path
from threading import Thread

import grpc
from dotenv import load_dotenv

APP_DIRECTORY = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIRECTORY))

import rental_pb2
import rental_pb2_grpc
from database import Database
from errors import InvalidRental, RentalConflict, RentalNotFound, ResourceNotFound
from maintenance_events import MaintenancePublisher, MaintenanceResultConsumer
from rental_repository import RentalRepository

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def parse_datetime(value):
    if not value:
        raise InvalidRental("Las fechas de inicio y fin son obligatorias")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise InvalidRental("Las fechas deben tener formato ISO 8601") from error

    if parsed.tzinfo is not None:
        raise InvalidRental(
            "Las fechas deben enviarse sin zona horaria, en hora local"
        )
    return parsed


def to_proto(row):
    return rental_pb2.Rental(
        id=int(row["id_reserva"]),
        cliente_id=int(row["id_cliente"]),
        vehiculo_id=int(row["id_vehiculo"]),
        fecha_inicio=row["hora_inicio"].isoformat(timespec="seconds"),
        fecha_fin=row["hora_fin"].isoformat(timespec="seconds"),
        estado=row["desc_estado_reserva"],
        duracion_dias=int(row["num_duracion_dias"]),
        precio_diario_historico=str(row["f_val_precio_diario_historico"]),
        importe_total=str(row["f_val_importe_total"]),
        desc_mantenimiento=row["desc_mantenimiento"] or "",
    )


class RentalService(rental_pb2_grpc.RentalServiceServicer):
    def __init__(self, repository, maintenance_publisher):
        self.repository = repository
        self.maintenance_publisher = maintenance_publisher

    @staticmethod
    def _handle_error(error, context):
        if isinstance(error, InvalidRental):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(error))
        if isinstance(error, ResourceNotFound):
            context.abort(grpc.StatusCode.NOT_FOUND, str(error))
        if isinstance(error, RentalNotFound):
            context.abort(grpc.StatusCode.NOT_FOUND, str(error))
        if isinstance(error, RentalConflict):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, str(error))

        logger.exception("Error inesperado en Rental Service", exc_info=error)
        context.abort(
            grpc.StatusCode.INTERNAL,
            "No se pudo completar la operación de reservas",
        )

    def CreateRental(self, request, context):
        try:
            if request.cliente_id <= 0 or request.vehiculo_id <= 0:
                raise InvalidRental("Cliente y vehículo son obligatorios")

            start = parse_datetime(request.fecha_inicio)
            end = parse_datetime(request.fecha_fin)
            now = datetime.now()

            if start <= now:
                raise InvalidRental("La fecha de inicio debe ser futura")
            if end <= start:
                raise InvalidRental(
                    "La fecha de finalización debe ser posterior al inicio"
                )

            duration_days = (end - start).days
            if (end - start).seconds or (end - start).microseconds:
                duration_days += 1

            row = self.repository.create(
                request.cliente_id,
                request.vehiculo_id,
                start,
                end,
                duration_days,
            )

            # El mantenimiento es informativo: si RabbitMQ falla, la reserva igual se confirma.
            try:
                self.maintenance_publisher.publish(
                    row["id_reserva"], row["id_vehiculo"],
                    row["hora_inicio"], row["hora_fin"],
                )
            except Exception:
                logger.exception("No se pudo publicar reserva.confirmada")

            return rental_pb2.RentalResponse(rental=to_proto(row))
        except Exception as error:
            self._handle_error(error, context)

    def GetRentals(self, request, context):
        try:
            rows = self.repository.find_all()
            return rental_pb2.RentalListResponse(
                rentals=[to_proto(row) for row in rows]
            )
        except Exception as error:
            self._handle_error(error, context)

    def GetRental(self, request, context):
        try:
            if request.id <= 0:
                raise InvalidRental("El identificador de reserva no es válido")
            row = self.repository.find_by_id(request.id)
            return rental_pb2.RentalResponse(rental=to_proto(row))
        except Exception as error:
            self._handle_error(error, context)

    def CancelRental(self, request, context):
        try:
            if request.id <= 0:
                raise InvalidRental("El identificador de reserva no es válido")
            row = self.repository.cancel(request.id, datetime.now())
            return rental_pb2.RentalResponse(rental=to_proto(row))
        except Exception as error:
            self._handle_error(error, context)

    def GetRentalHistory(self, request, context):
        try:
            if request.cliente_id <= 0:
                raise InvalidRental("El identificador del cliente no es válido")
            rows = self.repository.find_history(request.cliente_id)
            return rental_pb2.RentalListResponse(
                rentals=[to_proto(row) for row in rows]
            )
        except Exception as error:
            self._handle_error(error, context)


def serve():
    database = Database()
    database.check_connection()

    repository = RentalRepository(database)
    Thread(
        target=MaintenanceResultConsumer(repository).run,
        name="maintenance-result-consumer",
        daemon=True,
    ).start()

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    rental_pb2_grpc.add_RentalServiceServicer_to_server(
        RentalService(repository, MaintenancePublisher()), server
    )

    port = os.getenv("RENTAL_GRPC_PORT", "9093")
    if server.add_insecure_port(f"0.0.0.0:{port}") == 0:
        raise RuntimeError(f"No se pudo abrir el puerto gRPC {port}")

    server.start()
    logger.info("Rental gRPC Service escuchando en 0.0.0.0:%s", port)
    server.wait_for_termination()


if __name__ == "__main__":
    try:
        serve()
    except Exception:
        logger.exception("No se pudo iniciar Rental Service")
        raise SystemExit(1)