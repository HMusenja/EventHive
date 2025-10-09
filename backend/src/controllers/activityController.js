// controllers/activityController.js
import Activity from "../models/Activity.js";
import mongoose from "mongoose";

/**
 * POST /api/activity/view
 * Body: { targetUserId, type: "profile_view" }
 */
export const recordView = async (req, res, next) => {
  try {
    const actorUserId = req.user?._id;
    const { targetUserId, type = "profile_view" } = req.body || {};

    if (!actorUserId) return res.status(401).json({ message: "Unauthorized" });
    if (!targetUserId || !mongoose.isValidObjectId(targetUserId))
      return res.status(400).json({ message: "Invalid or missing targetUserId" });
    if (String(actorUserId) === String(targetUserId))
      return res.status(204).end();

    if (type !== "profile_view")
      return res.status(400).json({ message: "Unsupported type" });

    const doc = await Activity.findOneAndUpdate(
      { actorUserId, targetUserId, type },
      { $setOnInsert: { actorUserId, targetUserId, type } },
      { upsert: true, new: true }
    );

    res.status(201).json({
      ok: true,
      id: doc._id,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/activity/viewed?limit=500
 * Returns: { ids: [<userId>], count: <number> }
 */
export const listViewed = async (req, res, next) => {
  try {
    const actorUserId = req.user?._id;
    if (!actorUserId) return res.status(401).json({ message: "Unauthorized" });

    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(rawLimit, 1000) : 500;

    const views = await Activity.aggregate([
      {
        $match: {
          actorUserId: new mongoose.Types.ObjectId(actorUserId),
          type: "profile_view",
        },
      },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$targetUserId",
          lastViewedAt: { $first: "$updatedAt" },
        },
      },
      { $sort: { lastViewedAt: -1 } },
      { $limit: limit },
    ]);

    const ids = views.map((v) => String(v._id)).filter(Boolean);
    res.json({ ids, count: ids.length });
  } catch (err) {
    next(err);
  }
};
