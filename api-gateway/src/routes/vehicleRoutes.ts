import { Router } from "express";
import {
    getVehicles,
    getVehicle,
    getAvailableVehicles
} from "../controllers/vehicleController";

const router = Router();

router.get("/", getVehicles);
router.get("/:id", getVehicle);
router.post("/disponibles", getAvailableVehicles);

export default router;