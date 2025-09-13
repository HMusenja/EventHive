import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
    listEventMessages,
    createEventMessage,
    listGlobalMessages,
    createGlobalMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

// Global chat (eventId === null)
router.get("/chat/global/messages", authMiddleware, listGlobalMessages);
router.post("/chat/global/messages", authMiddleware, createGlobalMessage);

// Event chat (by :eventId or slug)
router.get("/events/:eventId/messages", authMiddleware, listEventMessages);
router.post("/events/:eventId/messages", authMiddleware, createEventMessage);

export default router;
