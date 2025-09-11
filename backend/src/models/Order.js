// models/Order.js
import { Schema, model, Types } from "mongoose";

const TicketLineSchema = new Schema(
  {
    ticketId: { type: Types.ObjectId, ref: "Ticket", required: true },
    ref: { type: String, required: true }, // unique ticket code / QR
    status: { type: String, enum: ["issued", "revoked", "used"], default: "issued" },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    eventId: { type: Types.ObjectId, ref: "Event", required: true },
    userId:  { type: Types.ObjectId, ref: "User",  required: true },

    ticketId: { type: Types.ObjectId, ref: "Ticket", required: true },
    quantity: { type: Number, required: true, min: 1, max: 20 },

    amountTotal: { type: Number, required: true },
    currency: { type: String, default: "eur" },

    status: {
      type: String,
      enum: ["created", "awaiting_payment", "paid", "fulfilled", "refunded", "canceled"],
      default: "created",
      index: true,
    },

    tickets: { type: [TicketLineSchema], default: [] },
    stripeSessionId: String,
    stripePaymentIntentId: String,
  },
  { timestamps: true }
);
OrderSchema.index({ "tickets.ref": 1 }); 
export default model("Order", OrderSchema);
