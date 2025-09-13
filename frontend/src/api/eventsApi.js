import axios from "axios";

const BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5050").replace(/\/+$/, "");
const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

export async function getEvent(idOrSlug) {
  // optional debug
  // console.log("[getEvent] URL →", `${api.defaults.baseURL}/events/${idOrSlug}`);
  const { data } = await api.get(`events/${idOrSlug}`);
  return data;
}

export async function getAllEvents() {
  const { data } = await api.get("events");
  return data;
}
