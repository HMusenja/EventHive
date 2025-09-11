import express from "express";
import { getMatchSuggestions } from "../controllers/eventMatchController.js";
// If you want to require auth to personalize results, add checkToken
 import checkToken from "../middleware/checkToken.js";

const router = express.Router();

// Get suggestions by eventId OR slug (same param; controller handles both)
router.get("/events/:eventId/match/suggestions",checkToken, getMatchSuggestions);
// If you want only-auth suggestions, use: [checkToken, getMatchSuggestions]

export default router;
