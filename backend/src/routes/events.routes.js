// backend/src/routes/eventRoutes.js
import { Router } from "express";
import {
  getEvent,
  getAllEvents,
  createEvent,
  getMyOrganizing,
  getMyAttending,
  updateOrganizerProfile,
  updateEvent,
} from "../controllers/events.controller.js";
import { getEventAttendeeCount } from "../controllers/attendeeController.js";
import { getEventDashboardStats } from "../controllers/eventAnalyticsController.js";
import { requireEventRole } from "../middleware/requireEventRole.js";
import checkToken from "../middleware/checkToken.js";

const router = Router();

// Public
router.get("/", getAllEvents);
router.get("/:eventId/attendees/count", getEventAttendeeCount);


// Protected
router.post("/", checkToken, createEvent);
router.get("/me/organizing", checkToken, getMyOrganizing);
router.get("/me/attending", checkToken, getMyAttending);

router.get("/:id", getEvent);
router.get(
  "/:eventId/dashboard/stats",
  checkToken,
  requireEventRole(["organizer","staff"]),
  getEventDashboardStats
);
router.put("/:eventId/organizer-profile", checkToken, updateOrganizerProfile);
export default router;

router.patch("/:id", checkToken, updateEvent);