// routes/onboarding.routes.js
import express from "express";
import {
  getMyEventMember,
  updateMyEventAttendeeProfile,
  updateMyGlobalInterests,
  suggestTags,
} from "../controllers/onboardingController.js";
import checkToken from "../middleware/checkToken.js"
// If you have it, enforce ticket/role:
// import { requireEventRole } from "../middleware/requireEventRole.js";

const router = express.Router();

/**
 * GET /api/events/:eventId/me
 * Auth: required
 * Purpose: fetch my EventMember or 404 if none
 */
router.get("/events/:eventId/me", checkToken, getMyEventMember);

/**
 * PUT /api/events/:eventId/attendee/profile
 * Auth: required + must have a ticket (attendee role)
 * Body: { bio?, interests?: string[], avatarOverride? }
 * Behavior: normalize interests; upsert fields on EventMember (no role changes)
 */
router.put(
  "/events/:eventId/attendee/profile",
  checkToken,
  // requireEventRole("attendee"), // uncomment if implemented
  updateMyEventAttendeeProfile
);

/**
 * PATCH /api/users/me/interests
 * Auth: required
 * Body: { interests: string[] } (normalized)
 */
router.patch("/users/me/interests", checkToken, updateMyGlobalInterests);

/**
 * GET /api/tags/suggest?eventId=...&q=...
 * Auth: optional
 */
router.get("/tags/suggest", suggestTags);

export default router;
