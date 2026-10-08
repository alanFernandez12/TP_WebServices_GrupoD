import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

const PROTO_PATH = path.resolve(
  __dirname,
  "../../../../proto/rental.proto"
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;

let rentals = [
  {
    id: "1",
    cliente_id: "1",
    vehiculo_id: "1",
    fecha_inicio: "2026-10-05",
    fecha_fin: "2026-10-10",
    estado: "ACTIVA",
  },
  {
    id: "2",
    cliente_id: "2",
    vehiculo_id: "2",
    fecha_inicio: "2026-10-12",
    fecha_fin: "2026-10-15",
    estado: "ACTIVA",
  },
];

let nextId = 3;

const rentalService = {
  CreateRental: (call: any, callback: any) => {
    const {
      cliente_id,
      vehiculo_id,
      fecha_inicio,
      fecha_fin,
    } = call.request;

    if (!cliente_id || !vehiculo_id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Cliente y vehículo son obligatorios",
      });
    }

    if (!fecha_inicio || !fecha_fin) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Las fechas son obligatorias",
      });
    }

    const rental = {
      id: String(nextId++),
      cliente_id: String(cliente_id),
      vehiculo_id: String(vehiculo_id),
      fecha_inicio,
      fecha_fin,
      estado: "ACTIVA",
    };

    rentals.push(rental);

    callback(null, {
      rental,
    });
  },

  GetRentals: (_call: any, callback: any) => {
    callback(null, {
      rentals,
    });
  },

  GetRental: (call: any, callback: any) => {
    const id = String(call.request.id);

    const rental = rentals.find(
      (rental) => rental.id === id
    );

    if (!rental) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Reserva no encontrada",
      });
    }

    callback(null, {
      rental,
    });
  },

  CancelRental: (call: any, callback: any) => {
    const id = String(call.request.id);

    const rental = rentals.find(
      (rental) => rental.id === id
    );

    if (!rental) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Reserva no encontrada",
      });
    }

    if (rental.estado === "CANCELADA") {
      return callback({
        code: grpc.status.FAILED_PRECONDITION,
        message: "La reserva ya está cancelada",
      });
    }

    rental.estado = "CANCELADA";

    callback(null, {
      rental,
    });
  },

  GetRentalHistory: (call: any, callback: any) => {
    const clienteId = String(call.request.cliente_id);

    const customerRentals = rentals.filter(
      (rental) => rental.cliente_id === clienteId
    );

    callback(null, {
      rentals: customerRentals,
    });
  },
};

const server = new grpc.Server();

server.addService(
  proto.rental.RentalService.service,
  rentalService
);

server.bindAsync(
  "0.0.0.0:9093",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log(
      `Mock Rental Service running on port ${port}`
    );

    server.start();
  }
);