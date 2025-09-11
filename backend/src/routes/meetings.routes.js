import express from "express";
import checkToken from "../middleware/checkToken.js";
import { createMeeting, updateMeetingStatus, listMeetings } from "../controllers/meetings.controller.js";

const router = express.Router();

router.use(checkToken); // all routes require auth
router.get("/", listMeetings);
router.post("/", createMeeting);
router.patch("/:id/status", updateMeetingStatus);

export default router;
