import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import { CreateMeetingSchema, UpdateStatusSchema } from "../validation/meetings.schema.js";
import Attendee from "../models/Attendee.js";

/* ----------------------------- helpers ----------------------------- */

// Create a Notification matching your schema: { userId, type, title, message, meta }
async function createNotification({ userId, type = "system", title = "New message", message = "You’ve got a reply.", meta = {} }) {
    try {
        const { default: Notification } = await import("../models/Notification.js");
        await Notification.create({
            userId,
            type,
            title,
            message,
            meta: {
                link: `/messages/${threadId}`,  // <— the deep link
                threadId,
            },
        });
    } catch (e) {
        console.warn("[meetings] createNotification failed:", e?.message || e);
    }
}

// Build a rich meta payload for deep-links/history
function buildMeta(meeting, actorId, label) {
    return {
        meetingId: String(meeting._id),
        eventId: meeting.eventId ? String(meeting.eventId) : undefined,
        requesterId: String(meeting.requesterId),
        inviteeId: String(meeting.inviteeId),
        startAt: meeting.startAt,
        endAt: meeting.endAt,
        location: meeting.location,
        place: meeting.place,
        status: meeting.status,
        actorId: String(actorId),
        label, // invited | accepted | declined | cancelled | updated | note
    };
}

// Notify the other participant (not the actor) with a friendly title/message
async function notifyOtherHuman(meeting, actorId, kind, explicitMessage) {
    const rid = String(meeting.requesterId);
    const iid = String(meeting.inviteeId);
    const to = String(actorId) === rid ? iid : rid;

    let type = "system"; // enum: checkin | system | message
    let title = "Meeting update";
    let message = explicitMessage || "There’s an update on your meeting.";

    switch (kind) {
        case "invited":
            title = "New meeting request";
            message = explicitMessage || "You’ve received a new meeting request.";
            type = "system";
            break;
        case "accepted":
            title = "Meeting accepted";
            message = explicitMessage || "Your meeting request was accepted.";
            type = "system";
            break;
        case "declined":
            title = "Meeting declined";
            message = explicitMessage || "Your meeting request was declined.";
            type = "system";
            break;
        case "cancelled":
            title = "Meeting cancelled";
            message = explicitMessage || "The meeting was cancelled.";
            type = "system";
            break;
        case "note":
            title = "New message about your meeting";
            message = explicitMessage || "You’ve received a new message.";
            type = "message";
            break;
        default:
            // "updated"
            title = "Meeting updated";
            message = explicitMessage || "Your meeting was updated.";
            type = "system";
    }

    await createNotification({
        userId: to,
        type,
        title,
        message,
        meta: buildMeta(meeting, actorId, kind),
    });
}

// Overlap detector (supports excluding a specific meeting id)
async function hasConflict({ userId, startAt, endAt, excludeId }) {
    const q = {
        status: { $in: ["pending", "accepted"] },
        $or: [{ requesterId: userId }, { inviteeId: userId }],
        startAt: { $lt: endAt },
        endAt: { $gt: startAt },
    };
    if (excludeId) q._id = { $ne: excludeId };
    return await Meeting.exists(q);
}

/* ----------------------------- routes ----------------------------- */

// POST /api/meetings  (create a request)
export async function createMeeting(req, res, next) {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

        const body = CreateMeetingSchema.parse(req.body);
        const startAt = new Date(body.startAt);
        const endAt = new Date(body.endAt);
        if (!(+startAt) || !(+endAt)) return res.status(400).json({ message: "Invalid dates" });
        if (startAt >= endAt) return res.status(400).json({ message: "Invalid time range" });

        // deny self-invite
        if (String(req.user._id) === body.inviteeId) {
            return res.status(400).json({ message: "Cannot invite yourself" });
        }

        // Event-scoped: both must be approved attendees
        if (body.eventId) {
            const eventId = new mongoose.Types.ObjectId(body.eventId);
            const meId = new mongoose.Types.ObjectId(req.user._id);
            const inviteeId = new mongoose.Types.ObjectId(body.inviteeId);

            const [meMember, inviteeMember] = await Promise.all([
                Attendee.findOne({ eventId, userId: meId, status: "approved" }).lean(),
                Attendee.findOne({ eventId, userId: inviteeId, status: "approved" }).lean(),
            ]);
            if (!meMember || !inviteeMember) {
                return res.status(403).json({ message: "Both participants must be approved attendees of this event" });
            }
        }

        // conflict check for both requester and invitee
        const [c1, c2] = await Promise.all([
            hasConflict({ userId: req.user._id, startAt, endAt }),
            hasConflict({ userId: new mongoose.Types.ObjectId(body.inviteeId), startAt, endAt }),
        ]);
        if (c1 || c2) return res.status(409).json({ message: "Time slot not available" });

        const doc = await Meeting.create({
            eventId: body.eventId || undefined, // optional (global meeting if undefined)
            requesterId: req.user._id,
            inviteeId: body.inviteeId,
            startAt,
            endAt,
            location: body.location || "in-person",
            place: body.place || "",
            message: body.message || "",
            status: "pending",
        });

        // notify invitee of the new request
        await notifyOtherHuman(doc, req.user._id, "invited");

        res.status(201).json({ meeting: doc });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/meetings/:id/status  (invitee accepts/declines, either participant may cancel)
export async function updateMeetingStatus(req, res, next) {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

        // Validate just "status"; read "note" separately
        const { status } = UpdateStatusSchema.parse(req.body);
        const note = (req.body?.note ?? "").toString().trim();

        const m = await Meeting.findById(req.params.id);
        if (!m) return res.status(404).json({ message: "Not found" });

        const uid = String(req.user._id);
        const isInvitee = uid === String(m.inviteeId);
        const isRequester = uid === String(m.requesterId);
        const isParticipant = isInvitee || isRequester;
        if (!isParticipant) return res.status(403).json({ message: "Only participants may update this meeting" });

        // Accept/Decline only by invitee
        if ((status === "accepted" || status === "declined") && !isInvitee) {
            return res.status(403).json({ message: "Only invitee may accept/decline" });
        }

        // Cancel/Remove allowed by either participant; idempotent
        if (status === "cancelled") {
            if (m.status !== "cancelled") {
                m.status = "cancelled";
                if (note) m.responseNote = note;
                await m.save();
                await notifyOtherHuman(m, uid, "cancelled");
            }
            return res.json({ meeting: m });
        }

        // Re-check conflicts only when accepting — exclude this meeting
        if (status === "accepted") {
            const [c1, c2] = await Promise.all([
                hasConflict({ userId: m.requesterId, startAt: m.startAt, endAt: m.endAt, excludeId: m._id }),
                hasConflict({ userId: m.inviteeId, startAt: m.startAt, endAt: m.endAt, excludeId: m._id }),
            ]);
            if (c1 || c2) return res.status(409).json({ message: "Slot no longer available" });
        }

        m.status = status;
        if (note) m.responseNote = note;
        await m.save();

        const kind =
            status === "accepted" ? "accepted" :
                status === "declined" ? "declined" :
                    "updated";

        await notifyOtherHuman(m, uid, kind);

        res.json({ meeting: m });
    } catch (err) {
        next(err);
    }
}

// GET /api/meetings?eventId=...&role=mine|incoming|outgoing
export async function listMeetings(req, res, next) {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

        const { eventId, role } = req.query;

        const q = {};
        if (eventId) q.eventId = eventId;
        if (role === "incoming") q.inviteeId = req.user._id;
        else if (role === "outgoing") q.requesterId = req.user._id;
        else q.$or = [{ requesterId: req.user._id }, { inviteeId: req.user._id }];

        const meetings = await Meeting.find(q).sort({ startAt: 1 }).lean();
        res.json({ meetings });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/meetings/:id/note  (participants can leave a short note w/o changing status)
export async function addMeetingNote(req, res, next) {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

        const note = (req.body?.note ?? "").toString().trim();
        if (!note) return res.status(400).json({ message: "Note text is required" });

        const m = await Meeting.findById(req.params.id);
        if (!m) return res.status(404).json({ message: "Not found" });

        const uid = String(req.user._id);
        const isParticipant = [String(m.requesterId), String(m.inviteeId)].includes(uid);
        if (!isParticipant) return res.status(403).json({ message: "Only participants may add a note" });

        // MVP: single note slot; overwrite with the latest message
        m.responseNote = note;
        await m.save();

        await notifyOtherHuman(m, uid, "note", "They left you a message about this meeting.");

        res.json({ meeting: m });
    } catch (err) {
        next(err);
    }
}
