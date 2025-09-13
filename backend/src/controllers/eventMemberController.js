import mongoose from "mongoose";
import createError from "http-errors";
import Event from "../models/Event.js";
import EventMember from "../models/EventMember.js";
import Attendee from "../models/Attendee.js";
import User from "../models/User.js";

/** Resolve :eventId that might be an ObjectId or a slug; returns an ObjectId */
async function resolveEventId(idOrSlug) {
  if (mongoose.isValidObjectId(idOrSlug)) {
    const ev = await Event.findById(idOrSlug).select("_id").lean();
    if (ev) return ev._id;
  }
  const bySlug = await Event.findOne({ slug: idOrSlug }).select("_id").lean();
  if (!bySlug) throw createError(404, "Event not found");
  return bySlug._id;
}

/** Build a query that matches either eventId|event and userId|user */
function memberKeyQuery(eventId, userId) {
  return {
    $and: [
      { $or: [{ eventId }, { event: eventId }] },
      { $or: [{ userId }, { user: userId }] },
    ],
  };
}

/** POST /api/events/:eventId/apply */
export const applyToEvent = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const eventId = await resolveEventId(req.params.eventId);

    // ensure attendee profile exists (support userId OR user)
    let attendee = await Attendee.findOne({ $or: [{ userId }, { user: userId }] });
    if (!attendee) {
      attendee = await Attendee.create({
        userId,
        user: userId, // keep both fields for schema compatibility
        bio: "",
        avatar: "",
        interests: [],
      });
    }

    // existing membership?
    const existing = await EventMember.findOne(memberKeyQuery(eventId, userId));
    if (existing) {
      return res.status(200).json({ member: existing, message: "Already applied or a member" });
    }

    const member = await EventMember.create({
      eventId,
      event: eventId, // set both
      userId,
      user: userId,
      status: "pending",
      roles: ["attendee"],
    });

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
};

/** GET /api/events/:eventId/attendees (list with filters) */
export const getEventAttendees = async (req, res, next) => {
  try {
    const eventId = await resolveEventId(req.params.eventId);

    const {
      status,         // approved | pending | rejected | banned
      role,           // legacy single role
      roles,          // CSV or array
      q,
      page = 1,
      limit = 20,
      sort = "-createdAt",
      userType,       // guest | member (maps to user.isGuest)
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // role filter (array)
    let roleFilter = [];
    if (Array.isArray(roles)) roleFilter = roles;
    else if (typeof roles === "string") roleFilter = roles.split(",").map(s => s.trim()).filter(Boolean);
    else if (role) roleFilter = [role];

    const sortDir = sort.startsWith("-") ? -1 : 1;
    const sortKey = sort.startsWith("-") ? sort.slice(1) : sort;

    const searchOr = [];
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), "i");
      searchOr.push(
        { "user.fullName": rx },
        { "user.username": rx },
        { "user.email": rx },
        { "attendee.bio": rx },
        { "attendee.interests": rx }
      );
    }

    const pipeline = [
      // match event by either field
      { $match: { $or: [{ eventId }, { event: eventId }] } },

      // normalize fields: _userId + allRoles
      {
        $addFields: {
          _userId: { $ifNull: ["$userId", "$user"] },
          allRoles: {
            $cond: [
              { $isArray: "$roles" },
              "$roles",
              { $cond: [{ $ne: ["$role", null] }, ["$role"], []] }
            ],
          },
        },
      },

      // apply status/roles filters
      ...(status ? [{ $match: { status } }] : []),
      ...(roleFilter.length ? [{ $match: { allRoles: { $in: roleFilter } } }] : []),

      // join user
      {
        $lookup: {
          from: "users",
          localField: "_userId",
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
          localField: "_userId",
          foreignField: "userId",
          as: "attendeeByUserId",
          pipeline: [{ $project: { bio: 1, avatar: 1, interests: 1 } }],
        },
      },
      {
        $lookup: {
          from: "attendees",
          localField: "_userId",
          foreignField: "user",
          as: "attendeeByUser",
          pipeline: [{ $project: { bio: 1, avatar: 1, interests: 1 } }],
        },
      },
      {
        $addFields: {
          attendee: {
            $ifNull: [
              { $arrayElemAt: ["$attendeeByUserId", 0] },
              { $arrayElemAt: ["$attendeeByUser", 0] }
            ],
          },
        },
      },

      // filter guest/member via user.isGuest
      ...(userType === "guest" ? [{ $match: { "user.isGuest": true } }] : []),
      ...(userType === "member" ? [{ $match: { "user.isGuest": false } }] : []),

      ...(searchOr.length ? [{ $match: { $or: searchOr } }] : []),

      { $sort: { [sortKey]: sortDir } },

      {
        $facet: {
          data: [
            { $skip: (pageNum - 1) * pageSize },
            { $limit: pageSize },
            {
              $project: {
                _id: 1,
                status: 1,
                roles: "$allRoles",
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
    res.json({
      attendees: result?.data ?? [],
      pagination: result?.meta ?? { total: 0, page: pageNum, limit: pageSize, totalPages: 0 },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/events/:eventId/me — return 200 with isMember:false when not found */
export const getMyEventMember = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const eventId = await resolveEventId(req.params.eventId);

    const member = await EventMember.findOne({
      eventId,
      userId, // mongoose will cast string → ObjectId
    }).lean();
    if (!member) return res.status(200).json({ isMember: false });

    const roles = Array.isArray(member.roles)
      ? member.roles
      : member.role
        ? [member.role]
        : [];

    return res.json({
      isMember: true,
      _id: String(member._id),
      role: Array.isArray(member.roles) ? member.roles : [member.roles].filter(Boolean),
      status: member.status,
    });
  } catch (err) {
    // Ensure 404s stay 404s, not 500s
    if (err.status || err.statusCode) return next(err);
    console.error("GET /events/:eventId/me error:", err);
    return next(createError(500, "Failed to fetch membership"));
  }
};

/** GET /api/events/:eventId/attendees/count */
export const getAttendeesCount = async (req, res, next) => {
  try {
    const eventId = await resolveEventId(req.params.eventId);
    const count = await EventMember.countDocuments({
      $and: [
        { $or: [{ eventId }, { event: eventId }] },
        { status: "approved" },
      ],
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

/** POST /api/events/:eventId/members — organizer upsert by email */
export const upsertEventMemberByEmail = async (req, res, next) => {
  try {
    const eventId = await resolveEventId(req.params.eventId);

    const { email, roles = ["attendee"], status = "approved" } = req.body || {};
    if (!email) return next(createError(400, "Email is required"));

    const user = await User.findOne({ email: String(email).toLowerCase().trim() })
      .select("_id")
      .lean();
    if (!user) return next(createError(404, "User not found"));

    const member = await EventMember.findOneAndUpdate(
      memberKeyQuery(eventId, user._id),
      {
        $setOnInsert: {
          eventId,
          event: eventId,
          userId: user._id,
          user: user._id,
          createdAt: new Date(),
        },
        $set: { roles, status, updatedAt: new Date() },
      },
      { new: true, upsert: true }
    );

    res.json({ member, upserted: true });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/events/:eventId/members/:memberId — update status/roles */
export const updateEventMember = async (req, res, next) => {
  try {
    const eventId = await resolveEventId(req.params.eventId);
    const { memberId } = req.params;
    if (!mongoose.isValidObjectId(memberId)) return next(createError(400, "Invalid memberId"));

    const member = await EventMember.findOne({
      $and: [
        { _id: memberId },
        { $or: [{ eventId }, { event: eventId }] },
      ],
    });
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

/** Guard: organizer/staff/owner/admin */
export async function requireOrganizerForEvent(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const eventId = await resolveEventId(req.params.eventId);
    const event = await Event.findById(eventId)
      .select("_id ownerId organizers owners createdBy")
      .lean();
    if (!event) return next(createError(404, "Event not found"));

    const uid = String(userId);
    const isSiteAdmin = !!(req.user?.role === "admin" || req.user?.isAdmin);

    const isOwner =
      (event.ownerId && String(event.ownerId) === uid) ||
      (event.createdBy && String(event.createdBy) === uid) ||
      (Array.isArray(event.owners) && event.owners.some(id => String(id) === uid)) ||
      (Array.isArray(event.organizers) && event.organizers.some(id => String(id) === uid));

    const isOrganizerMember = !!(await EventMember.exists({
      $and: [
        { $or: [{ eventId: event._id }, { event: event._id }] },
        { $or: [{ userId }, { user: userId }] },
        { status: "approved" },
        { roles: { $in: ["organizer", "staff"] } },
      ],
    }));

    if (isSiteAdmin || isOwner || isOrganizerMember) return next();
    return next(createError(403, "Organizer/admin permission required"));
  } catch (err) {
    next(err);
  }
}
