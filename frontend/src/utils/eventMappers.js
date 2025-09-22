// src/utils/eventMappers.js
import { toUtcIso, normalizeTz } from "@/utils/datetime";

/** Keep only [a-z0-9-], collapse dashes, trim ends */
export function sanitizeSlug(slug = "") {
  return String(slug)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Trim strings; drop empty strings/null/undefined; recurse objects/arrays. */
export function removeEmptyDeep(value) {
  if (Array.isArray(value)) {
    const arr = value
      .map(removeEmptyDeep)
      .filter((v) =>
        v == null
          ? false
          : typeof v === "object"
            ? Object.keys(v).length > 0
            : String(v).length > 0
      );
    return arr;
  }
  if (value && typeof value === "object") {
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      const cleaned = removeEmptyDeep(v);
      const keep =
        cleaned == null
          ? false
          : typeof cleaned === "object"
            ? Array.isArray(cleaned)
              ? cleaned.length > 0
              : Object.keys(cleaned).length > 0
            : String(cleaned).length > 0;
      if (keep) out[k] = cleaned;
    });
    return out;
  }
  if (typeof value === "string") return value.trim();
  return value;
}

/** Parse "123.45" → 123.45, else undefined */
function toNumOrUndef(v) {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Split "a, b ,c" → ["a","b","c"] */
export function splitCsv(value = "") {
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Convert the CreateEventModal formData → backend Event payload.
 * NOTE: Step 5 will improve date handling with Luxon & timezone. For now we treat
 * datetime-local as local time and serialize with new Date(...).toISOString().
 */
export function mapFormToEventPayload(formData) {
  const tz = normalizeTz(formData?.timezone);

  // ✅ timezone-aware conversion
  const startAt = toUtcIso(formData?.startDateTime, tz);
  const endAt   = toUtcIso(formData?.endDateTime, tz);

  const venue = {
    name: formData.venueName,
    address: formData.venueAddress,
    city: formData.venueCity,
    country: formData.venueCountry,
    lat: toNumOrUndef(formData.venueLatitude),
    lng: toNumOrUndef(formData.venueLongitude),
    mapEmbedUrl: formData.mapEmbedUrl,
  };

  const organizerProfile = {
    name: formData.organizerName,
    website: formData.organizerWebsite || formData.organizerWebsiteUrl,
    bio: formData.organizerBio,
    avatarUrl: formData.organizerAvatar,
    socials: removeEmptyDeep({
      twitter: formData.organizerTwitter,
      linkedin: formData.organizerLinkedIn,
      github: formData.organizerGitHub,
      website: formData.organizerWebsite || formData.organizerWebsiteUrl,
    }),
  };

  const speakersPayload = (formData.speakers || [])
    .map((s) => removeEmptyDeep({
      name: s.name,
      title: s.title,
      company: s.company,
      bio: s.bio,
      avatarUrl: s.avatarUrl,
      socials: removeEmptyDeep({
        twitter: s.twitter,
        linkedin: s.linkedin,
        github: s.github,
        website: s.website,
      }),
    }))
    .filter((s) => s?.name);

  const agendaPayload = (formData.agenda || [])
    .map((session) => removeEmptyDeep({
      title: session.title,
      description: session.description,
      startAt: toUtcIso(session.startDateTime, tz),
      endAt: toUtcIso(session.endDateTime, tz),
      room: session.room,
      track: session.track,
      speakerNames: splitCsv(session.speakerNames),
    }))
    .filter((s) => s?.title && s?.startAt && s?.endAt);

  const payload = removeEmptyDeep({
    slug: sanitizeSlug(formData.slug || formData.title || ""),
    title: formData.title,
    subtitle: formData.subtitle,
    description: formData.description,
    coverImage: formData.coverImage,
    onboardingEnabled: Boolean(formData.onboardingEnabled),
    startAt,
    endAt,
    timezone: tz,
    venue,
    organizerProfile,
    visibility: formData.visibility || "public",
    capacity: Number.isFinite(Number(formData.capacity)) ? Number(formData.capacity) : 0,
    speakers: speakersPayload,
    agenda: agendaPayload,
  });

  return payload;
}
