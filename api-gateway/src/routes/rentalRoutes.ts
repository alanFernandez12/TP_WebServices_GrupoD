import { Router } from "express";

import {
  createRental,
  getRentals,
  getRental,
  cancelRental,
  getRentalHistory,
} from "../controllers/rentalController";

const router = Router();

router.post("/", createRental);
router.get("/", getRentals);
router.get("/historial/:clienteId", getRentalHistory);
router.get("/:id", getRental);
router.patch("/:id/cancelar", cancelRental);

export default router;