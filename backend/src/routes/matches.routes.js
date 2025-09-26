import express from "express";
import checkToken from "../middleware/checkToken.js";
import {
  requireEventRole,
  requireEventAccess,
} from "../middleware/requireEventRole.js";

import {
  getMatchSuggestions,
  searchEventAttendees,
  getGlobalMatches,
} from "../controllers/matches.controller.js"; // ✅ Only this one

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

/**
 * GET /api/matches?interests=...&limit=...
 * Global fallback match list
 */
router.get("/matches", checkToken, getGlobalMatches);

export default router;
