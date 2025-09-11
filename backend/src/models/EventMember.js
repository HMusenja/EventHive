// models/EventMember.js
import { Schema, model, Types } from "mongoose";

const EventMemberSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true },

    // Global profile for networking/matchmaking (not per-event)
    bio: { type: String, maxlength: 1000 },
    interests: [{ type: String, trim: true, lowercase: true }],
    avatar: { type: String, default: "" },

    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text + tag search
EventMemberSchema.index({ bio: "text", interests: 1 });

export default model("EventMember", EventMemberSchema);


