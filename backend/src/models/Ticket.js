import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        name: { type: String, required: true },
        description: String,
        currency: { type: String, default: "eur" },     // always lower-case ISO
        priceCents: { type: Number, required: true },   // store in cents
        quantityTotal: { type: Number, required: true },
        quantitySold: { type: Number, default: 0 },
        salesStartAt: Date,
        salesEndAt: Date,
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
