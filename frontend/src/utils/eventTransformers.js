// src/utils/eventTransformers.js
import { DateTime } from "luxon";

export function normalizeEventData(formData) {
  return {
    ...formData,
    slug: formData.slug
      ? formData.slug.trim().toLowerCase().replace(/\s+/g, "-")
      : "",

    capacity: formData.capacity ? Number(formData.capacity) : 0,

    startDateTime: formData.startAt
      ? new Date(formData.startAt).toISOString()
      : formData.startDateTime || "",
    endDateTime: formData.endAt
      ? new Date(formData.endAt).toISOString()
      : formData.endDateTime || "",

    venueLatitude: formData.venue?.lat ?? formData.venueLatitude ?? "",
    venueLongitude: formData.venue?.lng ?? formData.venueLongitude ?? "",
    venueName: formData.venue?.name ?? formData.venueName ?? "",
    venueAddress: formData.venue?.address ?? formData.venueAddress ?? "",
    venueCity: formData.venue?.city ?? formData.venueCity ?? "",
    venueCountry: formData.venue?.country ?? formData.venueCountry ?? "",
    mapEmbedUrl: formData.venue?.mapEmbedUrl ?? formData.mapEmbedUrl ?? "",

    organizerName: formData.organizerProfile?.name ?? formData.organizerName ?? "",
    organizerWebsite: formData.organizerProfile?.website ?? formData.organizerWebsite ?? "",
    organizerBio: formData.organizerProfile?.bio ?? formData.organizerBio ?? "",
    organizerAvatar: formData.organizerProfile?.avatarUrl ?? formData.organizerAvatar ?? "",
    organizerTwitter: formData.organizerProfile?.socials?.twitter ?? formData.organizerTwitter ?? "",
    organizerLinkedIn: formData.organizerProfile?.socials?.linkedin ?? formData.organizerLinkedIn ?? "",
    organizerGitHub: formData.organizerProfile?.socials?.github ?? formData.organizerGitHub ?? "",
    organizerWebsiteUrl: formData.organizerProfile?.socials?.website ?? formData.organizerWebsiteUrl ?? "",

    agenda: Array.isArray(formData.agenda)
      ? formData.agenda.map((s) => ({
          title: s.title ?? "",
          description: s.description ?? "",
          startDateTime: s.startAt
            ? new Date(s.startAt).toISOString()
            : s.startDateTime ?? "",
          endDateTime: s.endAt
            ? new Date(s.endAt).toISOString()
            : s.endDateTime ?? "",
          room: s.room ?? "",
          track: s.track ?? "",
          speakerNames: Array.isArray(s.speakerNames)
            ? s.speakerNames.join(", ")
            : s.speakerNames ?? "",
        }))
      : [],

    speakers: formData.speakers || [],
  };
}

/**
 * Convert Zod-validated data back into backend-ready object
 * (dates as Date, speakerNames as string[])
 */
export function denormalizeEventData(zodData) {
  return {
    ...zodData,

    // rename + cast dates
    startAt: zodData.startDateTime
      ? DateTime.fromISO(zodData.startDateTime).toJSDate()
      : undefined,
    endAt: zodData.endDateTime
      ? DateTime.fromISO(zodData.endDateTime).toJSDate()
      : undefined,

    // venue → backend subdocument
    venue: {
      name: zodData.venueName || "",
      address: zodData.venueAddress || "",
      city: zodData.venueCity || "",
      country: zodData.venueCountry || "",
      lat: zodData.venueLatitude
        ? Number(zodData.venueLatitude)
        : undefined,
      lng: zodData.venueLongitude
        ? Number(zodData.venueLongitude)
        : undefined,
      mapEmbedUrl: zodData.mapEmbedUrl || "",
    },

    // organizer → backend subdocument
    organizerProfile: {
      name: zodData.organizerName,
      website: zodData.organizerWebsite || "",
      bio: zodData.organizerBio || "",
      avatarUrl: zodData.organizerAvatar || "",
      socials: {
        twitter: zodData.organizerTwitter || "",
        linkedin: zodData.organizerLinkedIn || "",
        github: zodData.organizerGitHub || "",
        website: zodData.organizerWebsiteUrl || "",
      },
    },

    // agenda → backend sessions
    agenda: Array.isArray(zodData.agenda)
      ? zodData.agenda.map((s) => ({
          title: s.title,
          description: s.description || "",
          startAt: s.startDateTime
            ? DateTime.fromISO(s.startDateTime).toJSDate()
            : undefined,
          endAt: s.endDateTime
            ? DateTime.fromISO(s.endDateTime).toJSDate()
            : undefined,
          room: s.room || "",
          track: s.track || "",
          // ✅ split CSV into array
          speakerNames: s.speakerNames
            ? s.speakerNames.split(",").map((n) => n.trim()).filter(Boolean)
            : [],
        }))
      : [],

    // drop frontend-only fields
    startDateTime: undefined,
    endDateTime: undefined,
    venueName: undefined,
    venueAddress: undefined,
    venueCity: undefined,
    venueCountry: undefined,
    venueLatitude: undefined,
    venueLongitude: undefined,
    organizerName: undefined,
    organizerWebsite: undefined,
    organizerBio: undefined,
    organizerAvatar: undefined,
    organizerTwitter: undefined,
    organizerLinkedIn: undefined,
    organizerGitHub: undefined,
    organizerWebsiteUrl: undefined,
  };
}
