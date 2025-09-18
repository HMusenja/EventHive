import api from "@/lib/axios";

export async function listMeetings(params = {}) {
  const { data } = await api.get("/meetings", { params });
  return data;
}

export async function createMeeting(payload) {
  const { data } = await api.post("/meetings", payload);
  return data;
}

export async function updateMeetingStatus(id, status) {
  const { data } = await api.patch(`/meetings/${id}/status`, { status });
  return data;
}

// Optional: availability fetch
export async function getAvailability(userId, from, to, slot = 30) {
  const { data } = await api.get("/availability", { params: { userId, from, to, slot } });
  return data;
}
