import Message from "../models/Message.js";

export function setupSocketHandlers(io, socket) {
    const userId = String(socket.user._id);
    const senderLabel = socket.user.fullName || socket.user.username || "Anon";

    socket.join(userId);
    socket.join("forum");

    socket.on("join_room", (eventId) => {
        const room = String(eventId);
        socket.join(room);
    });

    socket.on("leave_room", (eventId) => {
        socket.leave(String(eventId));
    });

    // ✅ ACK + no self-broadcast
    socket.on("event_message", async ({ eventId, text }, ack) => {
        try {
            const room = String(eventId);
            const body = String(text || "").trim();
            if (!room || !body) return;

            const msg = await Message.create({ sender: userId, text: body, eventId: room });

            // Send the saved message back ONLY to the sender via ack
            const payload = {
                _id: String(msg._id),
                text: body,
                sender: senderLabel,     // string label (works with your labelFor)
                createdAt: msg.createdAt,
            };
            if (typeof ack === "function") ack(payload);

            // And broadcast to everyone else in the room (❌ not the sender)
            socket.to(room).emit("event_message", payload);
        } catch (e) {
            if (typeof ack === "function") ack({ error: "failed" });
        }
    });

    // unchanged…
    socket.on("forum_message", async ({ text }) => {
        const body = String(text || "").trim();
        if (!body) return;

        const msg = await Message.create({ sender: userId, text: body, eventId: null });
        io.to("forum").emit("forum_message", {
            _id: String(msg._id),
            text: body,
            from: senderLabel,
            createdAt: msg.createdAt,
        });
    });

    socket.on("private_message", async ({ to, text, eventId }) => {
        const body = String(text || "").trim();
        if (!to || !body) return;

        const msg = await Message.create({ sender: userId, recipient: String(to), text: body, eventId: eventId ?? null });
        io.to(String(to)).emit("private_message", {
            _id: String(msg._id),
            from: { _id: userId, label: senderLabel },
            text: body,
            createdAt: msg.createdAt,
        });
    });
}
