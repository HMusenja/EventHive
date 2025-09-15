import jwt from "jsonwebtoken";
import cookie from "cookie";
import User from "../models/User.js";

function pickTokenFromHandshake(socket) {
    const hdr = socket.handshake.headers || {};
    const fromCookie = cookie.parse(hdr.cookie || "").token;               // <- cookie first
    const fromAuth = socket.handshake.auth?.token;
    const fromAuthTrimmed = typeof fromAuth === "string"
        ? fromAuth.replace(/^Bearer\s+/i, "")
        : "";
    const fromBearer = (hdr.authorization || "").replace(/^Bearer\s+/i, "");
    return fromCookie || fromAuthTrimmed || fromBearer || "";
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
        console.error("Socket auth error:", err.message);
        next(new Error("Unauthorized"));
    }
}
