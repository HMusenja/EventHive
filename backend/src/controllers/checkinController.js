// controllers/checkinController.js
import Order from "../models/Order.js";
import Attendee from "../models/Attendee.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Event from "../models/Event.js";
import Notification from "../models/Notification.js";

/**
 * POST /api/checkin/scan
 * Body: { eventId, qrCode? , ticketRef?, orderId? }
 * - Prefer qrCode/ticketRef; orderId is optional (helps narrow search).
 */
export const checkIn = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    const ref = (req.body?.qrCode || req.body?.ticketRef || "").trim();
    const orderId = req.body?.orderId;

    if (!eventId) return res.status(400).json({ message: "eventId required" });
    if (!ref) return res.status(400).json({ message: "qrCode (ticketRef) required" });

    // ——— Lookup order containing this ticket ref ———
    const orderQuery = orderId
      ? { _id: orderId, eventId, "tickets.ref": ref }
      : { eventId, "tickets.ref": ref };

    const order = await Order.findOne(orderQuery)
      .select("eventId userId status tickets ticketId")
      .lean();

    if (!order) return res.status(404).json({ message: "Ticket not found" });
    if (order.status !== "fulfilled") {
      return res.status(400).json({ message: `Order is ${order.status}.` });
    }

    const line = order.tickets.find((t) => t.ref === ref);
    if (!line) return res.status(404).json({ message: "Ticket not found" });
    if (line.status === "revoked") {
      return res.status(409).json({ message: "Ticket revoked" });
    }

    // ——— Authorization: owner of ticket OR organizer/admin ———
    const isOwner = String(order.userId) === String(req.user._id);
    const isOrganizer = req.user.role === "admin" || req.user.role === "organizer" || req.user.isOrganizer === true;

    console.log("[checkIn] user:", req.user);
    console.log("[checkIn] order.userId:", order.userId.toString());
    console.log("[checkIn] req.user._id:", req.user._id.toString());
    console.log("[checkIn] isOwner:", isOwner);
    console.log("[checkIn] isOrganizer:", isOrganizer);

    if (!isOwner && !isOrganizer) {
      return res.status(403).json({ message: "Not authorized to check in this ticket" });
    }

    if (line.status === "used") {
      const [user, ticketType] = await Promise.all([
        User.findById(order.userId).select("fullName email").lean(),
        Ticket.findById(order.ticketId).select("name").lean(),
      ]);

      return res.status(409).json({
        message: "Ticket already used",
        ticket: { ref: line.ref, status: "used", type: ticketType?.name || "Ticket" },
        attendee: { userId: String(order.userId), name: user?.fullName, email: user?.email },
      });
    }

    // ——— Atomically mark line as used ———
    const usedAt = new Date();
    const upd = await Order.updateOne(
      { _id: order._id, "tickets.ref": ref, "tickets.status": "issued" },
      { $set: { "tickets.$.status": "used", "tickets.$.usedAt": usedAt } }
    );

    if (upd.modifiedCount === 0) {
      return res.status(409).json({ message: "Ticket is not available for check-in" });
    }

    // ——— Stamp check-in on Attendee ———
    await Attendee.findOneAndUpdate(
      { eventId: order.eventId, userId: order.userId },
      { $set: { checkedInAt: usedAt } },
      { new: true }
    );

    // ——— Fetch related info for response + notification ———
    const [user, ticketType, event] = await Promise.all([
      User.findById(order.userId).select("fullName email").lean(),
      Ticket.findById(order.ticketId).select("name").lean(),
      Event.findById(order.eventId).select("ownerId title").lean(),
    ]);

    // ——— Notify organizer ———
    if (event?.ownerId) {
      await Notification.create ({
        userId: event.ownerId,
        type: "checkin",
        title: "Attendee Check-in",
        message: `${user?.fullName || "An attendee"} checked in for ${event.title}.`,
        meta: {
          eventId: String(order.eventId),
          attendeeId: String(order.userId),
          ticketRef: ref,
          usedAt,
        },
      });

      if (req.io) {
        req.io.to(`organizer_${event.ownerId}`).emit("checkin", {
          eventId: String(order.eventId),
          attendee: { id: String(order.userId), name: user?.fullName, email: user?.email },
          ticket: { ref, usedAt },
        });
      }
    }

    return res.json({
      ok: true,
      message: "Checked in",
       selfCheckin: isOwner,
      ticket: { ref, status: "used", usedAt, type: ticketType?.name || "Ticket" },
      attendee: { userId: String(order.userId), name: user?.fullName, email: user?.email },
      eventId: String(order.eventId),
    });
  } catch (e) {
    console.error("[checkIn] error:", e);
    next(e);
  }
};
// ——— Stats endpoint remains unchanged ———
export async function getCheckinStats(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!eventId) return res.status(400).json({ message: "eventId required" });

    // core counts (fast, uses Attendee indexes)
    const [totalApproved, checkedIn] = await Promise.all([
      Attendee.countDocuments({ eventId, status: "approved" }),
      Attendee.countDocuments({ eventId, status: "approved", checkedInAt: { $ne: null } }),
    ]);

    const notCheckedIn = Math.max(totalApproved - checkedIn, 0);

    return res.json({
      eventId: String(eventId),
      totalApproved,
      checkedIn,
      notCheckedIn,
      ratios: {
        checkedIn: totalApproved ? +(checkedIn / totalApproved).toFixed(2) : 0,
        notCheckedIn: totalApproved ? +(notCheckedIn / totalApproved).toFixed(2) : 0,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
}
