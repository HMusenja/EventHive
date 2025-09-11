// middleware/requireAttendee.js
import Attendee from "../models/Attendee.js";

export async function requireAttendee(req, res, next) {
  try {
    const userId = req.user?._id; // assumes auth middleware sets req.user
    const eventId = req.params.eventId || req.params.id || req.query.eventId;
    if (!userId || !eventId) {
      return res.status(401).json({ message: "Attendee access required." });
    }
    const attendee = await Attendee.findOne({ eventId, userId, status: "approved" }).lean();
    if (!attendee) {
      return res.status(403).json({ message: "You must hold a valid ticket for this event." });
    }
    req.attendee = attendee;
    next();
  } catch (err) {
    next(err);
  }
}
