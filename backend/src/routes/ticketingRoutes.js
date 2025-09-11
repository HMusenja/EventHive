// routes/ticketingRoutes.js
import express from "express";
import checkToken from "../middleware/checkToken.js";
import {
  createCheckout,
  createGuestCheckout,
  completeGuestDummyPayment,
} from "../controllers/checkoutController.js";
import { stripeWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Signed flow (existing)
router.post("/checkout", checkToken, createCheckout);

// NEW: Guest flow (no auth)
router.post("/checkout-guest", createGuestCheckout);

// Dummy "webhook" to complete guest payments publicly (for local dev)
router.post("/dummy/complete", completeGuestDummyPayment);

// Real Stripe webhook (kept)
router.post("/webhook/stripe", stripeWebhook);

export default router;
