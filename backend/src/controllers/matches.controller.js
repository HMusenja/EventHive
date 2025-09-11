// controllers/matchmakingController.js
import mongoose from "mongoose";
import createError from "http-errors";
import Event from "../models/Event.js";
import EventMember from "../models/EventMember.js";
import User from "../models/User.js";

/** normalize a list of tag strings to lowercased, single-spaced, unique */
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
 * GET /api/events/:eventId/match/suggestions?limit=20
 * Jaccard = |A ∩ B| / max(1, |A ∪ B|)
 * Tie-break: overlap desc, then user's recent activity (lastLoginAt), then member.updatedAt
 * Return: [{ userId, fullName, avatar, sharedTags:[…], score, bioSnippet }]
 */
// export const getMatchSuggestions = async (req, res, next) => {
//   try {
//     const userId = req.user?._id;
//     if (!userId) return next(createError(401, "Not authenticated"));

//     const { eventId } = req.params;
//     if (!mongoose.isValidObjectId(eventId)) {
//       return next(createError(400, "Invalid eventId"));
//     }

//     // Ensure event exists (optional, clearer errors)
//     const event = await Event.findById(eventId).select("_id");
//     if (!event) return next(createError(404, "Event not found"));

//     // Load *my* membership; must exist & not banned/rejected
//     const me = await EventMember.findOne({ eventId, userId }).lean();
//     if (!me) return next(createError(403, "No ticket for this event"));
//     if (me.status === "banned" || me.status === "rejected") {
//       return next(createError(403, "Not allowed for this event"));
//     }

//     // Build my interests (per-event first, fallback to User.interests)
//     let myInterests = Array.isArray(me.interests) && me.interests.length ? me.interests : [];
//     if (!myInterests.length) {
//       const u = await User.findById(userId).select("interests").lean();
//       myInterests = u?.interests || [];
//     }
//     myInterests = normalizeInterests(myInterests);

//     const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

//     // Aggregate others
//     const pipeline = [
//       // 1) filter to attendees of eventId, approved, has role 'attendee', exclude me
//       {
//         $match: {
//           eventId: new mongoose.Types.ObjectId(eventId),
//           status: "approved",
//           roles: "attendee",
//           userId: { $ne: new mongoose.Types.ObjectId(userId) },
//         },
//       },

//       // 2) Precompute "otherInterests" (lowercased, unique) safely
//       {
//         $addFields: {
//           otherInterests: {
//             $setUnion: [
//               {
//                 $map: {
//                   input: { $ifNull: ["$interests", []] },
//                   as: "t",
//                   in: {
//                     $trim: {
//                       input: {
//                         $regexReplace: {
//                           input: { $toLower: "$$t" },
//                            regex: /\s+/,
//                           replacement: " ",
//                         },
//                       },
//                     },
//                   },
//                 },
//               },
//               [], // ensures array
//             ],
//           },
//         },
//       },

//       // 3) Compute set metrics vs. myInterests
//       {
//         $addFields: {
//           _overlapSet: { $setIntersection: ["$otherInterests", myInterests] },
//           _unionSet: { $setUnion: ["$otherInterests", myInterests] },
//         },
//       },
//       {
//         $addFields: {
//           overlap: { $size: "$_overlapSet" },
//           union: { $size: "$_unionSet" },
//         },
//       },
//       {
//         $addFields: {
//           score: {
//             $cond: [{ $gt: ["$union", 0] }, { $divide: ["$overlap", "$union"] }, 0],
//           },
//           sharedTags: "$_overlapSet",
//         },
//       },

//       // 4) Join user (for name/avatar/last activity)
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "user",
//           pipeline: [
//             { $project: { fullName: 1, avatar: 1, lastLoginAt: 1 } },
//           ],
//         },
//       },
//       { $unwind: "$user" },

//       // 5) Sort by:
//       //    score desc, overlap desc, user.lastLoginAt desc (nulls last), updatedAt desc
//       {
//         $addFields: {
//           _lastLoginMs: {
//             $cond: [
//               { $ifNull: ["$user.lastLoginAt", false] },
//               { $toLong: "$user.lastLoginAt" },
//               -1,
//             ],
//           },
//           _updatedMs: { $toLong: "$updatedAt" },
//         },
//       },
//       { $sort: { score: -1, overlap: -1, _lastLoginMs: -1, _updatedMs: -1 } },

//       // 6) Project response shape
//       {
//         $project: {
//           _id: 0,
//           userId: 1,
//           sharedTags: { $slice: ["$sharedTags", 10] },
//           score: 1,
//           overlap: 1,
//           union: 1,
//           fullName: "$user.fullName",
//           avatar: "$user.avatar",
//           bioSnippet: {
//             $cond: [
//               { $ifNull: ["$bio", false] },
//               { $substrBytes: ["$bio", 0, 180] },
//               "", // if you prefer fallback to Attendee/User bio, add more lookups
//             ],
//           },
//         },
//       },

//       // 7) Limit results
//       { $limit: limit },
//     ];

//     const results = await EventMember.aggregate(pipeline);
//     res.json({ suggestions: results, me: { interests: myInterests } });
//   } catch (err) {
//     next(err);
//   }
// };

/**
 * GET /api/events/:eventId/attendees?query=...&tags=...
 * - Simple search/browse for attendees.
 * - Auth: attendee or organizer (enforce in middleware or here).
 * Query:
 *   - query: free-text across name/username/email/bio/interests
 *   - tags: CSV of tags; matches ANY by default (use match=all for all)
 *   - page, limit, sort supported
 */
export const searchEventAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return next(createError(400, "Invalid eventId"));
    }

    // base filters: approved attendees for this event
    const match = {
      eventId: new mongoose.Types.ObjectId(eventId),
      status: "approved",
      roles: "attendee",
    };

    const {
      query: q,
      tags,
      match: tagMatch = "any", // "any" | "all"
      page = 1,
      limit = 20,
      sort = "-updatedAt",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // sorting
    const sortStage = {};
    if (typeof sort === "string" && sort.length) {
      const dir = sort.startsWith("-") ? -1 : 1;
      const key = sort.startsWith("-") ? sort.slice(1) : sort;
      sortStage[key] = dir;
    } else {
      sortStage.updatedAt = -1;
    }

    // build $or for free-text across user + member fields
    const searchOr = [];
    let rx = null;
    if (q && q.trim()) {
      rx = new RegExp(q.trim(), "i");
      searchOr.push(
        { "user.fullName": rx },
        { "user.username": rx },
        { "user.email": rx },
        { bio: rx },
        { interests: rx }
      );
    }

    // parse tags
    let tagList = [];
    if (typeof tags === "string" && tags.trim()) {
      tagList = normalizeInterests(tags.split(","));
    }

    const pipeline = [
      { $match: match },

      // user join
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

      // optional search
      ...(searchOr.length ? [{ $match: { $or: searchOr } }] : []),

      // tag filter (any|all)
      ...(tagList.length
        ? tagMatch === "all"
          ? [{ $match: { interests: { $all: tagList } } }]
          : [{ $match: { interests: { $in: tagList } } }]
        : []),

      { $sort: sortStage },

      // pagination
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
