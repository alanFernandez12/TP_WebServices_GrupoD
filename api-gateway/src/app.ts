import express from "express";
import cors from "cors";
import dotenv from "dotenv";

//import authRoutes from "./routes/authRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
//import customerRoutes from "./routes/customerRoutes";
//import rentalRoutes from "./routes/rentalRoutes";
//import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

//app.use("/api/auth", authRoutes);
app.use("/api/vehiculos", vehicleRoutes);
//app.use("/api/clientes", customerRoutes);
//app.use("/api/reservas", rentalRoutes);

//app.use(errorHandler);

const PORT = process.env.PORT || 8085;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});

