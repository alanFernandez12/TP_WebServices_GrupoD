import { Router } from "express";
import {
  createExternalVehicle,
  getExternalVehicles,
} from "../controllers/externalVehicleController";

const router = Router();

router.post("/", createExternalVehicle);
router.get("/mis-solicitudes", getExternalVehicles);

export default router;
