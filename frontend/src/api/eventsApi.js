// src/api/organizerApi.js
import axios from "axios";


// Fetch events the current user organizes
export async function getMyOrganizing() {
  try {

    const { data } = await axios.get("/api/events/me/organizing");
   
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

    const { data } = await axios.get(`/api/events/${idOrSlug}`);
 
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
 
    const { data } = await axios.get("/api/events");
   
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
   
    const { data } = await axios.put(`/api/events/${eventId}/organizer-profile`, profile);
 
    return data;
  } catch (e) {
    const msg =
      e?.response?.data?.message || e.message || "Failed to update organizer profile";
  
    throw new Error(msg);
  }

}
