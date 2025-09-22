import Event from "../models/Event.js";
import Attendee from "../models/Attendee.js"
import EventMember from "../models/EventMember.js";

// GET /api/events
export async function getAllEvents(req, res, next) {
  try {
    const events = await Event.find().lean();
    res.json(events);
  } catch (err) {
    next(err);
  }
}

// GET /api/events/:idOrSlug
export async function getEvent(req, res, next) {
  try {
    const idOrSlug = req.params.id;
    const query = /^[a-f0-9]{24}$/.test(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    const event = await Event.findOne(query).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Strong caching hints (safe for read-only)
    res.set("Cache-Control", "public, max-age=60");
    return res.json(event);
  } catch (err) {
    next(err);
  }
}

// POST /api/events
export async function createEvent(req, res, next) {
  try {
    console.log("req.user:", req.user);
    const ownerId = req.user._id;

    console.log("Creating event with body:", req.body);
    const event = await Event.create({ ...req.body, ownerId });
    console.log("Event created:", event._id);

    console.log("Upserting membership for:", ownerId);
    await EventMember.updateOne(
      { eventId: event._id, userId: ownerId },
      { $setOnInsert: { roles: ["organizer"], status: "approved" } },
      { upsert: true }
    );
    console.log("Membership upserted");

    res.status(201).json(event);
  } catch (err) {
    console.error("CreateEvent error:", err);
    next(err);
  }
}


// GET /api/events/me/organizing
export async function getMyOrganizing(req, res, next) {
  try {
    const userId = req.user._id;

    const memberships = await EventMember.find({
      userId,
      roles: "organizer",
    }).select("eventId").lean();

    const events = await Event.find({
      _id: { $in: memberships.map(m => m.eventId) },
    }).lean();

    res.json(events);
  } catch (err) {
    next(err);
  }
}

// GET /api/events/me/attending
export async function getMyAttending(req, res, next) {
  try {
    const userId = req.user._id;

    const memberships = await EventMember.find({
      userId,
      roles: "attendee",
      status: "approved",
    }).select("eventId").lean();

    const events = await Event.find({
      _id: { $in: memberships.map(m => m.eventId) },
    }).lean();

    res.json(events);
  } catch (err) {
    next(err);
  }
}


/**
 * Update the organizer profile for a specific event.
 * Only event owners or organizers are allowed.
 */
export const updateOrganizerProfile = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, website, bio, avatarUrl, socials } = req.body;
    const userId = req.user._id; // assuming you attach the logged-in user

    // 1. Check event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2. Permission check — owner or event-scoped organizer
    const isOwner = event.ownerId.toString() === userId.toString();
    const isOrganizer = await Attendee.exists({
      eventId,
      userId,
      roles: "organizer",
      status: "approved",
    });

    if (!isOwner && !isOrganizer) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 3. Update organizer profile
   event.organizerProfile = {
  ...(event.organizerProfile || {}),
  ...(name !== undefined ? { name } : {}),
  ...(website !== undefined ? { website } : {}),
  ...(bio !== undefined ? { bio } : {}),
  ...(avatarUrl !== undefined ? { avatarUrl } : {}),
  ...(socials !== undefined ? { socials } : {}),
};

    await event.save();

    return res.json({
      message: "Organizer profile updated",
      organizerProfile: event.organizerProfile,
    });
  } catch (err) {
    console.error("[updateOrganizerProfile] error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const event = await Event.findById(id);
    if (!event) return next(createError(404, "Event not found"));

    // auth: owner or organizer
    const isOwner = String(event.ownerId) === String(userId);
    const isOrganizer = await EventMember.exists({
      eventId: event._id,
      userId,
      roles: "organizer",
    });

    if (!isOwner && !isOrganizer) {
      return next(createError(403, "Not authorized to update this event"));
    }

    // whitelist + nested merge
    const {
      slug, title, subtitle, description, coverImage,
      onboardingEnabled, startAt, endAt, timezone,
      visibility, capacity,
      venue, organizerProfile, speakers, agenda,
    } = req.body || {};

    if (slug !== undefined) event.slug = slug;
    if (title !== undefined) event.title = title;
    if (subtitle !== undefined) event.subtitle = subtitle;
    if (description !== undefined) event.description = description;
    if (coverImage !== undefined) event.coverImage = coverImage;
    if (onboardingEnabled !== undefined) event.onboardingEnabled = !!onboardingEnabled;

    if (startAt !== undefined) event.startAt = startAt ? new Date(startAt) : event.startAt;
    if (endAt !== undefined) event.endAt = endAt ? new Date(endAt) : event.endAt;
    if (timezone !== undefined) event.timezone = timezone;

    if (visibility !== undefined) event.visibility = visibility;
    if (capacity !== undefined) event.capacity = Number(capacity) || 0;

    if (venue && typeof venue === "object") {
      event.venue = {
        ...(event.venue || {}),
        ...venue,
        // coerce lat/lng if provided
        ...(venue.lat !== undefined ? { lat: venue.lat === null ? null : Number(venue.lat) } : {}),
        ...(venue.lng !== undefined ? { lng: venue.lng === null ? null : Number(venue.lng) } : {}),
      };
    }

    if (organizerProfile && typeof organizerProfile === "object") {
      event.organizerProfile = {
        ...(event.organizerProfile || {}),
        ...organizerProfile,
        socials: {
          ...(event.organizerProfile?.socials || {}),
          ...(organizerProfile.socials || {}),
        },
      };
    }

    if (Array.isArray(speakers)) event.speakers = speakers;
    if (Array.isArray(agenda)) event.agenda = agenda;

    // basic validation
    if (!event.title) return next(createError(400, "Title is required"));
    if (!event.startAt || !event.endAt) {
      return next(createError(400, "startAt and endAt are required"));
    }
    if (event.endAt <= event.startAt) {
      return next(createError(400, "endAt must be after startAt"));
    }

    await event.save();
    return res.json(event.toObject());
  } catch (err) {
    // handle duplicate slug nicely
    if (err?.code === 11000 && err?.keyPattern?.slug) {
      return next(createError(409, "Slug already in use"));
    }
    next(err);
  }
}

// DELETE /api/events/:id
export async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // auth: owner or organizer
    const isOwner = String(event.ownerId) === String(userId);
    const isOrganizer = await EventMember.exists({
      eventId: event._id,
      userId,
      roles: "organizer",
    });

    if (!isOwner && !isOrganizer) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    // Optional: cascade delete. Keep or remove these as your data model needs.
    await Promise.all([
      Attendee.deleteMany({ eventId: event._id }),
      EventMember.deleteMany({ eventId: event._id }),
      // If you have a Ticket model: await Ticket.deleteMany({ eventId: event._id }),
    ]);

    await event.deleteOne();

    return res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
}
