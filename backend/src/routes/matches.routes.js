// routes/matchmaking.routes.js
import express from "express";
import checkToken from "../middleware/checkToken.js";
// If you already have these, plug them in:
import {
  requireEventRole,
  requireEventAccess,
} from "../middleware/requireEventRole.js";

import { searchEventAttendees } from "../controllers/matches.controller.js";
import { getMatchSuggestions } from "../controllers/eventMatchController.js";

const router = express.Router();

/**
 * GET /api/events/:eventId/match/suggestions?limit=20
 * Auth: attendee (must have a ticket)
 */
router.get(
  "/events/:eventId/match/suggestions",
  checkToken,
  requireEventRole("attendee"),
  getMatchSuggestions
);

/**
 * GET /api/events/:eventId/attendees?query=...&tags=...
 * Auth: attendee OR organizer
 */
router.get(
  "/events/:eventId/attendees",
  checkToken,
  requireEventAccess, // implements attendee-or-organizer
  searchEventAttendees
);

export default router;
