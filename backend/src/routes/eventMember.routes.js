import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import checkToken from "../middleware/checkToken.js";
import {
  applyToEvent,
  getEventAttendees,
  getMyEventMember,
  getAttendeesCount,
  upsertEventMemberByEmail,
  updateEventMember,
  requireOrganizerForEvent,
} from "../controllers/eventMemberController.js";

const router = express.Router();

// User applies to attend
router.post("/events/:eventId/apply", checkToken, applyToEvent);

// List attendees (protect as you wish)
router.get("/events/:eventId/attendees", authMiddleware, getEventAttendees);

// Public: simple count of approved attendees
router.get("/events/:eventId/attendees/count", getAttendeesCount);

// Current user's membership info
router.get("/events/:eventId/me", authMiddleware, getMyEventMember);

// Organizer/admin membership management
router.post(
  "/events/:eventId/members",
  authMiddleware,
  requireOrganizerForEvent,
  upsertEventMemberByEmail
);

router.patch(
  "/events/:eventId/members/:memberId",
  authMiddleware,
  requireOrganizerForEvent,
  updateEventMember
);

export default router;
