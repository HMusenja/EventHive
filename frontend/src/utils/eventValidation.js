// src/utils/eventValidation.js
import { z } from "zod";
import { DateTime } from "luxon";

const nonEmpty = z.string().trim().min(1, "Required");

export const speakerSchema = z.object({
  name: nonEmpty,
  title: z.string().trim().optional(),
  company: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  // socials optional later
});

export const sessionSchema = z.object({
  title: nonEmpty,
  description: z.string().trim().optional(),
  startDateTime: nonEmpty, // validated cross-field with timezone below
  endDateTime: nonEmpty,
  room: z.string().trim().optional(),
  track: z.string().trim().optional(),
  speakerNames: z.string().trim().optional(), // CSV, mapped later
});

export const createEventFormSchema = z.object({
  // Basics
  coverImage: z.string().url("Invalid URL").optional().or(z.literal("")),
  title: nonEmpty,
  subtitle: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and dashes only")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().optional(),
  visibility: z.enum(["public", "private"]),
  onboardingEnabled: z.boolean(),
  capacity: z
    .number({ invalid_type_error: "Capacity must be a number" })
    .int("Capacity must be an integer")
    .min(0, "Capacity cannot be negative"),

  // Schedule
  startDateTime: nonEmpty,
  endDateTime: nonEmpty,
  timezone: z.string().trim().min(1, "Required"),

  // Venue
  venueName: z.string().trim().optional(),
  venueAddress: z.string().trim().optional(),
  venueCity: z.string().trim().optional(),
  venueCountry: z.string().trim().optional(),
  venueLatitude: z.union([z.string(), z.number()]).optional(),
  venueLongitude: z.union([z.string(), z.number()]).optional(),
  mapEmbedUrl: z.string().url("Invalid URL").optional().or(z.literal("")),

  // Organizer
  organizerName: nonEmpty,
  organizerWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  organizerBio: z.string().trim().optional(),
  organizerAvatar: z.string().url("Invalid URL").optional().or(z.literal("")),
  organizerTwitter: z.string().trim().optional(),
  organizerLinkedIn: z.string().trim().optional(),
  organizerGitHub: z.string().trim().optional(),
  organizerWebsiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),

  // Collections
  speakers: z.array(speakerSchema).optional(),
  agenda: z.array(sessionSchema).optional(),
})
.superRefine((vals, ctx) => {
  const tz = vals.timezone || "Europe/Berlin";
  const start = DateTime.fromISO(vals.startDateTime, { zone: tz });
  const end   = DateTime.fromISO(vals.endDateTime,   { zone: tz });
  if (!start.isValid) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid start date/time", path: ["startDateTime"] });
  }
  if (!end.isValid) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid end date/time", path: ["endDateTime"] });
  }
  if (start.isValid && end.isValid && end <= start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End must be after start", path: ["endDateTime"] });
  }

  // Agenda session time checks (if any)
  (vals.agenda || []).forEach((s, idx) => {
    const sStart = DateTime.fromISO(s.startDateTime, { zone: tz });
    const sEnd   = DateTime.fromISO(s.endDateTime,   { zone: tz });
    if (!sStart.isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid session start", path: ["agenda", idx, "startDateTime"] });
    }
    if (!sEnd.isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid session end", path: ["agenda", idx, "endDateTime"] });
    }
    if (sStart.isValid && sEnd.isValid && sEnd <= sStart) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Session end must be after start", path: ["agenda", idx, "endDateTime"] });
    }
  });
});
