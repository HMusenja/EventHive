import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
    {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

        requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who sent request
        inviteeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who receives

        // single slot (MVP). later you can support multiple slots/options.
        startAt: { type: Date, required: true },
        endAt: { type: Date, required: true },

        location: { type: String, enum: ["in-person", "online"], default: "in-person" },
        place: { type: String, default: "" },  // e.g., "Hall B, table 7" or meeting link

        status: { type: String, enum: ["pending", "accepted", "declined", "cancelled"], default: "pending" },

        // optional extras
        message: { type: String, default: "" },   // requester note
        notes: { type: String, default: "" },   // internal or shared note
    },
    { timestamps: true }
);

meetingSchema.index({ inviteeId: 1, startAt: 1, endAt: 1 });
meetingSchema.index({ requesterId: 1, startAt: 1, endAt: 1 });

export default mongoose.model("Meeting", meetingSchema);
