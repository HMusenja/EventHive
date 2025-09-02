import User from "../models/User.js";
import createError from "http-errors"
import { generateToken } from "../utils/jwt.js";



// .................... Register User ...........................................
export const registerUser = async (req, res, next) => {
  try {
    let { fullName, email, username, password } = req.body;

    if (!fullName || !email || !username || !password) {
      return next(createError(400, "All fields are required."));
    }

    // Normalize email & username
    email = email.toLowerCase().trim();
    username = username.toLowerCase().trim();

    // Check if user exists by email OR username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return next(
        createError(
          400,
          existingUser.email === email
            ? "Email already in use."
            : "Username already in use."
        )
      );
    }

    // Create new user
    const user = new User({ fullName, email, username, password });
    await user.save();

    // Generate JWT token
    const token = generateToken({ userId: user._id });

    // Set cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
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

// .................... Login User ...........................................
export const loginUser = async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body;

    if (!password || !(identifier || email || username)) {
      return next(createError(400, "Email/username and password are required."));
    }

    // pick whichever is provided
    const id = (identifier || email || username).toLowerCase().trim();

    // Look up by email OR username
    const user = await User.findOne({
      $or: [{ email: id }, { username: id }],
    });

    if (!user) {
      return next(createError(400, "Invalid email/username or password."));
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError(400, "Invalid email/username or password."));
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id });

    // Set cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Respond with safe data
    res.status(200).json({
      message: "Login successful.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[loginUser] error:", error);
    next(error);
  }
};

// .......... Get current user profile.......................................
export const getMe = async (req, res, next) => {
  try {
    const user = req.user; 
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

//................... Logout user.......................
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};
