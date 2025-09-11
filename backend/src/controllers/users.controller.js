// controllers/authController.js
import User from "../models/User.js";
import createError from "http-errors";
import { generateToken } from "../utils/jwt.js";

// ---------------- Register ----------------
export const registerUser = async (req, res, next) => {
  try {
    let { fullName, email, username, password } = req.body;

    if (!fullName || !email || !username || !password) {
      return next(createError(400, "All fields are required.", { code: "AUTH_MISSING_FIELDS" }));
    }

    email = String(email).toLowerCase().trim();
    username = String(username).toLowerCase().trim();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(
        createError(
          400,
          existingUser.email === email ? "Email already in use." : "Username already in use.",
          { code: existingUser.email === email ? "EMAIL_EXISTS" : "USERNAME_EXISTS" }
        )
      );
    }

    const user = new User({ fullName, email, username, password });
    await user.save();

    const token = generateToken({ userId: user._id });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[registerUser] error:", error);
    next(error);
  }
};

// ---------------- Login ----------------
export const loginUser = async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body || {};

    if (!password || !(identifier || email || username)) {
      return next(createError(400, "Email/username and password are required.", { code: "AUTH_MISSING_FIELDS" }));
    }

    const id = String(identifier || email || username).toLowerCase().trim();

    // IMPORTANT: select password for compare, and fields we branch on
    const user = await User.findOne({ $or: [{ email: id }, { username: id }] })
      .select("+password role accountStatus isGuest")
      .lean(false);

    if (!user) {
      return next(createError(400, "Invalid email/username or password.", { code: "AUTH_INVALID_CREDENTIALS" }));
    }

    // Block deleted / suspended accounts explicitly
    if (user.accountStatus === "deleted") {
      return next(createError(403, "Account deleted.", { code: "ACCOUNT_DELETED" }));
    }
    if (user.accountStatus === "suspended") {
      return next(createError(403, "Account suspended.", { code: "ACCOUNT_SUSPENDED" }));
    }

    // If this email was created via guest checkout, they may not have a password yet
    if (user.isGuest === true || !user.password) {
      return next(
        createError(
          400,
          "This email is a guest account. Please set a password to continue.",
          { code: "GUEST_NO_PASSWORD" }
        )
      );
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return next(createError(400, "Invalid email/username or password.", { code: "AUTH_INVALID_CREDENTIALS" }));
    }

    const token = generateToken({ userId: user._id });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Track login activity (your schema uses lastLoginAt)
    user.lastLoginAt = new Date();
    await user.save();

    const safe = user.toObject();
    delete safe.password;

    res.status(200).json({
      message: "Login successful.",
      user: {
        _id: safe._id,
        fullName: safe.fullName,
        email: safe.email,
        username: safe.username,
        createdAt: safe.createdAt,
        role: safe.role,
      },
    });
  } catch (error) {
    console.error("[loginUser] error:", error);
    next(error);
  }
};

// ---------------- Get Me ----------------
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({ user });
  } catch (error) { next(error); }
};

// ---------------- Logout ----------------
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};
