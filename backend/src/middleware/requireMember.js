// middleware/requireMember.js
import EventMember from "../models/EventMember.js";

export async function requireMember(req, res, next) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Login required." });
    if (user.isGuest) {
      return res.status(403).json({ message: "Guests cannot access this feature." });
    }
    const profile = await EventMember.findOne({ userId: user._id }).lean();
    if (!profile || !profile.onboardingComplete) {
      return res.status(403).json({ message: "Complete onboarding to access this feature." });
    }
    req.memberProfile = profile;
    next();
  } catch (err) {
    next(err);
  }
}
