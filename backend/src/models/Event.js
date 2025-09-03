// backend/src/models/Event.js
import { Schema, model } from "mongoose";

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

const EventSchema = new Schema({
  slug: { type: String, unique: true, index: true, trim: true },
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "" },
  description: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  timezone: { type: String, default: "Europe/Berlin" },
  venue: VenueSchema,
  speakers: [SpeakerSchema],
  agenda: [SessionSchema],
}, { timestamps: true });

export default model("Event", EventSchema);
