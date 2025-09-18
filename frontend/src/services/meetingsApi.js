// frontend/src/services/meetingsApi.js
// Tries the real API first. If it fails (no backend, network error, 5xx),
// it falls back to mock data so the UI still works.

import api from "./axiosConfig";

// --- Mock data (kept minimal but realistic) ---
const MOCK_MEETINGS = [
    {
        _id: "m1",
        startAt: "2025-09-18T15:00:00.000Z",
        endAt: "2025-09-18T17:00:00.000Z",
        status: "pending",
        location: "HubMeet Berlin, 2nd Floor",
        place: "MeetUp – Talk Talk Talk",
        message: "Face the future trends."
    },
    {
        _id: "m2",
        startAt: "2025-09-20T09:00:00.000Z",
        endAt: "2025-09-20T10:00:00.000Z",
        status: "accepted",
        location: "Zoom",
        place: "Product Strategy Discussion"
    }
];

let USING_MOCK = false;
export const isUsingMeetingsMock = () => USING_MOCK;

// Utility: drop undefined/empty params so we don't send eventId=undefined
function cleanParams(params = {}) {
    const out = {};
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") out[k] = v;
    });
    return out;
}

export async function listMeetings(params = {}) {
    try {
        const { data } = await api.get("/meetings", { params: cleanParams(params) });
        USING_MOCK = false;
        return data; // { meetings: [...] }
    } catch (err) {
        console.warn("[meetingsApi] listMeetings failed, using mock:", err?.message || err);
        USING_MOCK = true;
        return { meetings: MOCK_MEETINGS };
    }
}

export async function createMeeting(payload) {
    try {
        const { data } = await api.post("/meetings", payload);
        USING_MOCK = false;
        return data;
    } catch (err) {
        console.warn("[meetingsApi] createMeeting failed (mock only updates client state):", err?.message || err);
        USING_MOCK = true;
        // Simulate a created meeting locally so UI can proceed
        return {
            meeting: {
                _id: `mock-${Date.now()}`,
                ...payload,
                status: "pending",
            }
        };
    }
}

export async function updateMeetingStatus(id, status) {
    try {
        const { data } = await api.patch(`/meetings/${id}/status`, { status });
        USING_MOCK = false;
        return data;
    } catch (err) {
        console.warn("[meetingsApi] updateMeetingStatus failed, assuming success in mock:", err?.message || err);
        USING_MOCK = true;
        // Pretend success so optimistic UI doesn't roll back
        return { ok: true };
    }
}
