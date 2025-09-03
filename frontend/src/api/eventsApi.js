// src/api/eventsApi.js
import axios from "axios";
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export async function getEvent(idOrSlug) {
  try {
    const url = `${BASE}/events/${idOrSlug}`;
    console.log("[getEvent] URL →", url);
    const { data } = await axios.get(url);
    console.log("[getEvent] data →", data);
    return data;
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || "Request failed";
    console.error("[getEvent] error →", msg);
    throw new Error(msg);
  }
}

export async function getAllEvents() {
  try {
    const { data } = await axios.get(`${BASE}/events`);
    return data;
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || "Failed to fetch events";
    console.error("[getAllEvents] error:", msg);
    throw new Error(msg);
  }
}