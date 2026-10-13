import { Router } from "express";

import {
  getCustomers,
  getCustomer,
  customerExists,
  isCustomerActive,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  reactivateCustomer,
} from "../controllers/customerController";

const router = Router();

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.get("/:id/exists", customerExists);
router.get("/:id/active", isCustomerActive);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.patch("/:id/reactivar", reactivateCustomer);

export default router;