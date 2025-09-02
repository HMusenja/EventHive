import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
const { ObjectId } = Schema.Types;

const AccountStatusEnum = ["active", "suspended", "deleted"];
const VisibilityEnum = ["public", "private", "connections"];

const NotificationPrefsSchema = new Schema(
  {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    // event-specific toggles
    reminders: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    // default reminder lead time in minutes
    reminderLeadMins: { type: Number, default: 60, min: 5, max: 1440 },
  },
  { _id: false }
);

const ConsentsSchema = new Schema(
  {
    termsAcceptedAt: { type: Date },
    privacyAcceptedAt: { type: Date },
    marketingEmails: { type: Boolean, default: false }, // GDPR marketing consent
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allow nulls if you don't force usernames
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["attendee", "user", "organizer", "admin"],
      default: "user",
    },
    accountStatus: { type: String, enum: AccountStatusEnum, default: "active" },
    organizations: [
      {
        org: { type: ObjectId, ref: "Organization", required: true },
        role: {
          type: String,
          enum: ["owner", "manager", "staff"],
          default: "staff",
        },
      },
    ],
    // Event graph
    savedEvents: [{ type: ObjectId, ref: "Event", index: true }],
    followingOrganizers: [{ type: ObjectId, ref: "Organization", index: true }],
    interests: [{ type: String, trim: true, lowercase: true }], // e.g. ["tech", "music", "sports"]
    // Profile & preferences
    avatar: { type: String, default: "" }, // URL
    bio: { type: String, maxlength: 600 },
    profileVisibility: {
      type: String,
      enum: VisibilityEnum,
      default: "public",
    },
    timezone: { type: String, default: "Europe/Berlin" },
    locale: { type: String, default: "en" },
    notificationPrefs: { type: NotificationPrefsSchema, default: () => ({}) },
    consents: { type: ConsentsSchema, default: () => ({}) },
    // Payments (optional, if you’ll sell tickets)
    stripeCustomerId: { type: String, index: true },
    // Audit
    lastLoginAt: { type: Date },
  },

  { timestamps: true }
);

// 🔹 Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔑 Compare password (remember to select +password when querying)
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
export default model("User", UserSchema);
