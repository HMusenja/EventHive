// models/User.js
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
    reminders: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    reminderLeadMins: { type: Number, default: 60, min: 5, max: 1440 },
  },
  { _id: false }
);

const ConsentsSchema = new Schema(
  {
    termsAcceptedAt: { type: Date },
    privacyAcceptedAt: { type: Date },
    marketingEmails: { type: Boolean, default: false },
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
      sparse: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    // ✅ Guests do NOT need a password
    isGuest: { type: Boolean, default: false, index: true },
    password: {
      type: String,
      required: function () {
        return !this.isGuest;
      },
      select: false, // safer default; select('+password') when needed
    },

    role: {
      type: String,
      enum: ["attendee", "user", "organizer", "admin"],
      default: "user",
    },

    accountStatus: { type: String, enum: AccountStatusEnum, default: "active" },

    organizations: [
      {
        org: { type: ObjectId, ref: "Organization", required: true },
        role: { type: String, enum: ["owner", "manager", "staff"], default: "staff" },
      },
    ],

    // Graph
    savedEvents: [{ type: ObjectId, ref: "Event", index: true }],
    followingOrganizers: [{ type: ObjectId, ref: "Organization", index: true }],

    // Profile (global)
    avatar: { type: String, default: "" },
    bio: { type: String, maxlength: 600 },
    profileVisibility: { type: String, enum: VisibilityEnum, default: "public" },
    timezone: { type: String, default: "Europe/Berlin" },
    locale: { type: String, default: "en" },

    // Preferences & compliance
    notificationPrefs: { type: NotificationPrefsSchema, default: () => ({}) },
    consents: { type: ConsentsSchema, default: () => ({}) },

    // Payments
    stripeCustomerId: { type: String, index: true },

    // Audit
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Hash only if password present (non-guest or guest later sets a password)
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidatePassword, this.password);
};

export default model("User", UserSchema);

