import axios from "@/services/axiosConfig"; // uses baseURL: "/api" and withCredentials

/** ---------- /me memo cache (60s by default) ---------- */
const meCache = new Map(); // key: eventId, value: { data, expiresAt }

export function invalidateMyEventMemberCache(eventId) {
  if (!eventId) return;
  meCache.delete(String(eventId));
}

export async function getMyEventMember(eventId) {
  if (!eventId) return null;
  try {
    const { data } = await axios.get(`events/${eventId}/me`);
    if (data && data.isMember === false) return null;
    return data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 404) return null;
    throw err;
  }
}

/**
 * Cached version of GET /events/:eventId/me
 * Returns cached data if fresh; otherwise fetches and stores with TTL.
 */
export async function getMyEventMemberCached(eventId, { ttlMs = 60_000 } = {}) {
  const key = String(eventId || "");
  if (!key) return null;

  const now = Date.now();
  const cached = meCache.get(key);
  if (cached && cached.expiresAt > now) return cached.data;

  const fresh = await getMyEventMember(eventId); // may be null
  meCache.set(key, { data: fresh, expiresAt: now + ttlMs });
  return fresh;
}

// Profile update for the current user within an event
export async function updateMyEventProfile(eventId, payload) {
  if (!eventId) throw new Error("eventId is required");
  const { data } = await axios.put(`events/${eventId}/attendee/profile`, payload);
  return data;
}

// Tag suggestions
export async function suggestTags(eventId, q) {
  try {
    const { data } = await axios.get(`tags/suggest`, { params: { eventId, q } });
    return data?.tags || [];
  } catch {
    return [];
  }
}

// Alias to updateMyEventProfile
export async function putAttendeeProfile(eventId, payload) {
  return updateMyEventProfile(eventId, payload);
}
