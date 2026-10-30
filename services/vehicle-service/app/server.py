import os
import sys
from concurrent import futures
from datetime import datetime
from pathlib import Path
from threading import Thread

import grpc
from mysql.connector import IntegrityError
from dotenv import load_dotenv

APP_DIRECTORY = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIRECTORY))

import vehicle_pb2
import vehicle_pb2_grpc
from database import Database
from vehicle_repository import VehicleRepository
from external_vehicle_publisher import ExternalVehiclePublisher
from vehicle_verification_publisher import VehicleVerificationPublisher
from vehicle_verification_result_consumer import VehicleVerificationResultConsumer

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def grpc_error(context, code, message):
    """Finaliza una llamada gRPC con un código y mensaje controlados."""
    context.set_code(code)
    context.set_details(message)


class VehicleService(vehicle_pb2_grpc.VehicleServiceServicer):
    """Implementa las operaciones definidas en vehicle.proto."""

    def __init__(
        self,
        repository: VehicleRepository,
        verification_publisher: VehicleVerificationPublisher,
    ):
        self.repository = repository
        self.verification_publisher = verification_publisher

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

    def CreateVehicle(self, request, context):
        """Crea un vehículo activo con estado operativo DISPONIBLE."""
        validation_error = self._validate_vehicle_data(request)
        if validation_error:
            return self._abort(context, grpc.StatusCode.INVALID_ARGUMENT, validation_error)

        try:
            vehicle = self.repository.create(
                request.patente.strip(),
                request.marca.strip(),
                request.modelo.strip(),
                request.anio,
                request.tipoVehiculo.strip(),
                request.color.strip(),
                request.precio_diario.strip(),
            )
            # El ID se obtiene después de insertar. El evento se publica solo
            # después de persistir el vehículo para que el consumidor pueda
            # correlacionarlo con un registro real de lk_vehiculos.
            self.verification_publisher.publish(
                vehicle["id"],
                vehicle["patente"],
            )
            return self._vehicle_response(vehicle)
        except IntegrityError:
            return self._abort(
                context,
                grpc.StatusCode.ALREADY_EXISTS,
                "Ya existe un vehículo con esa patente",
            )
        except Exception as error:
            print(f"CreateVehicle error: {error}", flush=True)
            return self._abort(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudo crear el vehículo",
            )

    def CreateExternalVehicle(self, request, context):
        """Crea un vehículo pendiente y publica el inicio del Flujo B."""
        if request.cliente_id <= 0:
            return self._abort(
                context,
                grpc.StatusCode.INVALID_ARGUMENT,
                "El identificador del cliente no es válido",
            )
        validation_error = self._validate_vehicle_data(request)
        if validation_error:
            return self._abort(context, grpc.StatusCode.INVALID_ARGUMENT, validation_error)

        try:
            vehicle = self.repository.create_external(
                request.patente.strip(),
                request.marca.strip(),
                request.modelo.strip(),
                request.anio,
                request.tipoVehiculo.strip(),
                request.color.strip(),
                request.precio_diario.strip(),
                request.cliente_id,
            )
            ExternalVehiclePublisher().publish(
                vehicle["id"],
                request.cliente_id,
                vehicle["patente"],
            )
            return self._vehicle_response(vehicle)
        except IntegrityError:
            return self._abort(
                context,
                grpc.StatusCode.ALREADY_EXISTS,
                "Ya existe un vehículo con esa patente",
            )
        except Exception as error:
            print(f"CreateExternalVehicle error: {error}", flush=True)
            return self._abort(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudo registrar el vehículo externo",
            )

    def UpdateVehicle(self, request, context):
        """Modifica los datos editables de un vehículo activo."""
        if request.id <= 0:
            return self._abort(
                context,
                grpc.StatusCode.INVALID_ARGUMENT,
                "El identificador del vehículo no es válido",
            )
        validation_error = self._validate_vehicle_data(request, include_patente=False)
        if validation_error:
            return self._abort(context, grpc.StatusCode.INVALID_ARGUMENT, validation_error)

        try:
            vehicle = self.repository.update(
                request.id,
                request.marca.strip(),
                request.modelo.strip(),
                request.anio,
                request.tipoVehiculo.strip(),
                request.color.strip(),
                request.precio_diario.strip(),
            )
            if vehicle is None:
                return self._abort(
                    context,
                    grpc.StatusCode.NOT_FOUND,
                    "Vehículo no encontrado o inactivo",
                )
            return self._vehicle_response(vehicle)
        except Exception as error:
            print(f"UpdateVehicle error: {error}", flush=True)
            return self._abort(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudo modificar el vehículo",
            )

    def DeleteVehicle(self, request, context):
        """Realiza la baja lógica, rechazándola si hay reservas activas."""
        if request.id <= 0:
            return self._abort(
                context,
                grpc.StatusCode.INVALID_ARGUMENT,
                "El identificador del vehículo no es válido",
            )
        try:
            vehicle = self.repository.find_by_id(request.id)
            if vehicle is None:
                return self._abort(
                    context, grpc.StatusCode.NOT_FOUND, "Vehículo no encontrado"
                )
            if not vehicle["activo"]:
                return self._abort(
                    context, grpc.StatusCode.FAILED_PRECONDITION,
                    "El vehículo ya está dado de baja",
                )
            if self.repository.has_active_reservations(request.id):
                return self._abort(
                    context,
                    grpc.StatusCode.FAILED_PRECONDITION,
                    "No se puede dar de baja el vehículo porque tiene reservas activas",
                )
            return self._vehicle_response(self.repository.deactivate(request.id))
        except Exception as error:
            print(f"DeleteVehicle error: {error}", flush=True)
            return self._abort(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudo dar de baja el vehículo",
            )

    def ReactivateVehicle(self, request, context):
        """Reactiva un vehículo dado de baja lógicamente."""
        if request.id <= 0:
            return self._abort(
                context,
                grpc.StatusCode.INVALID_ARGUMENT,
                "El identificador del vehículo no es válido",
            )
        try:
            vehicle = self.repository.reactivate(request.id)
            if vehicle is None:
                return self._abort(
                    context,
                    grpc.StatusCode.NOT_FOUND,
                    "Vehículo no encontrado o ya activo",
                )
            return self._vehicle_response(vehicle)
        except Exception as error:
            print(f"ReactivateVehicle error: {error}", flush=True)
            return self._abort(
                context,
                grpc.StatusCode.INTERNAL,
                "No se pudo reactivar el vehículo",
            )

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
    def _vehicle_response(vehicle):
        """Convierte una fila de persistencia en la respuesta gRPC."""
        return vehicle_pb2.VehicleResponse(
            vehicle=vehicle_pb2.Vehicle(**vehicle)
        )

    @staticmethod
    def _abort(context, code, message):
        """Finaliza una llamada con un error gRPC y respuesta vacía."""
        context.set_code(code)
        context.set_details(message)
        return vehicle_pb2.VehicleResponse()

    @staticmethod
    def _validate_vehicle_data(request, include_patente=True):
        """Valida los datos comunes antes de acceder a la base de datos."""
        required_fields = []
        if include_patente:
            required_fields.append(("patente", request.patente))
        required_fields.extend(
            (
                ("marca", request.marca),
                ("modelo", request.modelo),
                ("tipoVehiculo", request.tipoVehiculo),
                ("color", request.color),
                ("precio_diario", request.precio_diario),
            )
        )
        for field_name, value in required_fields:
            if not value.strip():
                return f"El campo {field_name} es obligatorio"
        if request.anio <= 0:
            return "El año del vehículo no es válido"
        try:
            price = float(request.precio_diario)
        except ValueError:
            return "El precio diario no es válido"
        if price < 0:
            return "El precio diario no puede ser negativo"
        return None

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
    result_consumer = VehicleVerificationResultConsumer(repository)
    Thread(
        target=result_consumer.run,
        name="vehicle-verification-result-consumer",
        daemon=True,
    ).start()

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    vehicle_pb2_grpc.add_VehicleServiceServicer_to_server(
        VehicleService(repository, VehicleVerificationPublisher()), server
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
