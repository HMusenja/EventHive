// controllers/profile.controller.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Attendee from "../models/Attendee.js";
import Event from "../models/Event.js";

const PROFILE_PROJECTION = {
  fullName: 1,
  username: 1,
  email: 1,
  avatar: 1,
  bio: 1,
  interests: 1,
  profileVisibility: 1,
  location: 1,
  company: 1,
  role: 1,
  education: 1,
  skills: 1,
  goals: 1,
  timezone: 1,
  locale: 1,
  notificationPrefs: 1,
  consents: 1,
  lastLoginAt: 1,
  createdAt: 1,
  updatedAt: 1,
  hasOnboarded: 1,
  onboardedAt: 1,
};

const PUBLIC_PROFILE_PROJECTION = {
  fullName: 1,
  username: 1,
  avatar: 1,
  bio: 1,
  location: 1,
  company: 1,
  role: 1,
  education: 1,
  interests: 1,
  skills: 1,
  goals: 1,
  createdAt: 1,
  profileVisibility: 1,
};

const ALLOWED_UPDATE_FIELDS = new Set([
  "fullName",
  "username",
  "avatar",
  "bio",
  "profileVisibility",
  "timezone",
  "locale",
  "notificationPrefs",
  "consents",
  "interests",
  "location",
  "company",
  "role",
  "education",
  "skills",
  "goals",
]);

function isObjectId(v) {
  return mongoose.Types.ObjectId.isValid(v);
}

export async function getPublicProfile(req, res, next) {
  try {
    const { idOrUsername } = req.params;
    const query = isObjectId(idOrUsername)
      ? { _id: idOrUsername }
      : { username: String(idOrUsername).trim().toLowerCase() };

    const user = await User.findOne(query)
      .select(PUBLIC_PROFILE_PROJECTION)
      .lean();
    if (!user) return res.status(404).json({ message: "Profile not found" });

    // visibility
    if (user.profileVisibility === "private") {
      return res.status(403).json({ message: "Profile is private" });
    }
    if (user.profileVisibility === "connections") {
      // TODO: implement connection check; for now block unless it’s self
      const viewerId = req.user?._id?.toString();
      const isSelf = viewerId && viewerId === user._id?.toString();
      if (!isSelf)
        return res
          .status(403)
          .json({ message: "Profile visible to connections only" });
    }

    // Shape public payload
    const profile = {
      ...user,
      joinedDate: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : null,
      mutualConnections: 0, // TODO: compute
      connectionStatus: "unknown", // TODO: compute: connected|pending|not_connected
    };

    return res.json({ profile });
  } catch (err) {
    next(err);
  }
}

export async function getMyProfile(req, res, next) {
  try {
    const me = await User.findById(req.user._id).select(PROFILE_PROJECTION);
    if (!me) return res.status(404).json({ message: "User not found" });
    res.json({ profile: me });
  } catch (err) {
    next(err);
  }
}
const normalizeArrayField = (value, max = 25, maxLen = 30) => {
  if (typeof value === "undefined") return undefined;
  let arr = value;
  if (typeof arr === "string") {
    arr = arr.split(",").map((s) => s.trim());
  }
  if (!Array.isArray(arr)) return [];
  return [
    ...new Set(
      arr
        .map((s) => String(s).trim().toLowerCase())
        .filter(Boolean)
        .map((s) => s.slice(0, maxLen))
    ),
  ].slice(0, max);
};

export async function updateMyProfile(req, res, next) {
  console.log(
    "[updateMyProfile] RAW KEYS/TYPES:",
    Object.entries(req.body || {}).map(([k, v]) => [
      k,
      Array.isArray(v) ? "array" : typeof v,
    ])
  );
  console.log("[updateMyProfile] RAW goals =", req.body?.goals);

  try {
    const payload = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (ALLOWED_UPDATE_FIELDS.has(k)) payload[k] = v;
    }

    // mark onboarded if bio/tags provided
    const wantsOnboard =
      (Array.isArray(payload.interests) && payload.interests.length > 0) ||
      (typeof payload.bio === "string" && payload.bio.trim().length > 0) ||
      (Array.isArray(payload.skills) && payload.skills.length > 0) ||
      (Array.isArray(payload.goals) && payload.goals.length > 0);
    if (wantsOnboard) {
      payload.hasOnboarded = true;
      payload.onboardedAt = new Date();
    }

    // block truly sensitive fields
    if ("email" in req.body || "accountStatus" in req.body) {
      return res
        .status(400)
        .json({ message: "Field not updatable via this endpoint" });
    }

    // --- helpers ---
    const normalizeArrayField = (value, max = 25, maxLen = 30) => {
      if (typeof value === "undefined") return undefined; // leave untouched if missing
      let arr = value;
      if (typeof arr === "string") {
        arr = arr.split(",").map((s) => s.trim());
      }
      if (!Array.isArray(arr)) return [];
      return [
        ...new Set(
          arr
            .map((s) =>
              typeof s === "string" ? s : s?.value || s?.label || ""
            ) // handle tag objects
            .map((s) => String(s).trim().toLowerCase())
            .filter(Boolean)
            .map((s) => s.slice(0, maxLen))
        ),
      ].slice(0, max);
    };

    // normalize tag arrays
    if (typeof payload.interests !== "undefined")
      payload.interests = normalizeArrayField(payload.interests);
    if (typeof payload.skills !== "undefined")
      payload.skills = normalizeArrayField(payload.skills);
    if (typeof payload.goals !== "undefined")
      payload.goals = normalizeArrayField(payload.goals);

    console.log("[updateMyProfile] PAYLOAD goals =", payload.goals);

    const updated = await User.findByIdAndUpdate(req.user._id, payload, {
      new: true,
      runValidators: true,
    }).select(PROFILE_PROJECTION);

    res.json({ profile: updated });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.username) {
      return res.status(409).json({ message: "Username already taken" });
    }
    next(err);
  }
}

export async function getMySummary(req, res, next) {
  try {
    const userId = req.user._id;

    const [profile, roleGroups, ownedEvents] = await Promise.all([
      User.findById(userId).select(PROFILE_PROJECTION),
      Attendee.aggregate([
        { $match: { userId, status: "approved" } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        { $unwind: "$roles" },
        {
          $group: {
            _id: { role: "$roles" },
            items: {
              $push: {
                eventId: "$event._id",
                slug: "$event.slug",
                title: "$event.title",
                startAt: "$event.startAt",
                endAt: "$event.endAt",
                status: "$status",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      // NEW: events the user owns
      Event.find({ ownerId: userId })
        .select({ _id: 1, slug: 1, title: 1, startAt: 1, endAt: 1 })
        .lean(),
    ]);

    const roleBuckets = { organizer: [], staff: [], speaker: [], attendee: [] };
    const counts = { organizer: 0, staff: 0, speaker: 0, attendee: 0 };

    for (const g of roleGroups) {
      const role = g._id.role;
      if (roleBuckets[role]) {
        roleBuckets[role].push(...g.items);
        counts[role] += g.count;
      }
    }

    // Merge owned events into organizer bucket (avoid duplicates)
    const seen = new Set(roleBuckets.organizer.map((i) => String(i.eventId)));
    for (const ev of ownedEvents) {
      const id = String(ev._id);
      if (!seen.has(id)) {
        roleBuckets.organizer.push({
          eventId: ev._id,
          slug: ev.slug,
          title: ev.title,
          startAt: ev.startAt,
          endAt: ev.endAt,
          status: "approved", // virtual status for owned events
        });
        counts.organizer += 1;
      }
    }

    const nextOrganizing =
      roleBuckets.organizer
        .filter((i) => i.startAt)
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))[0] || null;

    const hasAnyEventRole = Object.values(counts).some((n) => n > 0);
    const isOrganizer = counts.organizer > 0;

    res.json({
      profile,
      memberships: {
        counts,
        organizing: roleBuckets.organizer,
        staff: roleBuckets.staff,
        speaker: roleBuckets.speaker,
        attending: roleBuckets.attendee,
      },
      nextOrganizing,
      hasAnyEventRole,
      isOrganizer,
    });
  } catch (err) {
    next(err);
  }
}
