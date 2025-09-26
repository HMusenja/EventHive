import axios from "@/services/axiosConfig";

// helpers
const enc = (v) => encodeURIComponent(String(v ?? "").trim());
const errMsg = (e, fb) => e?.response?.data?.message || e?.message || fb;

// ————————————————————————————————
// Reads
// ————————————————————————————————

export async function getMyOrganizing() {
  try {
    const { data } = await axios.get("/events/me/organizing");
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to fetch my organizing events"));
  }
}

export async function getEvent(idOrSlug) {
  try {
    const { data } = await axios.get(`/events/${enc(idOrSlug)}`);
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to fetch event"));
  }
}

export async function getAllEvents(params = {}) {
  try {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    const { data } = await axios.get("/events", { params: clean });
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to fetch events"));
  }
}

// ————————————————————————————————
// Updates
// ————————————————————————————————

export async function updateOrganizerProfile(eventId, profile) {
  try {
    const { data } = await axios.put(`/events/${enc(eventId)}/organizer-profile`, profile);
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to update organizer profile"));
  }
}

export async function updateEvent(id, payload) {
  try {
    const { data } = await axios.patch(`/events/${enc(id)}`, payload);
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to update event"));
  }
}

// ————————————————————————————————
// Creates / Deletes / Utils
// ————————————————————————————————

export async function createEvent(payload) {
  try {
    const { data } = await axios.post("/events", payload);
    return data;
  } catch (e) {
    if (e?.response?.status === 409) {
      throw new Error("Slug already in use. Try a different one (e.g. add -2025 or -hamburg).");
    }
    throw new Error(errMsg(e, "Failed to create event"));
  }
}

export async function isSlugAvailable(slug) {
  if (!slug) return false;
  try {
    const res = await axios.get(`/events/${enc(slug)}`, {
      validateStatus: () => true, // don't throw; we inspect status below
    });
    if (res.status === 404) return true;
    if (res.status === 200) return false;
    return false;
  } catch {
    return false;
  }
}

export async function deleteEventById(eventId) {
  try {
    const { data } = await axios.delete(`/events/${enc(eventId)}`);
    return data;
  } catch (e) {
    throw new Error(errMsg(e, "Failed to delete event"));
  }
}
