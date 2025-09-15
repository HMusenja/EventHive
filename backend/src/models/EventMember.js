import { Schema, model, Types } from "mongoose";

const EventMemberSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },

    // Link to event
    eventId: { type: Types.ObjectId, ref: "Event", required: true },

    // Roles & status for this event
    roles: [{ type: String, default: [] }], // e.g. ["attendee", "organizer"]
    status: { type: String, enum: ["pending", "approved"], default: "pending" },

    // Global profile (networking / matchmaking)
    bio: { type: String, maxlength: 1000 },
    interests: [{ type: String, trim: true, lowercase: true }],
    avatar: { type: String, default: "" },

    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for text + tag search
EventMemberSchema.index({ bio: "text", interests: 1 });

// Ensure a user can only have one membership per event
EventMemberSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default model("EventMember", EventMemberSchema);



