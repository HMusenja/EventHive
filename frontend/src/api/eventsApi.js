// src/api/organizerApi.js
import axios from "axios";


// Fetch events the current user organizes
export async function getMyOrganizing() {
  try {
    console.log("[getMyOrganizing] → calling /api/events/me/organizing");
    const { data } = await axios.get("/api/events/me/organizing");
    console.log("[getMyOrganizing] data →", data);
    return data;
  } catch (e) {
    const msg =
      e?.response?.data?.message || e.message || "Failed to fetch my organizing events";
    console.error("[getMyOrganizing] error →", msg);
    throw new Error(msg);
  }
}


// Example: fetch a single event (by id or slug)
export async function getEvent(idOrSlug) {

  try {
    console.log("[getEvent] → calling", `/api/events/${idOrSlug}`);
    const { data } = await axios.get(`/api/events/${idOrSlug}`);
    console.log("[getEvent] data →", data);
    return data;
  } catch (e) {
    const msg =
      e?.response?.data?.message || e.message || "Failed to fetch event";
    console.error("[getEvent] error →", msg);
    throw new Error(msg);
  }

}

// Example: fetch all events
export async function getAllEvents() {

  try {
    console.log("[getAllEvents] → calling /api/events");
    const { data } = await axios.get("/api/events");
    console.log("[getAllEvents] data →", data);
    return data;
  } catch (e) {
    const msg =
      e?.response?.data?.message || e.message || "Failed to fetch events";
    console.error("[getAllEvents] error →", msg);
    throw new Error(msg);
  }
}
export async function updateOrganizerProfile(eventId, profile) {
  try {
    console.log("[updateOrganizerProfile] → calling", `/api/events/${eventId}/organizer-profile`);
    const { data } = await axios.put(`/api/events/${eventId}/organizer-profile`, profile);
    console.log("[updateOrganizerProfile] data →", data);
    return data;
  } catch (e) {
    const msg =
      e?.response?.data?.message || e.message || "Failed to update organizer profile";
    console.error("[updateOrganizerProfile] error →", msg);
    throw new Error(msg);
  }

}
