import mongoose from "mongoose";
import createError from "http-errors";
import Event from "../models/Event.js";
import Message from "../models/Message.js";

const MAX_LEN = 2000;

// -------- helpers --------
async function resolveEventIdOrThrow(idOrSlug) {
    let evId = null;

    if (mongoose.isValidObjectId(idOrSlug)) {
        const byId = await Event.findById(idOrSlug).select("_id").lean();
        if (byId) evId = byId._id;
    }
    if (!evId) {
        const bySlug = await Event.findOne({ slug: idOrSlug }).select("_id").lean();
        if (bySlug) evId = bySlug._id;
    }
    if (!evId) throw createError(404, "Event not found");
    return evId;
}

const toSender = (u) =>
    u
        ? {
            _id: String(u._id),
            fullName: u.fullName || "",
            username: u.username || "",
        }
        : null;

const toWire = (room) => (m) => ({
    _id: String(m._id),
    text: m.text,
    createdAt: m.createdAt,
    room, // "global" or eventId string
    sender:
        m.sender && typeof m.sender === "object" && m.sender._id
            ? toSender(m.sender)
            : m.sender
                ? { _id: String(m.sender) }
                : null,
});

// -------- controllers --------

/**
 * GET /api/events/:eventId/messages
 * Query:
 *   - limit (default 200, max 500)
 *   - before (message _id for simple pagination)
 */
export async function listEventMessages(req, res, next) {
    try {
        const evId = await resolveEventIdOrThrow(req.params.eventId);

        const { before, limit = 200 } = req.query;
        const pageSize = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);

        let query = Message.find({ eventId: evId });
        if (before && mongoose.isValidObjectId(before)) {
            query = query.where("_id").lt(before);
        }

        const docs = await query
            .sort({ createdAt: 1 })
            .limit(pageSize)
            .populate("sender", "fullName username")
            .lean();

        res.json(docs.map(toWire(String(evId))));
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/events/:eventId/messages
 * Body: { text: string }
 */
export async function createEventMessage(req, res, next) {
    try {
        const userId = req.user?._id;
        if (!userId) return next(createError(401, "Not authenticated"));

        const evId = await resolveEventIdOrThrow(req.params.eventId);
        let text = String(req.body?.text || "").trim();
        if (!text) return next(createError(400, "Text is required"));
        if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN);

        const msg = await Message.create({ eventId: evId, sender: userId, text });
        await msg.populate("sender", "fullName username");

        res.status(201).json(toWire(String(evId))(msg));
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/chat/global/messages
 * Query:
 *   - limit (default 200, max 500)
 *   - before (message _id)
 */
export async function listGlobalMessages(req, res, next) {
    try {
        const { before, limit = 200 } = req.query;
        const pageSize = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);

        let query = Message.find({ eventId: null });
        if (before && mongoose.isValidObjectId(before)) {
            query = query.where("_id").lt(before);
        }

        const docs = await query
            .sort({ createdAt: 1 })
            .limit(pageSize)
            .populate("sender", "fullName username")
            .lean();

        res.json(docs.map(toWire("global")));
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/chat/global/messages
 * Body: { text }
 */
export async function createGlobalMessage(req, res, next) {
    try {
        const userId = req.user?._id;
        if (!userId) return next(createError(401, "Not authenticated"));

        let text = String(req.body?.text || "").trim();
        if (!text) return res.status(400).json({ message: "Text is required" });
        if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN);

        const msg = await Message.create({
            sender: userId,
            text,
            eventId: null, // global
        });
        await msg.populate("sender", "fullName username");

        res.status(201).json(toWire("global")(msg));
    } catch (err) {
        next(err);
    }
}
