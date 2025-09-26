import mongoose from "mongoose";
import createError from "http-errors";
import Event from "../models/Event.js";
import EventMember from "../models/EventMember.js";
import User from "../models/User.js";

// Normalize tags: lowercase, trimmed, no duplicates, max 100
function normalizeInterests(arr) {
  if (!Array.isArray(arr)) return [];
  return Array.from(
    new Set(
      arr
        .map((t) => String(t || "").toLowerCase().trim().replace(/\s+/g, " "))
        .filter(Boolean)
    )
  ).slice(0, 100);
}

/**
 * ✅ EVENT-BASED SMART MATCHMAKING
 * GET /api/events/:eventId/match/suggestions?limit=20
 */
export const getMatchSuggestions = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return next(createError(400, "Invalid eventId"));
    }

    // Ensure event exists
    const event = await Event.findById(eventId).select("_id");
    if (!event) return next(createError(404, "Event not found"));

    // Get my EventMember record (must exist and be approved)
    const me = await EventMember.findOne({ eventId, userId }).lean();
    if (!me || ["banned", "rejected"].includes(me.status)) {
      return next(createError(403, "Not allowed for this event"));
    }

    // Get interests (per-event or fallback to User)
    let myInterests = Array.isArray(me.interests) ? me.interests : [];
    if (!myInterests.length) {
      const user = await User.findById(userId).select("interests").lean();
      myInterests = user?.interests || [];
    }
    myInterests = normalizeInterests(myInterests);

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    // MATCH PIPELINE
    const pipeline = [
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
          status: "approved",
          roles: "attendee",
          userId: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      {
        $addFields: {
          otherInterests: {
            $setUnion: [
              {
                $map: {
                  input: { $ifNull: ["$interests", []] },
                  as: "t",
                  in: {
                    $trim: {
                      input: {
                        $regexReplace: {
                          input: { $toLower: "$$t" },
                          regex: /\s+/,
                          replacement: " ",
                        },
                      },
                    },
                  },
                },
              },
              [],
            ],
          },
        },
      },
      {
        $addFields: {
          _overlapSet: { $setIntersection: ["$otherInterests", myInterests] },
          _unionSet: { $setUnion: ["$otherInterests", myInterests] },
        },
      },
      {
        $addFields: {
          overlap: { $size: "$_overlapSet" },
          union: { $size: "$_unionSet" },
        },
      },
      {
        $addFields: {
          score: {
            $cond: [{ $gt: ["$union", 0] }, { $divide: ["$overlap", "$union"] }, 0],
          },
          sharedTags: "$_overlapSet",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { fullName: 1, avatar: 1, lastLoginAt: 1 } }],
        },
      },
      { $unwind: "$user" },
      {
        $addFields: {
          _lastLoginMs: {
            $cond: [
              { $ifNull: ["$user.lastLoginAt", false] },
              { $toLong: "$user.lastLoginAt" },
              -1,
            ],
          },
          _updatedMs: { $toLong: "$updatedAt" },
        },
      },
      {
        $sort: {
          score: -1,
          overlap: -1,
          _lastLoginMs: -1,
          _updatedMs: -1,
        },
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          sharedTags: { $slice: ["$sharedTags", 10] },
          score: 1,
          overlap: 1,
          union: 1,
          fullName: "$user.fullName",
          avatar: "$user.avatar",
          bioSnippet: {
            $cond: [
              { $ifNull: ["$bio", false] },
              { $substrBytes: ["$bio", 0, 180] },
              "",
            ],
          },
        },
      },
      { $limit: limit },
    ];

    const suggestions = await EventMember.aggregate(pipeline);
    res.json({ suggestions, me: { interests: myInterests } });
  } catch (err) {
    next(err);
  }
};

/**
 * SEARCH ATTENDEES
 * GET /api/events/:eventId/attendees?query=...&tags=...&page=1&limit=20
 */
export const searchEventAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return next(createError(400, "Invalid eventId"));
    }

    const match = {
      eventId: new mongoose.Types.ObjectId(eventId),
      status: "approved",
      roles: "attendee",
    };

    const {
      query: q,
      tags,
      match: tagMatch = "any",
      page = 1,
      limit = 20,
      sort = "-updatedAt",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const sortStage = {};
    if (typeof sort === "string" && sort.length) {
      const dir = sort.startsWith("-") ? -1 : 1;
      const key = sort.startsWith("-") ? sort.slice(1) : sort;
      sortStage[key] = dir;
    } else {
      sortStage.updatedAt = -1;
    }

    const searchOr = [];
    if (q && q.trim()) {
      const rx = new RegExp(q.trim(), "i");
      searchOr.push(
        { "user.fullName": rx },
        { "user.username": rx },
        { "user.email": rx },
        { bio: rx },
        { interests: rx }
      );
    }

    let tagList = [];
    if (typeof tags === "string" && tags.trim()) {
      tagList = normalizeInterests(tags.split(","));
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { fullName: 1, username: 1, email: 1, avatar: 1, lastLoginAt: 1 } }],
        },
      },
      { $unwind: "$user" },
      ...(searchOr.length ? [{ $match: { $or: searchOr } }] : []),
      ...(tagList.length
        ? tagMatch === "all"
          ? [{ $match: { interests: { $all: tagList } } }]
          : [{ $match: { interests: { $in: tagList } } }]
        : []),
      { $sort: sortStage },
      {
        $facet: {
          data: [
            { $skip: (pageNum - 1) * pageSize },
            { $limit: pageSize },
            {
              $project: {
                _id: 0,
                memberId: "$_id",
                userId: 1,
                roles: 1,
                status: 1,
                updatedAt: 1,
                checkedInAt: 1,
                bio: 1,
                interests: 1,
                "user.fullName": 1,
                "user.username": 1,
                "user.email": 1,
                "user.avatar": 1,
                "user.lastLoginAt": 1,
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

    const [out] = await EventMember.aggregate(pipeline);
    res.json({
      attendees: out?.data ?? [],
      pagination: out?.meta ?? { total: 0, page: pageNum, limit: pageSize, totalPages: 0 },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * (Optional fallback)
 * GET /api/matches?interests=...&limit=...
 */
export const getGlobalMatches = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const user = await User.findById(userId).select("interests").lean();
    const myInterests = normalizeInterests(user?.interests || []);

    const { interests = "", limit = 20 } = req.query;
    const queryTags = normalizeInterests(interests.split(",")) || myInterests;

    if (!queryTags.length) return res.json({ matches: [] });

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const matches = await User.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(userId) },
          interests: { $in: queryTags },
        },
      },
      {
        $addFields: {
          lowerInterests: {
            $setUnion: [
              {
                $map: {
                  input: { $ifNull: ["$interests", []] },
                  as: "t",
                  in: {
                    $trim: {
                      input: {
                        $regexReplace: {
                          input: { $toLower: "$$t" },
                          regex: /\s+/,
                          replacement: " ",
                        },
                      },
                    },
                  },
                },
              },
              [],
            ],
          },
        },
      },
      {
        $addFields: {
          overlap: {
            $size: {
              $setIntersection: ["$lowerInterests", queryTags],
            },
          },
        },
      },
      { $sort: { overlap: -1, lastLoginAt: -1 } },
      { $limit: safeLimit },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          fullName: 1,
          avatar: 1,
          interests: 1,
          overlap: 1,
        },
      },
    ]);

    res.json({ matches });
  } catch (err) {
    next(err);
  }
};
