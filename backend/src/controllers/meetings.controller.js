import Meeting from "../models/Meeting.js";
import { CreateMeetingSchema, UpdateStatusSchema } from "../validation/meetings.schema.js";
import mongoose from "mongoose";

// naive overlap detector (MVP)
async function hasConflict({ userId, startAt, endAt }) {
    return await Meeting.exists({
        $or: [{ requesterId: userId }, { inviteeId: userId }],
        status: { $in: ["pending", "accepted"] },
        $or: [
            { startAt: { $lt: endAt }, endAt: { $gt: startAt } }, // overlap
        ],
    });
}

// POST /api/meetings  (create a request)
export async function createMeeting(req, res, next) {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

        const body = CreateMeetingSchema.parse(req.body);
        const startAt = new Date(body.startAt);
        const endAt = new Date(body.endAt);
        if (startAt >= endAt) return res.status(400).json({ message: "Invalid time range" });

        // deny self-invite
        if (String(req.user._id) === body.inviteeId) {
            return res.status(400).json({ message: "Cannot invite yourself" });
        }

        // conflict check for both requester and invitee
        const [c1, c2] = await Promise.all([
            hasConflict({ userId: req.user._id, startAt, endAt }),
            hasConflict({ userId: new mongoose.Types.ObjectId(body.inviteeId), startAt, endAt }),
        ]);
        if (c1 || c2) return res.status(409).json({ message: "Time slot not available" });

        const doc = await Meeting.create({
            eventId: body.eventId,
            requesterId: req.user._id,
            inviteeId: body.inviteeId,
            startAt,
            endAt,
            location: body.location || "in-person",
            place: body.place || "",
            message: body.message || "",
            status: "pending",
        });

        res.status(201).json({ meeting: doc });
    } catch (err) { next(err); }
}

// PATCH /api/meetings/:id/status  (invitee accepts/declines, requester can cancel)
export async function updateMeetingStatus(req, res, next) {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
        const { status } = UpdateStatusSchema.parse(req.body);
        const m = await Meeting.findById(req.params.id);
        if (!m) return res.status(404).json({ message: "Not found" });

        // permissions: invitee can accept/decline; requester can cancel
        const uid = String(req.user._id);
        const isInvitee = uid === String(m.inviteeId);
        const isRequester = uid === String(m.requesterId);

        if (status === "accepted" || status === "declined") {
            if (!isInvitee) return res.status(403).json({ message: "Only invitee may accept/decline" });
        }
        if (status === "cancelled") {
            if (!isInvitee && !isRequester) return res.status(403).json({ message: "Only participants may cancel" });
        }

        // re-check conflicts only when accepting
        if (status === "accepted") {
            const [c1, c2] = await Promise.all([
                hasConflict({ userId: m.requesterId, startAt: m.startAt, endAt: m.endAt }),
                hasConflict({ userId: m.inviteeId, startAt: m.startAt, endAt: m.endAt }),
            ]);
            if (c1 || c2) return res.status(409).json({ message: "Slot no longer available" });
        }

        m.status = status;
        await m.save();
        res.json({ meeting: m });
    } catch (err) { next(err); }
}

// GET /api/meetings?eventId=...&role=mine|incoming|outgoing
export async function listMeetings(req, res, next) {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
        const { eventId, role } = req.query;
        const q = { eventId };
        const uid = req.user._id;

        if (role === "incoming") q.inviteeId = uid;
        else if (role === "outgoing") q.requesterId = uid;
        else q.$or = [{ requesterId: uid }, { inviteeId: uid }];

        const items = await Meeting.find(q).sort({ startAt: 1 }).lean();
        res.json({ meetings: items });
    } catch (err) { next(err); }
}
