import express, { Router } from "express";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getSalesReport,
  generateOrderReceipt,
} from "../controllers/orders.controller";
import { protect } from "../middleware/auth.middleware";

const router: Router = express.Router();

// Protected routes
router.use(protect);

router.get("/", getOrders);
router.post("/", createOrder);
router.get("/report", getSalesReport);
router.get("/:id", getOrder);
router.get("/:id/receipt", generateOrderReceipt);
router.put("/:id", updateOrderStatus);

export default router;
