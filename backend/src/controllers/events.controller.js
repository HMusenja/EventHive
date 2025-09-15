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
