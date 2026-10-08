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

const RentalServiceClient =
  proto.rental.RentalService;

export const rentalClient = new RentalServiceClient(
  process.env.RENTAL_SERVICE_URL || "localhost:9093",
  grpc.credentials.createInsecure()
);