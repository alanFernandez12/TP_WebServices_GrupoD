import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

const PROTO_PATH = path.resolve(
  __dirname,
  "../../../../proto/customer.proto"
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;

const customers = [
  {
    id: "1",
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan.perez@email.com",
  },
  {
    id: "2",
    nombre: "María",
    apellido: "Gómez",
    email: "maria.gomez@email.com",
  },
  {
    id: "3",
    nombre: "Carlos",
    apellido: "Rodríguez",
    email: "carlos.rodriguez@email.com",
  },
];

const customerService = {
  GetCustomers: (_call: any, callback: any) => {
    callback(null, {
      customers,
    });
  },

  GetCustomer: (call: any, callback: any) => {
    const id = String(call.request.id);

    const customer = customers.find(
      (customer) => customer.id === id
    );

    if (!customer) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Cliente no encontrado",
      });
    }

    callback(null, {
      customer,
    });
  },

  CustomerExists: (call: any, callback: any) => {
    const id = String(call.request.id);

    const exists = customers.some(
      (customer) => customer.id === id
    );

    callback(null, {
      exists,
    });
  },

  IsCustomerActive: (call: any, callback: any) => {
    const id = String(call.request.id);

    const customer = customers.find(
      (customer) => customer.id === id
    );

    if (!customer) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Cliente no encontrado",
      });
    }

    callback(null, {
      active: true,
    });
  },
};

const server = new grpc.Server();

server.addService(
  proto.customer.CustomerService.service,
  customerService
);

server.bindAsync(
  "0.0.0.0:9092",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log(
      `Mock Customer Service running on port ${port}`
    );

    server.start();
  }
);