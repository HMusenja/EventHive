import express from "express";
import checkToken from "../middleware/checkToken.js";
import { requireEventRole } from "../middleware/requireEventRole.js";
import {
  listTicketsForEvent,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../controllers/tickets.controller.js";

const router = express.Router();

/** Public: list tickets for a specific event */
router.get("/event/:eventId", listTicketsForEvent);

/** Organizer-only CRUD */
router.post("/", checkToken, requireEventRole("organizer"), createTicket);
router.put("/:id", checkToken, requireEventRole("organizer"), updateTicket);
router.delete("/:id", checkToken, requireEventRole("organizer"), deleteTicket);

export default router;

