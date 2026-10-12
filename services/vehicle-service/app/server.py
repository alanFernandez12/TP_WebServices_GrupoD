import os
import sys
from concurrent import futures
from datetime import datetime
from pathlib import Path

import grpc
from dotenv import load_dotenv

APP_DIRECTORY = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIRECTORY))

import vehicle_pb2
import vehicle_pb2_grpc
from database import Database
from vehicle_repository import VehicleRepository

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def grpc_error(context, code, message):
    """Finaliza una llamada gRPC con un código y mensaje controlados."""
    context.set_code(code)
    context.set_details(message)


class VehicleService(vehicle_pb2_grpc.VehicleServiceServicer):
    """Implementa las operaciones definidas en vehicle.proto."""

    def __init__(self, repository: VehicleRepository):
        self.repository = repository

    def GetVehicles(self, request, context):
        """Devuelve todos los vehículos activos de la base."""
        try:
            vehicles = self.repository.find_all()
            return vehicle_pb2.VehicleListResponse(
                vehicles=[vehicle_pb2.Vehicle(**vehicle) for vehicle in vehicles]
            )
        except Exception as error:
            print(f"GetVehicles error: {error}", flush=True)
            grpc_error(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudieron consultar los vehículos",
            )
            return vehicle_pb2.VehicleListResponse()

    def GetVehicle(self, request, context):
        """Devuelve un vehículo activo por ID."""
        try:
            vehicle = self.repository.find_by_id(request.id)
            if vehicle is None:
                grpc_error(context, grpc.StatusCode.NOT_FOUND, "Vehículo no encontrado")
                return vehicle_pb2.VehicleResponse()
            return vehicle_pb2.VehicleResponse(
                vehicle=vehicle_pb2.Vehicle(**vehicle)
            )
        except Exception as error:
            print(f"GetVehicle error: {error}", flush=True)
            grpc_error(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudo consultar el vehículo",
            )
            return vehicle_pb2.VehicleResponse()

    def GetAvailableVehicles(self, request, context):
        """Devuelve vehículos disponibles sin reservas superpuestas."""
        if not self._valid_date_range(request.fecha_inicio, request.fecha_fin):
            grpc_error(
                context,
                grpc.StatusCode.INVALID_ARGUMENT,
                "El rango de fechas no es válido",
            )
            return vehicle_pb2.VehicleListResponse()

        try:
            vehicles = self.repository.find_available(
                request.fecha_inicio, request.fecha_fin
            )
            return vehicle_pb2.VehicleListResponse(
                vehicles=[vehicle_pb2.Vehicle(**vehicle) for vehicle in vehicles]
            )
        except Exception as error:
            print(f"GetAvailableVehicles error: {error}", flush=True)
            grpc_error(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudieron consultar los vehículos disponibles",
            )
            return vehicle_pb2.VehicleListResponse()

    def UpdateVehicleStatus(self, request, context):
        """Actualiza el estado de un vehículo activo."""
        allowed_statuses = {"DISPONIBLE", "RESERVADO", "EN_ALQUILER"}
        status = request.estado.strip().upper()
        if status not in allowed_statuses:
            grpc_error(
                context,
                grpc.StatusCode.INVALID_ARGUMENT,
                "El estado debe ser DISPONIBLE, RESERVADO o EN_ALQUILER",
            )
            return vehicle_pb2.VehicleResponse()

        try:
            vehicle = self.repository.update_status(request.id, status)
            if vehicle is None:
                grpc_error(context, grpc.StatusCode.NOT_FOUND, "Vehículo no encontrado")
                return vehicle_pb2.VehicleResponse()
            return vehicle_pb2.VehicleResponse(
                vehicle=vehicle_pb2.Vehicle(**vehicle)
            )
        except Exception as error:
            print(f"UpdateVehicleStatus error: {error}", flush=True)
            grpc_error(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudo actualizar el estado del vehículo",
            )
            return vehicle_pb2.VehicleResponse()

    @staticmethod
    def _valid_date_range(start: str, end: str) -> bool:
        """Valida fechas ISO y verifica que el inicio sea anterior al fin."""
        if not start or not end:
            return False
        try:
            return datetime.fromisoformat(start) < datetime.fromisoformat(end)
        except ValueError:
            return False


def serve():
    """Conecta MySQL, inicia el servidor gRPC y espera solicitudes."""
    database = Database()
    database.check_connection()
    repository = VehicleRepository(database)
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    vehicle_pb2_grpc.add_VehicleServiceServicer_to_server(
        VehicleService(repository), server
    )
    port = os.getenv("VEHICLE_GRPC_PORT", "9091")
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"Vehicle gRPC Service escuchando en 0.0.0.0:{port}")
    server.wait_for_termination()


if __name__ == "__main__":
    try:
        serve()
    except Exception as error:
        print(
            "No se pudo iniciar el servicio. Revise MySQL y las variables "
            "DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD."
        )
        print(error)
        raise SystemExit(1)
