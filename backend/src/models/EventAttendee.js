// backend/models/EventAttendee.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CheckInSchema = new Schema({
  time: Date,
  by: { type: Schema.Types.ObjectId, ref: "User" }, // staff/admin who scanned
}, { _id: false });

const EventAttendeeSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  eventId:  { type: Schema.Types.ObjectId, ref: "Event", required: true },
  status:   { type: String, enum: ["pending","approved","waitlisted","rejected","cancelled","checked-in"], default: "pending" },
  // optional event-scoped fields:
  interests: { type: [String], default: [] },       // can be copied from profile or event-specific
  answers:   { type: Schema.Types.Mixed, default: {} }, // onboarding Q&A for this event
  ticketType:{ type: String, trim: true },          // "free","standard","vip"...
  ticketId:  { type: Schema.Types.ObjectId, ref: "Ticket" },
  promoCode: { type: String, trim: true },
  qrCode:    { type: String, trim: true },          // pre-generated code for check-in
  checkIn:   { type: CheckInSchema, default: null },
}, { timestamps: true });

EventAttendeeSchema.index({ userId: 1, eventId: 1 }, { unique: true }); // one registration per event per user

EventAttendeeSchema.pre("save", function(next){
  if (this.interests?.length) this.interests = [...new Set(this.interests.map(s=>s.trim()))];
  next();
});

export default model("EventAttendee", EventAttendeeSchema);

