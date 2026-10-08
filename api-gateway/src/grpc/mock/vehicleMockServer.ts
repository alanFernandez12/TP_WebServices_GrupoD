import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

const PROTO_PATH = path.resolve(
  __dirname,
  "../../../../proto/vehicle.proto"
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

const vehicles = [
  {
    id: "1",
    patente: "ABC123",
    marca: "Toyota",
    modelo: "Corolla",
    estado: "ACTIVO"
  },
  {
    id: "2",
    patente: "DEF456",
    marca: "Ford",
    modelo: "Focus",
    estado: "INACTIVO"
  },
];

const vehicleService = {
  GetVehicles: (
    call: any,
    callback: any
  ) => {
    callback(null, {
      vehicles,
    });
  },

  GetVehicle: (
    call: any,
    callback: any
  ) => {
    const id = String(call.request.id);

    const vehicle = vehicles.find(
      (v) => v.id === id
    );

    if (!vehicle) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Vehículo no encontrado",
      });
    }

    callback(null, {
      vehicle,
    });
  },

  IsVehicleAvailable: (
    call: any,
    callback: any
  ) => {
    callback(null, {
      available: true,
    });
  },
};

const server = new grpc.Server();

server.addService(
  proto.vehicle.VehicleService.service,
  vehicleService
);

server.bindAsync(
  "0.0.0.0:9091",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log(
      `Mock Vehicle Service running on port ${port}`
    );

    server.start();
  }
);