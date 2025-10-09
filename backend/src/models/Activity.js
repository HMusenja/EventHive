// models/Activity.js
import { Schema, model, Types } from "mongoose";

const activitySchema = new Schema(
  {
    actorUserId: {
      type: Types.ObjectId,
      ref: "User",
      required: true, // the user performing the action
      index: true,
    },
    targetUserId: {
      type: Types.ObjectId,
      ref: "User",
      required: true, // the user being viewed
      index: true,
    },
    type: {
      type: String,
      enum: ["profile_view"], // extend later if needed
      required: true,
      index: true,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// ensure one unique row per actor-target-type (upsert-safe)
activitySchema.index({ actorUserId: 1, targetUserId: 1, type: 1 }, { unique: true });

export default model("Activity", activitySchema);
