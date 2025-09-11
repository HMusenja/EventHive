import mongoose from "mongoose";
import createError from "http-errors";
import Event from "../models/Event.js";
import EventMember from "../models/EventMember.js";
import User from "../models/User.js";          // assumes { fullName, avatar, ... }
import Attendee from "../models/Attendee.js";  // global profile fallback: { userId, bio, avatar, interests }

function normTags(list = []) {
  return Array.from(
    new Set(
      (Array.isArray(list) ? list : [])
        .map(String)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

/**
 * GET /api/events/:eventId/match/suggestions?limit=20
 * - Returns array of: { memberId, user: { fullName, avatar }, profile: { bio, interests } }
 * - Only includes approved attendees for the event.
 * - Excludes the current user (if authenticated).
 * - Ranks by # of shared interests with the current user (if any).
 */
export async function getMatchSuggestions(req, res, next) {
  try {
    const { eventId } = req.params;
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || "20", 10), 50));

    // Support slug or ObjectId
    let eventDoc = null;
    if (mongoose.isValidObjectId(eventId)) {
      eventDoc = await Event.findById(eventId).select("_id slug").lean();
    } else {
      eventDoc = await Event.findOne({ slug: eventId }).select("_id slug").lean();
    }
    if (!eventDoc) return next(createError(404, "Event not found"));

    const viewerId = req.user?._id ? String(req.user._id) : null;

    // Load viewer’s membership (optional; used to compute shared interests)
    let viewerInterests = [];
    if (viewerId) {
      const myMember = await EventMember.findOne({
        eventId: eventDoc._id,
        userId: viewerId,
        status: "approved",
        roles: { $in: ["attendee"] },
      })
        .select("profile userId")
        .lean();

      if (myMember?.profile?.interests?.length) {
        viewerInterests = normTags(myMember.profile.interests);
      } else {
        // fall back to global Attendee profile
        const att = await Attendee.findOne({ userId: viewerId })
          .select("interests")
          .lean();
        if (att?.interests?.length) viewerInterests = normTags(att.interests);
      }
    }

    // Fetch candidate members (approved attendees), excluding viewer if known
    const matchFilter = {
      eventId: eventDoc._id,
      status: "approved",
      roles: { $in: ["attendee"] },
    };
    if (viewerId) matchFilter.userId = { $ne: viewerId };

    // Pull candidates first
    const candidates = await EventMember.find(matchFilter)
      .select("userId profile") // profile: { bio, interests, avatar? } in EventMember if you store it there
      .limit(400)               // safety cap before enrichment
      .lean();

    if (candidates.length === 0) return res.json([]);

    // Load user docs for display (name + avatar)
    const userIds = candidates.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select("fullName avatar")
      .lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));

    // Fallback to global Attendee profile if event profile missing
    const missingProfileUserIds = candidates
      .filter((m) => !m.profile || (!m.profile.bio && !m.profile.interests?.length && !m.profile.avatar))
      .map((m) => m.userId);

    let attendeeByUserId = new Map();
    if (missingProfileUserIds.length) {
      const atts = await Attendee.find({ userId: { $in: missingProfileUserIds } })
        .select("userId bio avatar interests")
        .lean();
      attendeeByUserId = new Map(atts.map((a) => [String(a.userId), a]));
    }

    // Build suggestion items + score by shared tags
    const myTags = new Set(viewerInterests);
    const items = candidates.map((m) => {
      const uid = String(m.userId);
      const user = userById.get(uid) || { fullName: "Attendee", avatar: "" };

      // Prefer event-specific profile, fall back to global Attendee
      const p = m.profile || {};
      const fallback = attendeeByUserId.get(uid) || {};
      const bio = p.bio ?? fallback.bio ?? "";
      const avatar = user.avatar || p.avatar || fallback.avatar || "";
      const interests = normTags(p.interests?.length ? p.interests : fallback.interests);

      const sharedCount = viewerInterests.length
        ? interests.filter((t) => myTags.has(t)).length
        : 0;

      return {
        memberId: String(m._id),
        user: { fullName: user.fullName || "Attendee", avatar },
        profile: { bio, interests },
        _score: sharedCount,
      };
    });

    // If viewer has interests, prioritize by _score desc; otherwise keep as-is (or randomize)
    items.sort((a, b) => b._score - a._score);

    // If viewer has interests, optionally drop zero-overlap suggestions at the tail for quality
    const filtered = viewerInterests.length ? items.filter((it) => it._score > 0) : items;

    res.json(filtered.slice(0, limit).map(({ _score, ...rest }) => rest));
  } catch (err) {
    next(err);
  }
}
