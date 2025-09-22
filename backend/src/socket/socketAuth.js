import jwt from "jsonwebtoken";
import cookie from "cookie";
import User from "../models/User.js";

function pickTokenFromHandshake(socket) {
    const hdr = socket.handshake.headers || {};
    const cookies = cookie.parse(hdr.cookie || "");

    // Try multiple common cookie names
    const cookieToken =
        cookies.token ||
        cookies.jwt ||
        cookies.accessToken ||
        cookies.authToken ||
        "";

    // Allow handshake.auth.token and Authorization: Bearer
    const authToken =
        typeof socket.handshake.auth?.token === "string"
            ? socket.handshake.auth.token.replace(/^Bearer\s+/i, "")
            : "";

    const bearer = (hdr.authorization || "").replace(/^Bearer\s+/i, "");

    return cookieToken || authToken || bearer || "";
}

export async function socketAuth(socket, next) {
    try {
        const token = pickTokenFromHandshake(socket);
        if (!token) return next(new Error("Unauthorized: no token"));

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.userId || payload.id || payload._id;
        if (!userId) return next(new Error("Unauthorized: bad payload"));

        const user = await User.findById(userId)
            .select("_id username fullName role isAdmin")
            .lean();
        if (!user) return next(new Error("Unauthorized: user not found"));

        socket.user = {
            _id: String(user._id),
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            isAdmin: !!user.isAdmin,
        };

        next();
    } catch (err) {
        console.error("Socket auth error:", err?.message || err);
        next(new Error("Unauthorized"));
    }
}
