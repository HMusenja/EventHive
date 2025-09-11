// controllers/eventMemberController.js
import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventMember from "../models/EventMember.js";
import Attendee from "../models/Attendee.js";
import createError from "http-errors";
import User from "../models/User.js";

export const applyToEvent = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return next(createError(400, "Invalid eventId"));
    }

    // ensure event exists
    const event = await Event.findById(eventId);
    if (!event) return next(createError(404, "Event not found"));

    // ensure user has an Attendee profile (or create lightweight one)
    let attendee = await Attendee.findOne({ userId });
    if (!attendee) {
      attendee = await Attendee.create({ userId, bio: "", avatar: "", interests: [] });
    }

    // create-or-confirm membership
    const existing = await EventMember.findOne({ eventId, userId });
    if (existing) {
      // optionally: if banned/rejected, block; if pending/approved, just return
      return res.status(200).json({ member: existing, message: "Already applied or a member" });
    }

    const member = await EventMember.create({
      eventId,
      userId,
      // choose your default: "pending" for manual approval, or "approved"
      status: "pending",
      roles: ["attendee"],
    });

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
};

export const getEventAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) return next(createError(400, "Invalid eventId"));

    const event = await Event.findById(eventId).select("_id");
    if (!event) return next(createError(404, "Event not found"));

    const {
      status,                 // approved | pending | rejected | banned
      role,                   // attendee | speaker | staff | organizer
      q,
      page = 1,
      limit = 20,
      sort = "-createdAt",
      // NEW:
      userType               // alias for role filter below, if you prefer
    } = req.query;

    // NEW: ?role=guest|member for dashboard filters (without clashing with EventMember.roles)
    const guestMember = (req.query.role || userType || "").toLowerCase(); // "guest" | "member" | ""

    const pageNum  = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const match = { eventId: new mongoose.Types.ObjectId(eventId) };
    if (status) match.status = status;
    if (role && !["guest","member"].includes(role)) match.roles = role; // keep original meaning

    const sortStage = {};
    const dir = sort.startsWith("-") ? -1 : 1;
    const key = sort.startsWith("-") ? sort.slice(1) : sort;
    sortStage[key] = dir;

    const searchOr = [];
    if (q && q.trim()) {
      const rx = new RegExp(q.trim(), "i");
      searchOr.push(
        { "user.fullName": rx },
        { "user.username": rx },
        { "user.email": rx },
        { "attendee.bio": rx },
        { "attendee.interests": rx }
      );
    }

    const pipeline = [
      { $match: match },
      // join user
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { fullName: 1, username: 1, email: 1, avatar: 1, isGuest: 1 } }],
        },
      },
      { $unwind: "$user" },
      // join attendee profile
      {
        $lookup: {
          from: "attendees",
          localField: "userId",
          foreignField: "userId",
          as: "attendee",
          pipeline: [{ $project: { bio: 1, avatar: 1, interests: 1 } }],
        },
      },
      { $addFields: { attendee: { $ifNull: [{ $arrayElemAt: ["$attendee", 0] }, null] } } },

      // NEW: filter guest/member via user.isGuest
      ...(guestMember === "guest" ? [{ $match: { "user.isGuest": true } }] : []),
      ...(guestMember === "member" ? [{ $match: { "user.isGuest": false } }] : []),

      ...(searchOr.length ? [{ $match: { $or: searchOr } }] : []),
      { $sort: sortStage },
      {
        $facet: {
          data: [
            { $skip: (pageNum - 1) * pageSize },
            { $limit: pageSize },
            {
              $project: {
                _id: 1,
                status: 1,
                roles: 1,
                createdAt: 1,
                checkedInAt: 1,
                "user._id": 1,
                "user.fullName": 1,
                "user.username": 1,
                "user.email": 1,
                "user.avatar": 1,
                "user.isGuest": 1,
                "attendee.bio": 1,
                "attendee.avatar": 1,
                "attendee.interests": 1,
              },
            },
          ],
          meta: [{ $count: "total" }],
        },
      },
      {
        $addFields: {
          meta: {
            $let: {
              vars: { m: { $arrayElemAt: ["$meta", 0] } },
              in: {
                total: { $ifNull: ["$$m.total", 0] },
                page: pageNum,
                limit: pageSize,
                totalPages: {
                  $cond: [
                    { $gt: [{ $ifNull: ["$$m.total", 0] }, 0] },
                    { $ceil: { $divide: ["$$m.total", pageSize] } },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
    ];

    const [result] = await EventMember.aggregate(pipeline);
    res.json({ attendees: result?.data ?? [], pagination: result?.meta ?? { total: 0, page: pageNum, limit: pageSize, totalPages: 0 } });
  } catch (err) {
    next(err);
  }
};

function devLog(...args) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[requireOrganizerForEvent]", ...args);
  }
}

// Simple guard: adjust to your app (organizer/admin check)
export async function requireOrganizerForEvent(req, res, next) {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const { eventId } = req.params;

    const event = mongoose.isValidObjectId(eventId)
      ? await Event.findById(eventId).select("_id ownerId organizers owners createdBy").lean()
      : await Event.findOne({ slug: eventId }).select("_id ownerId organizers owners createdBy").lean();

    if (!event) return next(createError(404, "Event not found"));

    const uid = String(userId);
    const isSiteAdmin = !!(req.user?.role === "admin" || req.user?.isAdmin);

    const isOwner =
      (event.ownerId && String(event.ownerId) === uid) ||
      (event.createdBy && String(event.createdBy) === uid) ||
      (Array.isArray(event.owners) && event.owners.some(id => String(id) === uid)) ||
      (Array.isArray(event.organizers) && event.organizers.some(id => String(id) === uid));

    let isOrganizerMember = false;
    try {
      isOrganizerMember = !!await EventMember.exists({
        eventId: event._id,
        userId: userId,
        status: "approved",
        roles: { $in: ["organizer", "staff"] },
      });
    } catch (e) {
      devLog("exists() error:", e?.message);
    }

    if (isSiteAdmin || isOwner || isOrganizerMember) return next();

    devLog("Denied", {
      uid,
      ownerId: String(event.ownerId || ""),
      isSiteAdmin,
      isOwner,
      isOrganizerMember
    });
    return next(createError(403, "Organizer/admin permission required"));
  } catch (err) {
    return next(err);
  }
}
/**
 * POST /api/events/:eventId/members
 * Body: { email, roles?: string[], status?: "approved"|"pending"|"rejected"|"banned" }
 * Creates or updates an EventMember for the given user email.
 */
export const upsertEventMemberByEmail = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return next(createError(400, "Invalid eventId"));
    }

    const event = await Event.findById(eventId).select("_id");
    if (!event) return next(createError(404, "Event not found"));

    const { email, roles = ["attendee"], status = "approved" } = req.body || {};
    if (!email) return next(createError(400, "Email is required"));

    const user = await User.findOne({ email: String(email).toLowerCase().trim() })
      .select("_id")
      .lean();
    if (!user) return next(createError(404, "User not found"));

    const member = await EventMember.findOneAndUpdate(
      { eventId, userId: user._id },
      {
        $setOnInsert: { eventId, userId: user._id, createdAt: new Date() },
        $set: { roles, status, updatedAt: new Date() },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({ member, upserted: true });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/events/:eventId/members/:memberId
 * Body: { status?, roles? }
 * Update membership status/roles.
 */
export const updateEventMember = async (req, res, next) => {
  try {
    const { eventId, memberId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) return next(createError(400, "Invalid eventId"));
    if (!mongoose.isValidObjectId(memberId)) return next(createError(400, "Invalid memberId"));

    const member = await EventMember.findOne({ _id: memberId, eventId });
    if (!member) return next(createError(404, "Member not found"));

    const { status, roles } = req.body || {};
    if (status) member.status = status;
    if (Array.isArray(roles) && roles.length) member.roles = roles;
    await member.save();

    res.json({ member });
  } catch (err) {
    next(err);
  }
};