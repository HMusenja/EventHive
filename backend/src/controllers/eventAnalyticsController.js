// controllers/eventAnalyticsController.js
import mongoose from "mongoose";
import Attendee from "../models/Attendee.js";
import Order from "../models/Order.js";
import Event from "../models/Event.js";

export async function getEventDashboardStats(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) return res.status(400).json({ message: "Invalid eventId" });

    const exists = await Event.exists({ _id: eventId });
    if (!exists) return res.status(404).json({ message: "Event not found" });

    // Core counts from Attendee (approved scope)
    const [totalApproved, checkedIn] = await Promise.all([
      Attendee.countDocuments({ eventId, status: "approved" }),
      Attendee.countDocuments({ eventId, status: "approved", checkedInAt: { $ne: null } }),
    ]);
    const notCheckedIn = Math.max(totalApproved - checkedIn, 0);

    // Split guests vs members (lookup users)
    const split = await Attendee.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId), status: "approved" } },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "u", pipeline: [{ $project: { isGuest: 1 }}]} },
      { $unwind: "$u" },
      { $group: { _id: "$u.isGuest", n: { $sum: 1 } } },
    ]);
    const guests  = split.find(s => s._id === true)?.n  ?? 0;
    const members = split.find(s => s._id === false)?.n ?? 0;

    // Refund stats from Orders
    // - refundedOrders: count of orders with status "refunded"
    // - refundedTickets: count of ticket lines with status "revoked"
    const [refundedOrders, refundedTicketsAgg] = await Promise.all([
      Order.countDocuments({ eventId, status: "refunded" }),
      Order.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
        { $unwind: "$tickets" },
        { $match: { "tickets.status": "revoked" } },
        { $count: "n" },
      ]),
    ]);
    const refundedTickets = refundedTicketsAgg[0]?.n || 0;

    return res.json({
      eventId,
      attendees: {
        totalApproved,
        guests,
        members,
        checkedIn,
        notCheckedIn,
      },
      refunds: {
        refundedOrders,
        refundedTickets,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (e) { next(e); }
}
