// controllers/onboardingController.js
import mongoose from "mongoose";
import createError from "http-errors";
import Event from "../models/Event.js";
import EventMember from "../models/EventMember.js";
import User from "../models/User.js"; // assumes User has `interests?: string[]`
import Attendee from "../models/Attendee.js"; // optional: for avatar/bio fallback

// ----- Helpers -----
function normalizeInterests(arr) {
  if (!Array.isArray(arr)) return [];
  // trim, lowercase, collapse whitespace, dedupe, remove empties
  const set = new Set(
    arr
      .map((t) => String(t || ""))
      .map((t) => t.trim().replace(/\s+/g, " ").toLowerCase())
      .filter(Boolean)
  );
  return Array.from(set).slice(0, 50); // cap to avoid abuse
}

const GLOBAL_DICTIONARY = [
  "ai", "web3", "cloud", "devops", "design", "product", "healthcare",
  "fintech", "security", "data", "mobile", "frontend", "backend",
];

// ----- 1) GET /api/events/:eventId/me -----
export const getMyEventMember = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return next(createError(400, "Invalid eventId"));
    }

    const event = await Event.findById(eventId).select("_id");
    if (!event) return next(createError(404, "Event not found"));

    const member = await EventMember.findOne({ eventId, userId });
    // if (!member) return next(createError(404, "No membership for this event"));

    // fallback to User.interests if member.interests empty
    let effectiveInterests = Array.isArray(member?.interests) && member.interests.length
      ? member.interests
      : [];

    let userDoc = null;
    if (!effectiveInterests.length || !member?.avatarOverride) {
      userDoc = await User.findById(userId).select("interests avatar fullName username");
      if (!effectiveInterests.length && userDoc?.interests?.length) {
        effectiveInterests = userDoc.interests;
      }
    }

    res.json({
      eventMember: member,
      roles: member?.roles ?? [],
      status: member?.status ?? "pending",
      defaults: { interests: effectiveInterests },
      profile: {
        bio: member?.bio ?? "",
        avatar: member?.avatarOverride || userDoc?.avatar || req.user?.avatar || "",
        name: userDoc?.fullName || req.user?.fullName || "",
        username: userDoc?.username || req.user?.username || "",
      },
       onboardingComplete: member?.onboardingComplete === true,
    });
  } catch (err) {
    next(err);
  }
};

// ----- 2) PUT /api/events/:eventId/attendee/profile -----
export const updateMyEventAttendeeProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return next(createError(400, "Invalid eventId"));
    }

    const member = await EventMember.findOne({ eventId, userId });
    if (!member) return next(createError(403, "No ticket for this event"));
    if (member.status === "banned" || member.status === "rejected") {
      return next(createError(403, "Not allowed to update profile for this event"));
    }

    const { bio, onboardingComplete, avatarOverride } = req.body || {};

    if (typeof bio === "string") member.bio = bio.trim().slice(0, 1000);
    if (typeof avatarOverride === "string") member.avatarOverride = avatarOverride.trim();
    if (typeof onboardingComplete === "boolean") member.onboardingComplete = onboardingComplete;

    await member.save();

    // ✅ if this request marks onboarding complete, set it globally on the user too
    if (onboardingComplete === true) {
      await User.updateOne(
        { _id: userId, hasOnboarded: { $ne: true } },
        { $set: { hasOnboarded: true, onboardedAt: new Date() } }
      );
    }

    res.json({ eventMember: member });
  } catch (err) {
    next(err);
  }
};

// ----- 3) PATCH /api/users/me/interests -----
export const updateMyGlobalInterests = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    // normalize -> lowercase + single spaces + dedupe
    const arr = Array.isArray(req.body?.interests) ? req.body.interests : [];
    const interests = Array.from(
      new Set(
        arr
          .map((t) => String(t || "").toLowerCase().trim().replace(/\s+/g, " "))
          .filter(Boolean)
      )
    ).slice(0, 50);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { interests } },
      { new: true, projection: { interests: 1, _id: 0 } }
    );
    if (!user) return next(createError(404, "User not found"));

    res.json({ interests: user.interests });
  } catch (err) {
    next(err);
  }
};

// ----- 4) GET /api/tags/suggest?eventId=...&q=... -----
export const suggestTags = async (req, res, next) => {
  try {
    const { eventId, q = "", limit = 12 } = req.query;

    const max = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
    const needle = String(q || "").toLowerCase().trim();
    const out = new Map(); // tag -> score

    // ---- 1) Popular from EventMember.interests (attendees only, approved) ----
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      const eid = new mongoose.Types.ObjectId(eventId);

      const pop = await EventMember.aggregate([
        {
          $match: {
            eventId: eid,
            status: "approved",
            roles: { $in: ["attendee"] },
            interests: { $exists: true, $ne: [] },
          },
        },
        { $unwind: "$interests" },
        {
          $group: {
            _id: { $toLower: "$interests" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 200 },
      ]);

      for (const row of pop) {
        const tag = String(row?._id || "")
          .toLowerCase()
          .trim()
          .replace(/\s+/g, " ");
        if (tag) out.set(tag, (out.get(tag) || 0) + 100 * (row.count || 0));
      }

      // ---- 2) Derived from event agenda + speakers (safe guards everywhere) ----
      const ev = await Event.findById(eid).select("agenda speakers");
      if (ev) {
        // agenda structure varies; support both array-of-items and {tracks:[]}
        const tracks = Array.isArray(ev?.agenda?.tracks)
          ? ev.agenda.tracks
          : Array.isArray(ev?.agenda)
            ? ev.agenda
            : [];

        for (const tr of tracks) {
          const trackName = tr?.name || tr?.title || tr?.track || "";
          const t = String(trackName).toLowerCase().trim().replace(/\s+/g, " ");
          if (t) out.set(t, Math.max(out.get(t) || 0, 10));

          const trTags = Array.isArray(tr?.tags) ? tr.tags : [];
          for (const raw of trTags) {
            const tt = String(raw).toLowerCase().trim().replace(/\s+/g, " ");
            if (tt) out.set(tt, Math.max(out.get(tt) || 0, 10));
          }
        }

        const speakers = Array.isArray(ev?.speakers) ? ev.speakers : [];
        for (const s of speakers) {
          const sTags = Array.isArray(s?.tags) ? s.tags : Array.isArray(s?.topics) ? s.topics : [];
          for (const raw of sTags) {
            const t = String(raw).toLowerCase().trim().replace(/\s+/g, " ");
            if (t) out.set(t, Math.max(out.get(t) || 0, 10));
          }
          if (s?.title) {
            String(s.title)
              .toLowerCase()
              .split(/[\s,\/|\-]+/) // split on space/comma/slash/pipe/hyphen (all escaped/literal-safe)
              .filter((w) => w.length > 2)
              .forEach((w) => {
                const t = w.trim();
                if (t) out.set(t, Math.max(out.get(t) || 0, 10));
              });
          }
        }
      }
    }

    // ---- 3) Global fallback dictionary ----
    const GLOBAL_DICTIONARY = [
      "ai",
      "machine learning",
      "cloud",
      "devops",
      "security",
      "frontend",
      "backend",
      "design",
      "ux",
      "product",
      "data",
      "mobile",
      "web performance",
      "observability",
      "infra",
      "testing",
      "accessibility",
      "leadership",
      "fintech",
      "healthcare",
    ];
    for (const g of GLOBAL_DICTIONARY) {
      const t = g.toLowerCase();
      if (!out.has(t)) out.set(t, 1);
    }

    // ---- 4) Filter by q (prefix or contains — here we do contains) ----
    let tags = Array.from(out.entries()).map(([tag, score]) => ({ tag, score }));

    if (needle) {
      const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(esc, "i"); // contains
      tags = tags.filter(({ tag }) => rx.test(tag));
    }

    // Enforce allowed chars & length (mirror client)
    const ALLOWED = /^[a-z0-9](?:[a-z0-9 -]{0,22}[a-z0-9])?$/i;
    tags = tags.filter(({ tag }) => ALLOWED.test(tag));

    // Sort by score desc, then alpha, cap
    tags.sort((a, b) => (b.score - a.score) || a.tag.localeCompare(b.tag));
    res.json({ tags: tags.slice(0, max).map((t) => t.tag) });
  } catch (err) {
    // If we ever get a CastError/etc., return 400 instead of 500
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid eventId" });
    }
    next(err);
  }
}