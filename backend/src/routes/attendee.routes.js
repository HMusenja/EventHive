// routes/attendee.routes.js
import express from "express";
import {
  createAttendee,
  updateAttendee,
  getAttendeeById,
  getMyAttendee,
} from "../controllers/attendeeController.js";
import checkToken from "../middleware/checkToken.js";

const router = express.Router();

// POST /api/attendees  -> create attendee profile for current user
router.post("/", checkToken, createAttendee);

// GET  /api/attendees/me       -> fetch my attendee profile
router.get("/me", checkToken, getMyAttendee);

// PATCH /api/attendees/:attendeeId -> update attendee profile (owner only)
router.patch("/:attendeeId", checkToken, updateAttendee);

// GET /api/attendees/:attendeeId -> public fetch (or protect if needed)
router.get("/:attendeeId", getAttendeeById);



export default router;

