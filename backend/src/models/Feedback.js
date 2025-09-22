import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional if logged in
    name: { type: String, trim: true },  // fallback if not logged in
    role: { type: String, trim: true },
    content: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);
