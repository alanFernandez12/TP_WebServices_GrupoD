import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import "dotenv/config";
import path from "path";
import { checkDatabaseConnection, database } from "./database";
import { VehicleRepository } from "./vehicleRepository";

const PROTO_PATH = path.resolve(
  __dirname,
  "../../proto/vehicle.proto"
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(
  packageDefinition
) as any;

const vehicleRepository = new VehicleRepository();

/**
 * Crea un error gRPC con el código que el API Gateway puede traducir a HTTP.
 */
const grpcError = (
  code: grpc.status,
  message: string
): grpc.ServiceError => {
  const error = new Error(message) as grpc.ServiceError;
  error.code = code;
  return error;
};

/**
 * Comprueba que un texto tenga el formato de fecha aceptado por MySQL.
 */
const isValidDate = (value: string): boolean => {
  return !Number.isNaN(Date.parse(value));
};

/**
 * Implementa las operaciones definidas por VehicleService en vehicle.proto.
 */
const vehicleService = {
  /**
   * Devuelve todos los vehículos activos de la base de datos.
   */
  GetVehicles: async (
    _call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) => {
    try {
      const vehicles = await vehicleRepository.findAll();
      callback(null, { vehicles });
    } catch (error) {
      callback(
        grpcError(grpc.status.INTERNAL, "No se pudieron consultar los vehículos"),
        null
      );
    }
  },

  /**
   * Devuelve un vehículo activo usando su identificador.
   */
  GetVehicle: async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) => {
    try {
      const vehicle = await vehicleRepository.findById(
        String(call.request.id)
      );

      if (!vehicle) {
        callback(
          grpcError(grpc.status.NOT_FOUND, "Vehículo no encontrado"),
          null
        );
        return;
      }

      callback(null, { vehicle });
    } catch (error) {
      callback(
        grpcError(grpc.status.INTERNAL, "No se pudo consultar el vehículo"),
        null
      );
    }
  },

  /**
   * Devuelve vehículos disponibles sin reservas que se superpongan
   * con el período solicitado.
   */
  GetAvailableVehicles: async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) => {
    const { fechaInicio, fechaFin } = call.request;

    if (
      !fechaInicio ||
      !fechaFin ||
      !isValidDate(fechaInicio) ||
      !isValidDate(fechaFin) ||
      new Date(fechaInicio) >= new Date(fechaFin)
    ) {
      callback(
        grpcError(
          grpc.status.INVALID_ARGUMENT,
          "El rango de fechas no es válido"
        ),
        null
      );
      return;
    }

    try {
      const vehicles = await vehicleRepository.findAvailable(
        fechaInicio,
        fechaFin
      );
      callback(null, { vehicles });
    } catch (error) {
      callback(
        grpcError(
          grpc.status.INTERNAL,
          "No se pudieron consultar los vehículos disponibles"
        ),
        null
      );
    }
  },

  /**
   * Actualiza en la base el estado de un vehículo activo.
   */
  UpdateVehicleStatus: async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) => {
    const id = String(call.request.id);
    const estado = String(call.request.estado || "").trim().toUpperCase();
    const allowedStatuses = ["DISPONIBLE", "RESERVADO", "EN_ALQUILER"];

    if (!allowedStatuses.includes(estado)) {
      callback(
        grpcError(
          grpc.status.INVALID_ARGUMENT,
          "El estado debe ser DISPONIBLE, RESERVADO o EN_ALQUILER"
        ),
        null
      );
      return;
    }

    try {
      const vehicle = await vehicleRepository.updateStatus(id, estado);

      if (!vehicle) {
        callback(
          grpcError(grpc.status.NOT_FOUND, "Vehículo no encontrado"),
          null
        );
        return;
      }

      callback(null, { vehicle });
    } catch (error) {
      callback(
        grpcError(
          grpc.status.INTERNAL,
          "No se pudo actualizar el estado del vehículo"
        ),
        null
      );
    }
  },
};

/**
 * Crea el servidor gRPC y registra las operaciones de vehículos.
 */
const server = new grpc.Server();

server.addService(
  proto.vehicle.VehicleService.service,
  vehicleService
);

const port = process.env.VEHICLE_GRPC_PORT || "9091";
const address = `0.0.0.0:${port}`;

/**
 * Detiene el servidor y libera el pool de conexiones a MySQL.
 */
const shutdown = () => {
  server.tryShutdown(async () => {
    await database.end();
    console.log("Vehicle gRPC Service detenido");
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/**
 * Comprueba MySQL y luego inicia el servidor gRPC.
 */
const start = async () => {
  try {
    await checkDatabaseConnection();

    server.bindAsync(
      address,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          console.error("No se pudo iniciar el servidor gRPC:", error);
          process.exitCode = 1;
          return;
        }

        console.log(
          `Vehicle gRPC Service escuchando en ${address} (puerto ${boundPort})`
        );
      }
    );
  } catch (error) {
    console.error(
      "No se pudo conectar a la base de datos. Revise DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD.",
      error
    );
    await database.end();
    process.exitCode = 1;
  }
};

void start();
