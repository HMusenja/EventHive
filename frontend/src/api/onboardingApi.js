// src/api/onboardingApi.js
import axios from "axios";

/** ---------- /me memo cache (60s by default) ---------- */
const meCache = new Map(); // key: eventId, value: { data, expiresAt }

export function invalidateMyEventMemberCache(eventId) {
  if (!eventId) return;
  meCache.delete(String(eventId));
}

export async function getMyEventMember(eventId) {
  try {
    const { data } = await axios.get(`/api/events/${eventId}/me`);
    return data; // { eventMember, roles, status, defaults, profile }
  } catch (err) {
    const s = err?.response?.status;
    if (s === 404) return null;          
    throw err;                           
  }
}

/**
 * Cached version of GET /events/:eventId/me
 * Returns cached data if fresh; otherwise fetches and stores with TTL.
 */
export async function getMyEventMemberCached(eventId, { ttlMs = 60_000 } = {}) {
  const key = String(eventId);
  const now = Date.now();
  const cached = meCache.get(key);
  if (cached && cached.expiresAt > now) return cached.data;

  const fresh = await getMyEventMember(eventId); // may be null
  meCache.set(key, { data: fresh, expiresAt: now + ttlMs });
  return fresh;
}

export async function updateMyEventProfile(eventId, payload) {
  const { data } = await axios.put(`/api/events/${eventId}/attendee/profile`, payload);
  return data;
}
export async function suggestTags(eventId, q) {
  try {
    const { data } = await axios.get(`/api/tags/suggest`, { params: { eventId, q } });
    return data?.tags || [];
  } catch {
    return [];
  }
}

export async function putAttendeeProfile(eventId, payload) {
  const { data } = await axios.put(`/events/${eventId}/attendee/profile`, payload);
  return data;
}
