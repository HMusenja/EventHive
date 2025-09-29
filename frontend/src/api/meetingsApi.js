import axios from "axios";

/* Helpers */
const is404 = (e) => e?.response?.status === 404;

/** POST /meetings  (tries /api first, then fallback) */
export async function createMeeting(payload = {}) {
    const body = { ...payload };
    if (!body.eventId) delete body.eventId;

    try {
        const { data } = await axios.post("/api/meetings", body);
        return data;
    } catch (e) {
        if (!is404(e)) throw e;
        const { data } = await axios.post("/api/meetings", body);
        return data;
    }
}

/** GET /meetings */
export async function listMeetings(params = {}, axiosConfig = {}) {
    try {
        const { data } = await axios.get("/api/meetings", { params, ...axiosConfig });
        return data;
    } catch (e) {
        if (!is404(e)) throw e;
        const { data } = await axios.get("/api/meetings", { params, ...axiosConfig });
        return data;
    }
}

/** PATCH /meetings/:id/status */
export async function updateMeetingStatus(id, status, note) {
    const body = note ? { status, note } : { status };
    try {
        const { data } = await axios.patch(`/api/meetings/${id}/status`, body);
        return data;
    } catch (e) {
        if (!is404(e)) throw e;
        const { data } = await axios.patch(`/api/meetings/${id}/status`, body);
        return data;
    }
}

/**
 * Send a meeting note: tries several endpoints and methods
 */
export async function sendMeetingNote(id, text) {
    try {
        const { data } = await axios.post(`/api/meetings/${id}/notes`, { text });
        return data;
    } catch (e1) {
        if (!is404(e1)) {
            try {
                const { data } = await axios.patch(`/api/meetings/${id}/note`, { note: text });
                return data;
            } catch (e2) {
                throw e2;
            }
        }

        try {
            const { data } = await axios.post(`/api/meetings/${id}/notes`, { text });
            return data;
        } catch (e3) {
            if (!is404(e3)) throw e3;
            const { data } = await axios.patch(`/api/meetings/${id}/note`, { note: text });
            return data;
        }
    }
}

/**
 * GET attendees for an event
 */
export async function fetchEventAttendees(eventId, params = {}) {
    if (!eventId) throw new Error("fetchEventAttendees: eventId is required");

    try {
        const { data } = await axios.get(`/api/events/${eventId}/attendees`, { params });
        return data;
    } catch (e) {
        if (!is404(e)) throw e;
        const { data } = await axios.get(`/api/events/${eventId}/attendees`, { params });
        return data;
    }
}

/**
 * Fallback list of people when there's no event context
 */
export async function fetchGlobalPeople({ limit = 100 } = {}) {
    const tryPaths = [
        ["/api/users", { limit }],
        ["/users", { limit }],
        ["/api/users/matches", { limit }],
        ["/users/matches", { limit }],
    ];

    for (const [path, params] of tryPaths) {
        try {
            const { data } = await axios.get(path, { params });
            if (Array.isArray(data?.users)) return data.users;
            if (Array.isArray(data)) return data;
        } catch (e) {
            if (!is404(e)) throw e;
        }
    }
    return [];
}
