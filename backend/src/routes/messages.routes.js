import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { listEventMessages, createEventMessage } from "../controllers/chat.controller.js";

const router = express.Router();

// Returns [{ _id, text, sender: {_id, fullName, username}, createdAt }]
router.get("/events/:eventId/messages", authMiddleware, listEventMessages);
router.post("/events/:eventId/messages", authMiddleware, createEventMessage);

export default router;
