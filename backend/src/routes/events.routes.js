// backend/src/routes/eventRoutes.js
import { Router } from "express";
import { getEvent,getAllEvents } from "../controllers/events.controller.js";

const router = Router();
router.get("/events", getAllEvents);
router.get("/events/:id", getEvent);
export default router;
