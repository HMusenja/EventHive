import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
    listEventMessages,
    createEventMessage,
    listGlobalMessages,
    createGlobalMessage,
} from "../controllers/chat.controller.js";

const router = Router();

/**
 * Require authentication for ALL chat endpoints.
 * Guests will get 401 from authMiddleware.
 */
router.use(authMiddleware);

// ----- Global chat -----
router.get("/chat/global/messages", listGlobalMessages);
router.post("/chat/global/messages", createGlobalMessage);

// ----- Event chat (ID or slug in :eventId) -----
router.get("/events/:eventId/messages", listEventMessages);
router.post("/events/:eventId/messages", createEventMessage);

export default router;
