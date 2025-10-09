import express from "express";
import { recordView, listViewed } from "../controllers/activityController.js";
import checkToken from "../middleware/checkToken.js";

const router = express.Router();

router.post("/view", checkToken, recordView);
router.get("/viewed", checkToken, listViewed);

export default router;