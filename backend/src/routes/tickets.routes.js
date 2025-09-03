import express from "express";
import checkToken from "../middleware/checkToken.js";
import { listTicketsForEvent, createTicket, updateTicket, deleteTicket } from "../controllers/tickets.controller.js";

const router = express.Router();

// Public: list tickets for an event (for the Tickets page)
router.get("/:eventId", listTicketsForEvent);

// Organizer-only CRUD (enable auth when ready)
// router.post("/", checkToken, createTicket);
// router.put("/:id", checkToken, updateTicket);
// router.delete("/:id", checkToken, deleteTicket);

export default router;
