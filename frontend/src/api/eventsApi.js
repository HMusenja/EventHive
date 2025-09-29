// src/api/eventsApi.js
import axios from "axios";

const withCreds = { withCredentials: true };

const errMsg = (e, fallback = "Request failed") =>
  e?.response?.data?.message || e?.message || fallback;

export async function getMyOrganizing() {
  try {
    const { data } = await axios.get("/api/events/me/organizing", withCreds);
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to fetch my organizing events"));
  }
}

export async function getAllEvents() {
  try {
    const { data } = await axios.get("/api/events", withCreds);
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to fetch events"));
  }
}

export async function getEvent(idOrSlug) {
  try {
    const { data } = await axios.get(`/api/events/${idOrSlug}`, withCreds);
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to fetch event"));
  }
}

export async function updateEvent(id, payload) {
  const { data } = await axios.patch(`/api/events/${id}`, payload, {
    withCredentials: true,
  });
  return data; // the updated event
}

export async function createEvent(payload) {
  try {
    const { data } = await axios.post("/api/events", payload, withCreds);
    return data;
  } catch (e) {
    if (e?.response?.status === 409) {
      throw new Error("Slug already in use. Try a different one (e.g., add -2026 or -hamburg).");
    }
    throw new Error(errMsg(e, "Failed to create event"));
  }
}

export async function deleteEventById(eventId) {
  try {
    const { data } = await axios.delete(`/api/events/${eventId}`, withCreds);
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to delete event"));
  }
}

export async function isSlugAvailable(slug) {
  if (!slug) return false;
  try {
    await axios.get(`/api/events/${slug}`, withCreds);
    return false; // 200 → exists
  } catch (e) {
    if (e?.response?.status === 404) return true; // 404 → available
    return false;
  }
}

