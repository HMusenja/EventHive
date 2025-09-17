import Ticket from "../models/Ticket.js";
import Order from "../models/Order.js";
import Event from "../models/Event.js";


export const listTicketsForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.query.eventId; // 👈 support both
    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    const now = new Date();
    const tickets = await Ticket.find({
      eventId,
      isActive: true,
      $and: [
        { $or: [{ salesStartAt: { $exists: false } }, { salesStartAt: { $lte: now } }] },
        { $or: [{ salesEndAt:   { $exists: false } }, { salesEndAt:   { $gte: now } }] },
      ],
    }).lean();

    res.json({ tickets });
  } catch (e) { next(e); }
};

// Optional now; handy for organizer dashboard:
export const createTicket = async (req, res, next) => {
  try {
    console.log("📝 createTicket called");
    console.log("req.params:", req.params);
    console.log("req.body:", req.body);
    console.log("req.user:", req.user);

    const { eventId } = req.params;

    if (!eventId) {
      console.log("❌ eventId missing in params");
      return res.status(400).json({ ok: false, message: "eventId is required" });
    }

    const ticketData = { ...req.body, eventId };
    console.log("Ticket data to create:", ticketData);

    const doc = await Ticket.create(ticketData);
    console.log("Ticket created:", doc);

    res.status(201).json({ ticket: doc });
  } catch (e) {
    console.error("CreateTicket error:", e);
    next(e);
  }
};

export const updateTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const doc = await Ticket.findByIdAndUpdate(id, req.body, { new: true });
        if (!doc) return res.status(404).json({ message: "Not found" });
        res.json({ ticket: doc });
    } catch (e) { next(e); }
};

export const deleteTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Ticket.findByIdAndDelete(id);
        res.status(204).end();
    } catch (e) { next(e); }
};

// GET /api/tickets/mine


export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const orders = await Order.find({ userId, status: "fulfilled" })
      .populate("eventId")
      .lean();

    const tickets = [];
    for (const order of orders || []) {
      for (const t of order.tickets || []) {
        // stable id: prefer subdoc _id, else fallback to orderId:ref
        const subId = t && t._id ? String(t._id) : `${String(order._id)}:${String(t?.ref || cryptoFallback())}`;

        tickets.push({
          _id: subId,
          ref: t?.ref || null,
          ticketId: t?.ticketId ? String(t.ticketId) : null,
          status: t?.status || null,
          eventId: order.eventId?._id ? String(order.eventId._id) : null,
          eventMeta: order.eventId
            ? {
                title: order.eventId.title,
                startAt: order.eventId.startAt,
                endAt: order.eventId.endAt,
                venue: order.eventId.venue,
              }
            : null,
          orderId: String(order._id),
          quantity: order.quantity,
          currency: order.currency,
          amountTotal: order.amountTotal,
          createdAt: order.createdAt,
        });
      }
    }

    return res.json({ ok: true, tickets });
  } catch (err) {
    console.error("getMyTickets error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to fetch user tickets", error: err.message });
  }
};

// small fallback generator for synthetic ref if needed
function cryptoFallback() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}
