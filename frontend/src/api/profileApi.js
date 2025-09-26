// src/api/profileApi.js
import axios from "axios";

export async function getMySummary() {
  const { data } = await axios.get("/api/users/me/summary", { withCredentials: true });
  return data; // { profile, memberships, nextOrganizing, hasAnyEventRole, isOrganizer }
}

export async function getMyProfile() {
  const { data } = await axios.get("/api/users/me/profile", { withCredentials: true });
  return data.profile;
}

export async function updateMyProfile(payload) {
  const { data } = await axios.put("/api/users/me/profile", payload, { withCredentials: true });
  return data.profile;
}
