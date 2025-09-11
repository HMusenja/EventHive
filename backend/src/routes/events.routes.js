// backend/src/routes/eventRoutes.js
import { Router } from "express";
import {
  getEvent,
  getAllEvents,
  createEvent,
  getMyOrganizing,
  getMyAttending,
} from "../controllers/events.controller.js";
import { getEventAttendeeCount } from "../controllers/attendeeController.js";
import { getEventDashboardStats } from "../controllers/eventAnalyticsController.js";
import { requireEventRole } from "../middleware/requireEventRole.js";
import checkToken from "../middleware/checkToken.js";

const router = Router();

// Public
router.get("/", getAllEvents);
router.get("/:eventId/attendees/count", getEventAttendeeCount);
router.get("/:id", getEvent);

// Protected
router.post("/", checkToken, createEvent);
router.get("/me/organizing", checkToken, getMyOrganizing);
router.get("/me/attending", checkToken, getMyAttending);
router.get(
  "/:eventId/dashboard/stats",
  checkToken,
  requireEventRole(["organizer","staff"]),
  getEventDashboardStats
);

export default router;

