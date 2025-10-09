// src/utils/profileMappers.js
export function toAvatarUrl(obj = {}) {
  return obj.avatar || obj.profilePicture || obj.avatarUrl || "";
}

export function toDisplayName(obj = {}) {
  return obj.fullName || obj.username || obj.email || "User";
}

/**
 * Normalize any profile-like object (self or public) into
 * the minimal shape your PublicProfile UI expects.
 */
function toTagArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    return v.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function normalizePublicProfile(raw = {}) {
  const name = toDisplayName(raw);
  return {
    id: raw._id || raw.id || "",
    name,
    avatar: toAvatarUrl(raw),
    bio: raw.bio || "",
    location: raw.location || raw.city || raw.timezone || "",
    company: raw.company || "",
    role: raw.role || "",
    education: raw.education || "",
    interests: toTagArray(raw.interests), // ✅
    skills:    toTagArray(raw.skills),    // ✅
    goals:     toTagArray(raw.goals),     // ✅
    mutualConnections: Number(raw.mutualConnections || raw.mutualConnectionsCount || 0),
    connectionStatus: raw.connectionStatus || "not_connected",
    joinedDate:
      raw.joinedDate ||
      (raw.createdAt
        ? new Date(raw.createdAt).toLocaleString("en-US", { month: "long", year: "numeric" })
        : ""),
  };
}