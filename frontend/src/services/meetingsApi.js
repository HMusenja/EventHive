import api from "./axiosConfig";

export const listMeetings = (params) =>
    api.get("/meetings", { params }).then(r => r.data);

export const createMeeting = (payload) =>
    api.post("/meetings", payload).then(r => r.data);

export const updateMeetingStatus = (id, status) =>
    api.patch(`/meetings/${id}/status`, { status }).then(r => r.data);
