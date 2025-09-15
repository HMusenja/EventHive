import Ticket from "../models/Ticket.js";


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
