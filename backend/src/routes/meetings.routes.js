import express from "express";
import checkToken from "../middleware/checkToken.js";
import { createMeeting, updateMeetingStatus, listMeetings, addMeetingNote, } from "../controllers/meetings.controller.js";

const router = express.Router();

router.use(checkToken); // all routes require auth
router.get("/", listMeetings);
router.post("/", createMeeting);
router.patch("/:id/status", updateMeetingStatus);
router.patch("/:id/note", checkToken, addMeetingNote);

export default router;
