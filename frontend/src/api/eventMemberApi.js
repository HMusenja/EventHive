// src/api/eventMemberApi.js
import axios from "axios";

export async function applyToEvent(eventId) {
  const { data } = await axios.post(`/api/events/${eventId}/apply`);
  // server returns { member } or { member, message: "Already applied or a member" }
  return data;
}