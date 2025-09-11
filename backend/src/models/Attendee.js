// models/Attendee.js
import { Schema, model, Types } from "mongoose";

const ROLE_ENUM = ["organizer", "attendee", "speaker", "staff"];

const AttendeeSchema = new Schema(
  {
    eventId: { type: Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    
    // Event-scoped roles/permissions
    roles: {
      type: [String],
      enum: ROLE_ENUM,
      default: ["attendee"], // non-owners default; owners set to ["organizer"] on event creation
    },

    // Linkage to a purchase/order (name depends on your existing model)
    orderId: { type: Types.ObjectId, ref: "Order" }, // keep optional for now
    ticketProductId: { type: Types.ObjectId, ref: "Ticket" }, // the ticket type/product

    status: {
      type: String,
      enum: ["approved", "revoked"],
      default: "approved",
      index: true,
    },

    quantity: { type: Number, default: 1, min: 1 }, // group entry MVP
    checkedInAt: Date,
  },
  { timestamps: true }
);

// One attendee record per (event,user)
// Fast count queries
AttendeeSchema.index({ eventId: 1, status: 1 });
AttendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });
AttendeeSchema.index({ eventId: 1, checkedInAt: 1 }); // optional but handy


export default model("Attendee", AttendeeSchema);
export const ATTENDEE_ROLE_ENUM = ROLE_ENUM;

