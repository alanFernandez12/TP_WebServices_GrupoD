import { Router } from "express";
import {
    getVehicles,
    getVehicle,
    getAvailableVehicles
} from "../controllers/vehicleController";

const router = Router();

router.get("/", getVehicles);
router.get("/disponibles", getAvailableVehicles);
router.get("/:id", getVehicle);

export default router;