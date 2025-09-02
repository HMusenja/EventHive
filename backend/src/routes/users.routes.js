import express from "express";
import checkToken from "../middleware/checkToken.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from "../controllers/users.controller.js";

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/me", checkToken, getMe);


export default router