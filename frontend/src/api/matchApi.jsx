import axios from "axios";

/**
 * GET /api/events/:eventId/match/suggestions
 * @param {string} eventId - Mongo ObjectId for the event
 * @param {{ limit?: number }} opts
 * @returns {Promise<Array>} suggestions
 *
 * Expected item shape:
 * {
 *   memberId: string,
 *   user: { fullName: string, avatar?: string },
 *   profile: { bio?: string, interests?: string[] }
 * }
 */
/**
 * GET /api/events/:eventId/match/suggestions
 */
export async function getMatchSuggestions(eventId, { limit = 20 } = {}) {
  if (!eventId) throw new Error("getMatchSuggestions: eventId is required");

  const { data } = await axios.get(`/api/events/${eventId}/match/suggestions`, {
    params: { limit },
  });

  return Array.isArray(data) ? data : data?.items || [];
}