// backend/src/routes/orderRoutes.js
import express from "express";
import checkToken from "../middleware/checkToken.js";
import { requireEventRole } from "../middleware/requireEventRole.js";
import {
  fulfillOrderDev,
  refundOrder,
  getMyOrders,
  getOrderById,
} from "../controllers/orderController.js";

const router = express.Router();

// Buyer’s orders
router.get("/me", checkToken, getMyOrders);
router.get("/:orderId", checkToken, getOrderById);

// Dev: simulate Stripe success
router.post("/:orderId/fulfill", checkToken, fulfillOrderDev);

// Organizer/Admin: refund
router.post("/:orderId/refund", checkToken, requireEventRole("organizer"), refundOrder);

export default router;
