import express from "express";
import checkToken from "../middleware/checkToken.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from "../controllers/users.controller.js";
import {
  getMyProfile,
  updateMyProfile,
  getMySummary,
} from "../controllers/profileController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/me", checkToken, getMe);

// NEW unified-profile endpoints
router.get("/me/profile", checkToken, getMyProfile);
router.put("/me/profile", checkToken, updateMyProfile);
router.get("/me/summary", checkToken, getMySummary);

export default router;
