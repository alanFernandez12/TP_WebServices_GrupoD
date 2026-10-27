import { Router } from "express";
import {
    getVehicles,
    getVehicle,
    getAvailableVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus
} from "../controllers/vehicleController";

const router = Router();

router.get("/", getVehicles);
router.get("/disponibles", getAvailableVehicles);
router.get("/:id", getVehicle);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);
router.patch("/:id/estado", updateVehicleStatus);

export default router;