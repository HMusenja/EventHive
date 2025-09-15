import { Schema, model, Types } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["checkin", "system", "message"], default: "system" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default model("Notification", NotificationSchema);
