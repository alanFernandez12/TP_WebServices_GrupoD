import { Router } from "express";

import {
  getCustomers,
  getCustomer,
  customerExists,
  isCustomerActive,
  createCustomer,
  updateCustomer
} from "../controllers/customerController";

const router = Router();

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.get("/:id/exists", customerExists);
router.get("/:id/active", isCustomerActive);
router.post("/:id", createCustomer);
router.put("/:id", updateCustomer);

export default router;