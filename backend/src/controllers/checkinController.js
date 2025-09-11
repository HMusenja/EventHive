// controllers/checkinController.js
import Order from "../models/Order.js";
import Attendee from "../models/Attendee.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

/**
 * POST /api/checkin/scan
 * Body: { eventId, qrCode? , ticketRef?, orderId? }
 * - Prefer qrCode/ticketRef; orderId is optional (helps narrow search).
 */
export const checkIn = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.eventId; // allow either
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

    const line = order.tickets.find(t => t.ref === ref);
    if (!line) return res.status(404).json({ message: "Ticket not found" });

    if (line.status === "revoked") {
      return res.status(409).json({ message: "Ticket revoked" });
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

    // ——— Atomically mark line as used (only if currently 'issued') ———
    const usedAt = new Date();
    const upd = await Order.updateOne(
      { _id: order._id, "tickets.ref": ref, "tickets.status": "issued" },
      { $set: { "tickets.$.status": "used", "tickets.$.usedAt": usedAt } }
    );

    if (upd.modifiedCount === 0) {
      // Race or status changed — inform scanner
      return res.status(409).json({ message: "Ticket is not available for check-in" });
    }

    // ——— Stamp check-in on Attendee (event-scoped) ———
    await Attendee.findOneAndUpdate(
      { eventId: order.eventId, userId: order.userId },
      { $set: { checkedInAt: usedAt } },
      { new: true }
    );

    // Build summary
    const [user, ticketType] = await Promise.all([
      User.findById(order.userId).select("fullName email").lean(),
      Ticket.findById(order.ticketId).select("name").lean(),
    ]);

    return res.json({
      ok: true,
      message: "Checked in",
      ticket: { ref, status: "used", usedAt, type: ticketType?.name || "Ticket" },
      attendee: { userId: String(order.userId), name: user?.fullName, email: user?.email },
      eventId: String(order.eventId),
    });
  } catch (e) {
    next(e);
  }
};

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
      // handy ratios for dashboards (rounded to 2 decimals)
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