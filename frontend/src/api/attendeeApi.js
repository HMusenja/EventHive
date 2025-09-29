import axios from "axios";

/**
 * Shape we expect back from the server:
 * { attendee: { _id, bio, location, avatar, interests, ... } }
 */
export async function getMyAttendee() {
  const { data } = await axios.get("/api/attendees/me");
  return data; // { attendee } or { attendee: null }
}

export async function createAttendee(payload) {
  const { data } = await axios.post("/api/attendees", payload);
  return data; // { attendee }
}

export async function updateAttendee(id, payload) {
  const { data } = await axios.patch(`/api/attendees/${id}`, payload);
  return data; // { attendee }
}

/**
 * Convenience: create if missing, otherwise update.
 * Backend option A (recommended): implement POST /api/attendees as upsert.
 * If your backend does NOT upsert, pass attendeeId to update.
 */
export async function upsertMyAttendee(payload, attendeeId = null) {
  if (attendeeId) {
    return updateAttendee(attendeeId, payload);
  }
  // If backend supports POST upsert, this works either way:
  return createAttendee(payload);
}

export async function getEventAttendeeCountById(eventId) {
  const { data } = await axios.get(`/api/events/${eventId}/attendees/count`);
  return data; // { eventId, memberCount, attendeeCount, checkedInCount }
}

// If you only know slug (and backend supports by=slug)
export async function getEventAttendeeCountBySlug(slug) {
  const { data } = await axios.get(`/api/events/${slug}/attendees/count`, {
    params: { by: "slug" },
  });
  return data;
}
