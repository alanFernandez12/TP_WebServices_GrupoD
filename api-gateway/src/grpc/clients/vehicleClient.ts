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

const VehicleServiceClient =
  proto.vehicle.VehicleService;

export const vehicleClient = new VehicleServiceClient(
  process.env.VEHICLE_SERVICE_URL || "localhost:9091",
  grpc.credentials.createInsecure()
);