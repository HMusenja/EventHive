import express from "express";
import { applyToEvent, getEventAttendees,upsertEventMemberByEmail,
  updateEventMember,
  requireOrganizerForEvent, } from "../controllers/eventMemberController.js";
import checkToken from "../middleware/checkToken.js";

const router = express.Router();

// POST /api/events/:eventId/apply -> user applies to attend event
router.post("/events/:eventId/apply", checkToken, applyToEvent);

// Organizer/Admin: grant or update membership by email
router.post(
  "/events/:eventId/members",
  checkToken,
  requireOrganizerForEvent,
  upsertEventMemberByEmail
);

// Organizer/Admin: patch a membership (status/roles)
router.patch(
  "/events/:eventId/members/:memberId",
  checkToken,
  requireOrganizerForEvent,
  updateEventMember
);

// GET /api/events/:eventId/attendees -> list attendees with filters/pagination
router.get(
  "/events/:eventId/attendees",
  checkToken,
  // requireOrganizerForEvent, // uncomment if you want to restrict to organizers
  getEventAttendees
);

export default router;