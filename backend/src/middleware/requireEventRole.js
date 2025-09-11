// middleware/requireEventRole.js
import Event from "../models/Event.js";
import Attendee from "../models/Attendee.js";

/**
 * Ensure user has one of the required roles in the event.
 * Owner (event.ownerId) bypasses check as organizer.
 *
 * @param {string[]|string} roles - roles to require, e.g. ["organizer", "staff"]
 */
export const requireEventRole = (roles = []) => {
  const want = Array.isArray(roles) ? roles : [roles];

  return async (req, _res, next) => {
    try {
      const eventId = req.params.eventId || req.body.eventId;
      if (!eventId) throw Object.assign(new Error("eventId required"), { status: 400 });

      // Owner bypass
      const event = await Event.findById(eventId).select("ownerId").lean();
      if (!event) throw Object.assign(new Error("Event not found"), { status: 404 });
      if (String(event.ownerId) === String(req.user._id)) return next();

      const att = await Attendee.findOne({ eventId, userId: req.user._id, status: "approved" }).lean();
      if (!att) throw Object.assign(new Error("Not a participant"), { status: 403 });

      const ok = want.length === 0 || want.some(r => att.roles?.includes(r));
      if (!ok) throw Object.assign(new Error("Insufficient role"), { status: 403 });

      next();
    } catch (e) {
      next(e);
    }
  };
};

/**
 * Allow access to *any* approved participant (attendee/speaker/staff/organizer)
 * or the event owner. Use this when you just need event access, not a specific role.
 */
export const requireEventAccess = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const eventId = req.params.eventId || req.body.eventId || req.query.eventId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    if (!eventId) return res.status(400).json({ message: "eventId required" });

    // Owner bypass
    const event = await Event.findById(eventId).select("ownerId").lean();
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.ownerId) === String(userId)) return next();

    // Any approved participant
    const att = await Attendee.findOne({ eventId, userId, status: "approved" }).lean();
    if (!att) return res.status(403).json({ message: "Forbidden" });

    // Optional: ensure roles array exists (attendees default to ["attendee"])
    if (!att.roles || att.roles.length === 0) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  } catch (e) {
    return next(e);
  }
};
