import jwt from "jsonwebtoken";
import createError from "http-errors";
import User from "../models/User.js";
import "dotenv/config";

const checkToken = async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    // ✅ Match your backend's cookie name
    const jwtToken = req.cookies?.token || bearerToken;

    console.log("🍪 Cookies received:", req.cookies);

    if (!jwtToken) {
      throw createError(401, "Unauthorized: No token provided");
    }

    // Verify token
   const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);


    console.log("✅ Decoded token:", decoded); // should show userId
console.log("🔎 Looking for user with ID:", decoded.userId);

    // Fetch user from DB
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw createError(401, "Unauthorized: User not found");
    }

    // Attach to request
    req.user = user;
    req.isAuthenticated = true;

    console.log("🔐 Authenticated user:", req.user);

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      next(createError(401, "Token expired"));
    } else if (error.name === "JsonWebTokenError") {
      next(createError(401, "Invalid token"));
    } else {
      next(error);
    }
  }
};

export default checkToken;