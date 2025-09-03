// backend/src/controllers/tickets.controller.js
import Ticket from "../models/Ticket.js";

export const listTicketsForEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const now = new Date();

        const tickets = await Ticket.find({
            eventId,
            isActive: true,
            $and: [
                { $or: [{ salesStartAt: { $exists: false } }, { salesStartAt: { $lte: now } }] },
                { $or: [{ salesEndAt: { $exists: false } }, { salesEndAt: { $gte: now } }] },
            ],
        }).lean();

        res.json({ tickets });
    } catch (e) { next(e); }
};

// Optional now; handy for organizer dashboard:
export const createTicket = async (req, res, next) => {
    try {
        const doc = await Ticket.create(req.body);
        res.status(201).json({ ticket: doc });
    } catch (e) { next(e); }
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
