import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

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

type Vehicle = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  estado: string;
};

/**
 * Datos temporales del servicio. Se almacenan en memoria para que
 * el servidor sea fácil de probar sin configurar una base de datos.
 */
const vehicles: Vehicle[] = [
  {
    id: "1",
    patente: "ABC123",
    marca: "Toyota",
    modelo: "Corolla",
    estado: "DISPONIBLE",
  },
  {
    id: "2",
    patente: "DEF456",
    marca: "Ford",
    modelo: "Focus",
    estado: "NO_DISPONIBLE",
  },
  {
    id: "3",
    patente: "GHI789",
    marca: "Volkswagen",
    modelo: "Golf",
    estado: "DISPONIBLE",
  },
];

/**
 * Busca un vehículo por su identificador y devuelve un error gRPC
 * cuando el vehículo no existe.
 */
const findVehicle = (id: string): Vehicle => {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    const error = new Error("Vehículo no encontrado") as grpc.ServiceError;
    error.code = grpc.status.NOT_FOUND;
    throw error;
  }

  return vehicle;
};

/**
 * Implementa las operaciones definidas por VehicleService en
 * proto/vehicle.proto.
 */
const vehicleService = {
  GetVehicles: (
    _call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) => {
    callback(null, { vehicles });
  },

  GetVehicle: (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) => {
    try {
      const vehicle = findVehicle(String(call.request.id));
      callback(null, { vehicle });
    } catch (error) {
      callback(error as grpc.ServiceError, null);
    }
  },

  GetAvailableVehicles: (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) => {
    const { fechaInicio, fechaFin } = call.request;

    if (!fechaInicio || !fechaFin) {
      const error = new Error(
        "fechaInicio y fechaFin son obligatorias"
      ) as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      callback(error, null);
      return;
    }

    callback(null, {
      vehicles: vehicles.filter(
        (vehicle) => vehicle.estado === "DISPONIBLE"
      ),
    });
  },

  UpdateVehicleStatus: (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) => {
    const id = String(call.request.id);
    const estado = String(call.request.estado || "").trim();

    if (!estado) {
      const error = new Error(
        "El estado es obligatorio"
      ) as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      callback(error, null);
      return;
    }

    try {
      const vehicle = findVehicle(id);
      vehicle.estado = estado;
      callback(null, { vehicle });
    } catch (error) {
      callback(error as grpc.ServiceError, null);
    }
  },
};

/**
 * Crea el servidor gRPC, registra VehicleService y comienza a
 * escuchar conexiones en el puerto configurado.
 */
const server = new grpc.Server();

server.addService(
  proto.vehicle.VehicleService.service,
  vehicleService
);

const port = process.env.VEHICLE_GRPC_PORT || "9091";
const address = `0.0.0.0:${port}`;

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

/**
 * Detiene el servidor de forma ordenada cuando el proceso recibe
 * una señal de cierre.
 */
const shutdown = () => {
  server.tryShutdown(() => {
    console.log("Vehicle gRPC Service detenido");
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
