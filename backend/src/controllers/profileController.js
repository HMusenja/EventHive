// controllers/profile.controller.js
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
]);

export async function getMyProfile(req, res, next) {
  try {
    const me = await User.findById(req.user._id).select(PROFILE_PROJECTION);
    if (!me) return res.status(404).json({ message: "User not found" });
    res.json({ profile: me });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const payload = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (ALLOWED_UPDATE_FIELDS.has(k)) payload[k] = v;
    }
    // if user sent interests/bio with content, mark onboarded globally
    const wantsOnboard =
      (Array.isArray(payload.interests) && payload.interests.length > 0) ||
      (typeof payload.bio === "string" && payload.bio.trim().length > 0);
    if (wantsOnboard) {
      payload.hasOnboarded = true;
      payload.onboardedAt = new Date();
    }
    if (
      "email" in req.body ||
      "role" in req.body ||
      "accountStatus" in req.body
    ) {
      return res
        .status(400)
        .json({ message: "Field not updatable via this endpoint" });
    }

    // ✅ Normalize interests if present
    if (typeof payload.interests !== "undefined") {
      let tags = payload.interests;
      // Accept CSV string as convenience
      if (typeof tags === "string") {
        tags = tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (!Array.isArray(tags)) {
        return res.status(400).json({
          message:
            "interests must be an array of strings or comma-separated string",
        });
      }
      const MAX_TAGS = 25;
      const MAX_LEN = 30;
      payload.interests = [
        ...new Set(
          tags
            .map((s) => String(s).trim().toLowerCase())
            .filter(Boolean)
            .map((s) => s.slice(0, MAX_LEN))
        ),
      ].slice(0, MAX_TAGS);
    }

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
