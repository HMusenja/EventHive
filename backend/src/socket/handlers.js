import Message from "../models/Message.js";

export function setupSocketHandlers(io, socket) {
    const userId = String(socket.user._id);
    const senderLabel = socket.user.fullName || socket.user.username || "Anon";

    // Personal room + global (and forum for legacy)
    socket.join(userId);
    socket.join("global");
    socket.join("forum"); // keep if older clients still use forum_message

    /* ---------- Room membership ---------- */
    socket.on("join_room", (room) => {
        if (!room) return;
        socket.join(String(room));
    });

    socket.on("leave_room", (room) => {
        if (!room) return;
        socket.leave(String(room));
    });

    /* ---------- Unified room message: chat_message ---------- */
    socket.on("chat_message", async ({ room, text }, ack) => {
        try {
            const roomName = String(room || "").trim(); // "global" or eventId
            const body = String(text || "").trim();
            if (!roomName || !body) return typeof ack === "function" && ack({ error: "bad_request" });

            const eventId = roomName === "global" ? null : roomName;

            const msg = await Message.create({ sender: userId, text: body, eventId });
            const payload = {
                _id: String(msg._id),
                text: body,
                sender: senderLabel,       // string label works with your labelFor()
                createdAt: msg.createdAt,
                room: roomName,
            };

            // ACK only to sender (so client can replace its optimistic message)
            if (typeof ack === "function") ack(payload);

            // Broadcast to everyone else in the room (not the sender)
            socket.to(roomName).emit("chat_message", payload);
        } catch (e) {
            if (typeof ack === "function") ack({ error: "failed" });
        }
    });

    /* ---------- Legacy per-event message (kept for compatibility) ---------- */
    socket.on("event_message", async ({ eventId, text }, ack) => {
        try {
            const room = String(eventId || "").trim();
            const body = String(text || "").trim();
            if (!room || !body) return typeof ack === "function" && ack({ error: "bad_request" });

            const msg = await Message.create({ sender: userId, text: body, eventId: room });
            const payload = {
                _id: String(msg._id),
                text: body,
                sender: senderLabel,
                createdAt: msg.createdAt,
                room,
            };

            if (typeof ack === "function") ack(payload);   // to sender only
            socket.to(room).emit("event_message", payload); // everyone else
        } catch (e) {
            if (typeof ack === "function") ack({ error: "failed" });
        }
    });

    /* ---------- Legacy global/forum message (optional) ---------- */
    socket.on("forum_message", async ({ text }) => {
        const body = String(text || "").trim();
        if (!body) return;

        const msg = await Message.create({ sender: userId, text: body, eventId: null });
        const payload = {
            _id: String(msg._id),
            text: body,
            from: senderLabel,
            createdAt: msg.createdAt,
            room: "forum",
        };

        // forum is legacy; broadcast to that room
        socket.to("forum").emit("forum_message", payload);
        // optionally: also ACK to sender so old UIs can replace optimistic
        // (skip if your old client doesn't expect it)
    });

    /* ---------- Private DM ---------- */
    socket.on("private_message", async ({ to, text, eventId }) => {
        const body = String(text || "").trim();
        const toId = String(to || "").trim();
        if (!toId || !body) return;

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
