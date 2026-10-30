import { Router } from "express";
import { createExternalVehicle } from "../controllers/externalVehicleController";

const router = Router();

router.post("/", createExternalVehicle);

export default router;
