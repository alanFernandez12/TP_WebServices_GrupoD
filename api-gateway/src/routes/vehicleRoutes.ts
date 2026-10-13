import { Router } from "express";
import {
    getVehicles,
    getVehicle,
    getAvailableVehicles,
    createVehicle,
    updateVehicle
} from "../controllers/vehicleController";

const router = Router();

router.get("/", getVehicles);
router.get("/disponibles", getAvailableVehicles);
router.get("/:id", getVehicle);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);

export default router;