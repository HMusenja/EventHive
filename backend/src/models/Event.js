// backend/src/models/Event.js
import { Schema, model,Types } from "mongoose";

const SpeakerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  title: { type: String, trim: true },
  company: { type: String, trim: true },
  bio: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  socials: {
    twitter: String, linkedin: String, github: String, website: String,
  },
}, { _id: false });

const SessionSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  room: { type: String, default: "" },
  track: { type: String, default: "" },
  speakerNames: [{ type: String }], // simple link for today; matches speakers[].name
}, { _id: false });

const VenueSchema = new Schema({
  name: String,
  address: String,
  city: String,
  country: String,
  lat: Number,
  lng: Number,
  mapEmbedUrl: String, // optional prebuilt embed URL fallback
}, { _id: false });

const EventSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    onboardingEnabled: { type: Boolean, default: true },

    startAt: { type: Date, required: true },
    endAt:   { type: Date, required: true },
    timezone: { type: String, default: "Europe/Berlin" },

    venue: VenueSchema,
    speakers: [SpeakerSchema],
    agenda: [SessionSchema],

    // 🔹 NEW: ownership & discovery
    ownerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    orgId:   { type: Types.ObjectId, ref: "Organization" }, // optional
    visibility: { type: String, enum: ["public", "private"], default: "public" },

    // (optional) simple capacity guard for free tickets or overall cap
    capacity: { type: Number, default: 0, min: 0 }, // 0 = unlimited
  },
  { timestamps: true }
);

export default model("Event", EventSchema);