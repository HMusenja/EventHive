// src/api/organizerApi.js
import axios from "axios";

// Helper to surface friendly errors
function errMsg(e, fallback = "Request failed") {
  return e?.response?.data?.message || e?.message || fallback;
}

// Fetch events the current user organizes
export async function getMyOrganizing() {
  try {
    const { data } = await axios.get("/api/events/me/organizing", {
      withCredentials: true, // ← ensure cookie/JWT is sent
    });
    return data;
  } catch (e) {
    const msg = errMsg(e, "Failed to fetch my organizing events");
    console.error("[getMyOrganizing] error →", msg);
    throw new Error(msg);
  }
}

export async function getEvent(idOrSlug) {
  try {
    const { data } = await axios.get(`/api/events/${idOrSlug}`);
    return data;
  } catch (e) {
    const msg = errMsg(e, "Failed to fetch event");
    console.error("[getEvent] error →", msg);
    throw new Error(msg);
  }
}

export async function getAllEvents() {
  try {
    const { data } = await axios.get("/api/events");
    return data;
  } catch (e) {
    const msg = errMsg(e, "Failed to fetch events");
    console.error("[getAllEvents] error →", msg);
    throw new Error(msg);
  }
}

export async function updateOrganizerProfile(eventId, profile) {
  try {
    const { data } = await axios.put(
      `/api/events/${eventId}/organizer-profile`,
      profile,
      { withCredentials: true }
    );
    return data;
  } catch (e) {
    const msg = errMsg(e, "Failed to update organizer profile");
    throw new Error(msg);
  }
}

// Update event
export async function updateEvent(id, payload) {
  const { data } = await axios.patch(`/api/events/${id}`, payload, {
    withCredentials: true,
  });
  return data; // updated event doc
}

// ★ NEW: Create event
export async function createEvent(payload) {
  try {
    const { data } = await axios.post("/api/events", payload, {
      withCredentials: true,
    });
    return data; // newly created event
  } catch (e) {
    if (e?.response?.status === 409) {
      throw new Error("Slug already in use. Try a different one (e.g., add -2025 or -hamburg).");
    }
    throw new Error(errMsg(e, "Failed to create event"));
  }
}

// slug Availability 
export async function isSlugAvailable(slug) {
  if (!slug) return false; // empty slug isn’t valid/available
  try {
    await axios.get(`/api/events/${slug}`, { withCredentials: true });
    return false; // 200 → exists → taken
  } catch (e) {
    if (e?.response?.status === 404) return true; // 404 → not found → available
    // network or 5xx → treat as unknown, not available to be safe
    return false;
  }
}

 //Delete Event by id
export async function deleteEventById(eventId) {
  const { data } = await axios.delete(`/api/events/${eventId}`, {
    withCredentials: true, 
  });
  return data;
}