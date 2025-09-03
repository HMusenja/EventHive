// backend/src/controllers/events.controller.js
import Event from "../models/Event.js";

export async function getAllEvents(req, res, next) {
  try {
    const events = await Event.find().lean();
    res.json(events);
  } catch (err) {
    next(err);
  }
}

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
