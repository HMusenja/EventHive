import axios from "axios";

// ----- Axios instance -----
const BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "")) ||
  "http://localhost:5000";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,            // send cookies for auth-backed routes
  timeout: 15000,
  headers: { Accept: "application/json" },
});

// Attach Authorization header if you use Bearer tokens (kept optional)
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && !config.headers?.Authorization) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

// ----- Utils -----
const clean = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

const toCommaParam = (v) =>
  Array.isArray(v) ? v.filter(Boolean).join(",") : String(v || "");

const clamp = (n, min, max) => Math.min(Math.max(parseInt(n, 10) || 0, min), max);

const isAuthStatus = (s) => s === 401 || s === 403;

// ----- API calls -----

/**
 * Get global matches based on user interests
 * GET /api/matches?interests=design,tech&limit=20
 */
export async function fetchGlobalMatches({ interests = "", limit = 20 } = {}) {
  const params = clean({
    interests: toCommaParam(interests),
    limit: clamp(limit, 1, 100),
  });

  try {
    const { data } = await api.get("/matches", { params });
    return Array.isArray(data?.matches) ? data.matches : [];
  } catch (err) {
    const status = err?.response?.status ?? 0;

    if (isAuthStatus(status)) {
      console.warn("[fetchGlobalMatches] Not authenticated/authorized.");
      return [];
    }

    // Network / CORS / server down
    if (!status) {
      console.error("[fetchGlobalMatches] Network/CORS error:", err?.message);
      return [];
    }

    // Bubble up unexpected 4xx/5xx with server message (if any)
    const serverMsg = err?.response?.data?.error?.message || err?.message;
    throw new Error(`[fetchGlobalMatches] ${status}: ${serverMsg}`);
  }
}

/**
 * Get match suggestions for a specific event
 * GET /api/events/:eventId/match/suggestions?limit=20
 */
export async function getMatchSuggestions(eventId, { limit = 20 } = {}) {
  if (!eventId) throw new Error("eventId is required");

  const params = { limit: clamp(limit, 1, 50) };

  try {
    const { data } = await api.get(`/events/${eventId}/match/suggestions`, {
      params,
    });
    return Array.isArray(data?.suggestions) ? data.suggestions : [];
  } catch (err) {
    const status = err?.response?.status ?? 0;

    if (isAuthStatus(status)) {
      console.warn("[getMatchSuggestions] Not authenticated/authorized.");
      return [];
    }

    if (!status) {
      console.error("[getMatchSuggestions] Network/CORS error:", err?.message);
      return [];
    }

    const serverMsg = err?.response?.data?.error?.message || err?.message;
    throw new Error(`[getMatchSuggestions] ${status}: ${serverMsg}`);
  }
}

export default {
  fetchGlobalMatches,
  getMatchSuggestions,
};
