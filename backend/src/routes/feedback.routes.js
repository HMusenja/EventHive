import express from "express";
import Feedback from "../models/Feedback.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Submit feedback
router.post("/", authMiddleware, async (req, res, next) => {
    try {
        const { content, rating, role } = req.body;
        if (!content) return res.status(400).json({ error: "Content required" });

        const fb = await Feedback.create({
            userId: req.user?._id,
            name: req.user?.fullName || req.user?.username,
            role: role || "User",
            content,
            rating: rating || 5,
        });

        res.status(201).json(fb);
    } catch (e) { next(e); }
});

// ✅ List all feedback (for testimonials / dashboard)
router.get("/", async (req, res, next) => {
    try {
        const feedback = await Feedback.find().sort({ createdAt: -1 }).lean();
        res.json(feedback);
    } catch (e) { next(e); }
});

export default router;
