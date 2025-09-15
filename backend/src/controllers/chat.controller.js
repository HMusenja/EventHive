import mongoose from "mongoose";
import createError from "http-errors";
import Event from "../models/Event.js";
import Message from "../models/Message.js";

// Resolve :eventId that can be an ObjectId or a slug; throw 404 if not found
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

/**
 * GET /api/events/:eventId/messages
 * Optional query:
 *   - limit (default 200, max 500)
 *   - before (message _id for simple pagination)
 */
export async function listEventMessages(req, res, next) {
    try {
        const eventId = await resolveEventIdOrThrow(req.params.eventId);

        const { before, limit = 200 } = req.query;
        const pageSize = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);

        let query = Message.find({ eventId });

        // Simple "load older than" pagination
        if (before && mongoose.isValidObjectId(before)) {
            query = query.where("_id").lt(before);
        }

        const docs = await query
            .sort({ createdAt: 1 })
            .limit(pageSize)
            .populate("sender", "fullName username")
            .lean();

        const data = docs.map((m) => ({
            _id: String(m._id),
            text: m.text,
            sender: m.sender
                ? {
                    _id: String(m.sender._id),
                    fullName: m.sender.fullName || "",
                    username: m.sender.username || "",
                }
                : null,
            createdAt: m.createdAt,
        }));

        res.json(data);
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

        const eventId = await resolveEventIdOrThrow(req.params.eventId);
        const text = (req.body?.text ?? "").toString().trim();
        if (!text) return next(createError(400, "Text is required"));

        const msg = await Message.create({ eventId, sender: userId, text });

        res.status(201).json({
            _id: String(msg._id),
            text,
            sender: {
                _id: String(userId),
                fullName: req.user.fullName,
                username: req.user.username,
            },
            createdAt: msg.createdAt,
        });
    } catch (err) {
        next(err);
    }
}

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

        res.json(
            docs.map((d) => ({
                _id: String(d._id),
                text: d.text,
                sender: d.sender
                    ? {
                        _id: String(d.sender._id),
                        fullName: d.sender.fullName || "",
                        username: d.sender.username || "",
                    }
                    : null,
                createdAt: d.createdAt,
            }))
        );
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
        const text = String(req.body?.text || "").trim();
        if (!text) return res.status(400).json({ message: "Text is required" });

        const msg = await Message.create({
            sender: req.user._id,
            text,
            eventId: null, // global
        });

        // shape consistent with list response
        res.status(201).json({
            _id: String(msg._id),
            text: msg.text,
            sender: {
                _id: String(req.user._id),
                fullName: req.user.fullName || "",
                username: req.user.username || "",
            },
            createdAt: msg.createdAt,
        });
    } catch (err) {
        next(err);
    }
}