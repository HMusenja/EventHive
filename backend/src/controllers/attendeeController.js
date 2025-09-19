
// backend/controllers/eventAttendeeController.js
import mongoose from "mongoose";
import Attendee from "../models/Attendee.js";
import Event from "../models/Event.js";
import EventMember from "../models/EventMember.js";
import createError from "http-errors";
import Ticket from "../models/Ticket.js";

export const createAttendee = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const { bio = "", avatar = "", interests = [], location = "", education = "" } = req.body || {};

    const attendee = await Attendee.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId }, $set: { bio, avatar, interests, location, education } },
      { new: true, upsert: true }
    );

    res.status(201).json({ attendee });
  } catch (err) {
    next(err);
  }
};


export const updateAttendee = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const { attendeeId } = req.params;
    if (!mongoose.isValidObjectId(attendeeId)) {
      return next(createError(400, "Invalid attendeeId"));
    }

    const attendee = await Attendee.findById(attendeeId);
    if (!attendee) return next(createError(404, "Attendee not found"));

    // ownership check
    if (String(attendee.userId) !== String(userId)) {
      return next(createError(403, "You cannot update this attendee"));
    }

    const updatable = ["bio", "avatar", "interests"];
    updatable.forEach((key) => {
      if (key in req.body) attendee[key] = req.body[key];
    });

    await attendee.save();
    res.json({ attendee });
  } catch (err) {
    next(err);
  }
};

export const getAttendeeById = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    if (!mongoose.isValidObjectId(attendeeId)) {
      return next(createError(400, "Invalid attendeeId"));
    }

    const attendee = await Attendee.findById(attendeeId)
      .populate({
        path: "userId",
        select: "fullName username email avatar", // tweak as needed
      });

    if (!attendee) return next(createError(404, "Attendee not found"));

    res.json({ attendee });
  } catch (err) {
    next(err);
  }
};
export const getMyAttendee = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(createError(401, "Not authenticated"));

    const attendee = await Attendee.findOne({ userId })
      .populate({ path: "userId", select: "fullName username email avatar" });

    if (!attendee) return next(createError(404, "Attendee not found"));

    res.json({ attendee });
  } catch (err) {
    next(err);
  }
};

export const getEventAttendeeCount = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const by = (req.query.by || "").toLowerCase();
    const detailed = String(req.query.detailed || "").toLowerCase() === "true";

    // Resolve eventId
    let evId;
    if (by === "slug" || !mongoose.isValidObjectId(eventId)) {
      const ev = await Event.findOne({ slug: eventId }).select("_id").lean();
      if (!ev) return next(createError(404, "Event not found"));
      evId = ev._id;
    } else {
      evId = eventId;
      const exists = await Event.exists({ _id: evId });
      if (!exists) return next(createError(404, "Event not found"));
    }

    // 1. Attendees
    const [attendeeCount, checkedInCount] = await Promise.all([
      Attendee.countDocuments({ eventId: evId, status: "approved" }),
      Attendee.countDocuments({ eventId: evId, status: "approved", checkedInAt: { $ne: null } }),
    ]);

    const split = await Attendee.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(evId), status: "approved" } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "u",
          pipeline: [{ $project: { _id: 1, isGuest: 1 } }],
        },
      },
      { $unwind: "$u" },
      { $group: { _id: "$u.isGuest", n: { $sum: 1 } } },
    ]);

    const guests = split.find((s) => s._id === true)?.n || 0;
    const members = split.find((s) => s._id === false)?.n || 0;

    // 2. Tickets (capacity, sold, revenue, min price)
    const tickets = await Ticket.find({ eventId: evId }).lean();

    const capacityTotal = tickets.reduce(
      (sum, t) => sum + (t?.quantityTotal ?? 0),
      0
    );
    const ticketsSold = tickets.reduce(
      (sum, t) => sum + (t?.quantitySold ?? 0),
      0
    );

    const revenueCents = tickets.reduce(
      (sum, t) => sum + ((t?.quantitySold ?? 0) * (t?.priceCents ?? 0)),
      0
    );

    const priceVals = tickets
      .map((t) => t?.priceCents)
      .filter((n) => Number.isFinite(n) && n > 0);
    const minTicketPriceCents = priceVals.length ? Math.min(...priceVals) : null;

    const currency = tickets.find((t) => t?.currency)?.currency || "eur";

    return res.json({
      eventId: String(evId),
      attendeeCount,
      checkedInCount,
      memberCount: members,
      breakdown: detailed ? { guests, members } : undefined,

      capacityTotal,
      ticketsSold,
      minTicketPrice: minTicketPriceCents !== null ? minTicketPriceCents / 100 : null, // convert to major units
      totalRevenue: revenueCents / 100,
      currency: currency.toUpperCase(),
    });
  } catch (err) {
    next(err);
  }
};