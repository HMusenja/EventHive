import axios from "axios";

/* Axios defaults */
const api = axios.create({ withCredentials: true });

/* Helpers */
const is404 = (e) => e?.response?.status === 404;
const clean = (o = {}) =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));

/** Try a list of endpoint paths with the same request */
async function tryPaths({ method, paths, data, params }) {
    let lastErr;
    for (const path of paths) {
        try {
            const res = await api.request({ method, url: path, data, params });
            return res.data;
        } catch (e) {
            lastErr = e;
            if (!is404(e)) throw e; // non-404 -> fail fast
            // else try next path
        }
    }
    throw lastErr;
}

/** POST /meetings  */
export async function createMeeting(payload = {}) {
    const body = { ...payload };
    if (!body.eventId) delete body.eventId;

    return tryPaths({
        method: "post",
        paths: ["/api/meetings", "/meetings"],
        data: body,
    });
}

/** GET /meetings */
export async function listMeetings(params = {}) {
    return tryPaths({
        method: "get",
        paths: ["/api/meetings", "/meetings"],
        params,
    });
}

/** PATCH /meetings/:id/status */
export async function updateMeetingStatus(id, status, note) {
    const body = note ? { status, note } : { status };
    return tryPaths({
        method: "patch",
        paths: [`/api/meetings/${id}/status`, `/meetings/${id}/status`],
        data: body,
    });
}

/** Send a meeting note (supports both POST /notes and PATCH /note) */
export async function sendMeetingNote(id, text) {
    const data = { text };
    const dataPatch = { note: text };

    // Try API prefix variants first, then non-prefixed.
    try {
        return await api.post(`/api/meetings/${id}/notes`, data);
    } catch (e) {
        if (!is404(e)) {
            // maybe server uses PATCH /note
            const { data: out } = await api.patch(`/api/meetings/${id}/note`, dataPatch);
            return out;
        }
    }
    try {
        const { data: out } = await api.post(`/meetings/${id}/notes`, data);
        return out;
    } catch (e) {
        if (!is404(e)) throw e;
        const { data: out } = await api.patch(`/meetings/${id}/note`, dataPatch);
        return out;
    }
}

/** GET attendees for an event */
export async function fetchEventAttendees(eventId, params = {}) {
    if (!eventId) throw new Error("fetchEventAttendees: eventId is required");
    return tryPaths({
        method: "get",
        paths: [`/api/events/${eventId}/attendees`, `/events/${eventId}/attendees`],
        params,
    });
}

/** Fallback list of people when there's no event context */
export async function fetchGlobalPeople({ limit = 100 } = {}) {
    const tries = [
        ["/api/users", { limit }],
        ["/users", { limit }],
        ["/api/users/matches", { limit }],
        ["/users/matches", { limit }],
        ["/api/matches", { limit }], // extra: our global matches endpoint
    ];

    for (const [path, params] of tries) {
        try {
            const { data } = await api.get(path, { params });
            if (Array.isArray(data?.users)) return data.users;
            if (Array.isArray(data?.matches)) return data.matches;
            if (Array.isArray(data)) return data;
        } catch (e) {
            if (!is404(e)) throw e;
        }
    }
    return [];
}

/** Simple counter for already-sent meeting requests to a specific user (optional event scope) */
export async function countSentRequests({ inviteeId, eventId } = {}) {
    if (!inviteeId) return 0;
    const data = await listMeetings(
        clean({
            role: "requester",     // I sent it
            status: "requested",   // still pending
            inviteeId,
            eventId,
            page: 1,
            limit: 1,              // we only need the total
        })
    );

    // Support a few common response shapes
    return (
        data?.meta?.total ??
        data?.pagination?.total ??
        (Array.isArray(data?.meetings) ? data.meetings.length : 0)
    );
}

export default {
    createMeeting,
    listMeetings,
    updateMeetingStatus,
    sendMeetingNote,
    fetchEventAttendees,
    fetchGlobalPeople,
    countSentRequests,
};
