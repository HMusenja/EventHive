// routes/checkinRoutes.js
import express from "express";
import checkToken from "../middleware/checkToken.js";
import { requireEventRole } from "../middleware/requireEventRole.js";
import { checkIn,getCheckinStats } from "../controllers/checkinController.js";

const router = express.Router();

// Organizer or staff can scan a ticket QR and check in the attendee
router.post(
  "/events/:eventId/checkin",
  checkToken,
  // requireEventRole(["organizer", "staff"]),
  checkIn
);

// Stats for dashboards
router.get(
  "/events/:eventId/checkin/stats",
  checkToken,
  requireEventRole(["organizer", "staff"]),
  getCheckinStats
);


export default router;
