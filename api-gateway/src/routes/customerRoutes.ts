import { Router } from "express";

import {
  getCustomers,
  getCustomer,
  customerExists,
  isCustomerActive,
} from "../controllers/customerController";

const router = Router();

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.get("/:id/exists", customerExists);
router.get("/:id/active", isCustomerActive);

export default router;