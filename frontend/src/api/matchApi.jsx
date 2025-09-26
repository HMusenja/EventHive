import api from "@/services/axiosConfig";

// Utility to clean empty/null/undefined query params
const clean = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""));

/**
 * ✅ Get global matches based on user interests
 * GET /api/matches?interests=design,tech&limit=20
 */
export async function fetchGlobalMatches({ interests = "", limit = 20 } = {}) {
  try {
    const { data } = await api.get("/matches", {
      params: clean({ interests, limit }),
    });
    return Array.isArray(data?.matches) ? data.matches : [];
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) {
      console.warn("[fetchGlobalMatches] Not authenticated.");
      return [];
    }
    throw err;
  }
}

/**
 * ✅ Get match suggestions for a specific event
 * GET /api/events/:eventId/match/suggestions?limit=20
 */
export async function getMatchSuggestions(eventId, { limit = 20 } = {}) {
  if (!eventId) throw new Error("eventId is required");

  const { data } = await api.get(`/events/${eventId}/match/suggestions`, {
    params: { limit },
  });

  return Array.isArray(data?.suggestions) ? data.suggestions : [];
}

// Export both functions (default + named)
export default {
  fetchGlobalMatches,
  getMatchSuggestions,
};
