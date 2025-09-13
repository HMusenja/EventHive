import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event" },
},
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
