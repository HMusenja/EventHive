import axios from "@/services/axiosConfig";

export async function applyToEvent(eventId) {
  const { data } = await axios.post(`/events/${eventId}/apply`);
  // server returns { member } or { member, message: "Already applied or a member" }
  return data;
}
