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
  } catch (e) {
    next(e);
  }
});

// ✅ List all feedback (for testimonials / dashboard)
router.get("/", async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate("userId", "avatar fullName username email") // populate user info
      .lean();

    const data = feedbacks.map(fb => ({
      _id: fb._id,
      content: fb.content,
      rating: fb.rating,
      role: fb.role || "User",
      name:
        fb.name ||
        fb.userId?.fullName ||
        fb.userId?.username ||
        fb.userId?.email ||
        "Anonymous",
      avatar: fb.userId?.avatar || "", 
    }));

    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;

