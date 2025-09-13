import jwt from "jsonwebtoken";
import cookie from "cookie";
import User from "../models/User.js";

function getTokenFromReq(req) {
    const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const cookieHdr = cookie.parse(req.headers.cookie || "").token; // cookie name: "token"
    const cookieParsed = req.cookies?.token;                        // via cookie-parser
    return bearer || cookieHdr || cookieParsed || "";
}

export const authMiddleware = async (req, res, next) => {
    try {
        const token = getTokenFromReq(req);
        if (!token) return res.status(401).json({ message: "Not authenticated" });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.userId || payload.id || payload._id;
        if (!userId) return res.status(401).json({ message: "Invalid token" });

        const user = await User.findById(userId)
            .select("_id username fullName role isAdmin")
            .lean();

        if (!user) return res.status(401).json({ message: "User not found" });

        req.user = {
            _id: String(user._id),
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            isAdmin: !!user.isAdmin,
        };
        // (Optional) handy for queries:
        req.userId = req.user._id;

        return next();
    } catch (err) {
        // Give clearer auth errors; keep it 401 (unauthenticated)
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        console.error("authMiddleware error:", err.message);
        return res.status(401).json({ message: "Unauthorized" });
    }
};
