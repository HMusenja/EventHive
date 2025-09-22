import Message from "../models/Message.js";
// If you want to *strictly* allow only existing events, you can import Event and check existence.
// import Event from "../models/Event.js";

const MAX_LEN = 2000;

export function setupSocketHandlers(io, socket) {
    if (!socket.user?._id) {
        // Shouldn’t happen if socketAuth is wired, but double-guard
        return socket.disconnect(true);
    }

    const userId = String(socket.user._id);
    const senderLabel = socket.user.fullName || socket.user.username || "Anon";

    // Always join a personal room for DMs/notifications
    socket.join(userId);

    /* ---------- Room membership ---------- */
    socket.on("join_room", (room) => {
        const r = String(room || "").trim();
        if (!r) return;
        socket.join(r);
    });

    socket.on("leave_room", (room) => {
        const r = String(room || "").trim();
        if (!r) return;
        socket.leave(r);
    });

    /* ---------- Unified room message: chat_message ---------- */
    socket.on("chat_message", async ({ room, text }, ack) => {
        try {
            const roomName = String(room || "").trim(); // "global" or eventId/slug
            let body = String(text || "").trim();
            if (!roomName || !body) return typeof ack === "function" && ack({ error: "bad_request" });

            // Trim & cap length
            if (body.length > MAX_LEN) body = body.slice(0, MAX_LEN);

            // OPTIONALLY validate event access:
            // if (roomName !== "global") {
            //   const exists = await Event.exists({ _id: roomName });
            //   if (!exists) return typeof ack === "function" && ack({ error: "not_found" });
            // }

            const eventId = roomName === "global" ? null : roomName;

            const msg = await Message.create({ sender: userId, text: body, eventId });
            const payload = {
                _id: String(msg._id),
                text: body,
                sender: {
                    _id: userId,
                    fullName: socket.user.fullName,
                    username: socket.user.username,
                }, // client’s labelFor() accepts string or object
                createdAt: msg.createdAt,
                room: roomName,
            };

            // ACK to sender so client replaces its optimistic "tmp" message
            if (typeof ack === "function") ack(payload);

            // Broadcast to everyone else in the room (NOT the sender)
            // (Your client uses the ack to replace its own tmp; no double-insert)
            socket.to(roomName).emit("chat_message", payload);
        } catch (e) {
            if (typeof ack === "function") ack({ error: "failed" });
        }
    });

    /* ---------- Legacy handlers (optional) ---------- */
    // Keep only if you still have old clients using these events.
    socket.on("event_message", async ({ eventId, text }, ack) => {
        try {
            const room = String(eventId || "").trim();
            let body = String(text || "").trim();
            if (!room || !body) return typeof ack === "function" && ack({ error: "bad_request" });
            if (body.length > MAX_LEN) body = body.slice(0, MAX_LEN);

            const msg = await Message.create({ sender: userId, text: body, eventId: room });
            const payload = {
                _id: String(msg._id),
                text: body,
                sender: senderLabel,
                createdAt: msg.createdAt,
                room,
            };

            if (typeof ack === "function") ack(payload);
            socket.to(room).emit("event_message", payload);
        } catch (e) {
            if (typeof ack === "function") ack({ error: "failed" });
        }
    });

    // Remove if not needed; leaving here for completeness
    socket.on("forum_message", async ({ text }) => {
        let body = String(text || "").trim();
        if (!body) return;
        if (body.length > MAX_LEN) body = body.slice(0, MAX_LEN);

        const msg = await Message.create({ sender: userId, text: body, eventId: null });
        const payload = {
            _id: String(msg._id),
            text: body,
            from: senderLabel,
            createdAt: msg.createdAt,
            room: "forum",
        };
        socket.to("forum").emit("forum_message", payload);
    });

    /* ---------- Private DM ---------- */
    socket.on("private_message", async ({ to, text, eventId }) => {
        let body = String(text || "").trim();
        const toId = String(to || "").trim();
        if (!toId || !body) return;
        if (body.length > MAX_LEN) body = body.slice(0, MAX_LEN);

        const msg = await Message.create({
            sender: userId,
            recipient: toId,
            text: body,
            eventId: eventId ?? null,
        });

        io.to(toId).emit("private_message", {
            _id: String(msg._id),
            from: { _id: userId, label: senderLabel },
            text: body,
            createdAt: msg.createdAt,
        });
    });
}
