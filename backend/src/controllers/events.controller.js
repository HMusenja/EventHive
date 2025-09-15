import Event from "../models/Event.js";
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
    const ownerId = req.user._id; // from checkToken
    const event = await Event.create({ ...req.body, ownerId });

    // Upsert membership as organizer
    await EventMember.updateOne(
      { eventId: event._id, userId: ownerId },
      { $setOnInsert: { roles: ["organizer"], status: "approved" } },
      { upsert: true }
    );

    res.status(201).json(event);
  } catch (err) {
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
