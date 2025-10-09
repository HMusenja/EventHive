// src/utils/matchActivity.js
import axios from "axios";
import { listMeetings } from "@/api/meetingsApi";

const api = axios.create({ withCredentials: true });

/** Fetch viewed userIds from the server and return a Set<string>. */
export async function fetchViewedIdsServer({ limit = 500 } = {}) {
  const tries = [
    ["/api/activity/viewed", { limit }],
    ["/activity/viewed", { limit }],
  ];
  let lastErr;
  for (const [path, params] of tries) {
    try {
      const { data } = await api.get(path, { params });
      // Support a few shapes:
      // { ids: ["u1","u2"] } OR [{ viewedUserId: "..." }, ...] OR ["u1","u2"]
      if (Array.isArray(data?.ids)) {
        return new Set(data.ids.map(String));
      }
      if (Array.isArray(data)) {
        const arr = data.map((it) =>
          String(
            it?.viewedUserId || it?.userId || it?._id || it?.id || it
          )
        ).filter(Boolean);
        return new Set(arr);
      }
      // Fallback: empty
      return new Set();
    } catch (e) {
      lastErr = e;
      if (e?.response?.status !== 404) throw e;
    }
  }
  throw lastErr;
}

/** Record a profile view server-side; fire-and-forget usage is fine. */
export async function recordViewedServer(targetUserId) {
  if (!targetUserId) return;
  const body = { targetUserId, type: "profile_view" };
  // Try POST /activity/view (or /api/activity/view)
  const tries = ["/api/activity/view", "/activity/view"];
  let lastErr;
  for (const path of tries) {
    try {
      await api.post(path, body);
      return;
    } catch (e) {
      lastErr = e;
      if (e?.response?.status !== 404) throw e;
    }
  }
  throw lastErr;
}

/** Build connected set from meetings (any status counts as connected). */
export async function connectedIdsFromMeetings(myUserId) {
  const out = new Set();
  try {
    const data = await listMeetings({ page: 1, limit: 500 });
    const items = data?.meetings || data?.data || data || [];
    const me = String(myUserId || "");

    for (const mt of items) {
      const hostId = String(mt.hostId || mt.host?._id || mt.host?.id || "");
      const inviteeId = String(mt.inviteeId || mt.invitee?._id || mt.invitee?.id || "");
      let other = "";

      if (me && hostId && inviteeId) {
        other = hostId === me ? inviteeId : inviteeId === me ? hostId : "";
      } else if (Array.isArray(mt.participants)) {
        const ids = mt.participants.map((p) => String(p?._id || p?.id || p)).filter(Boolean);
        other = ids.find((id) => id !== me) || "";
      }
      if (other) out.add(other);
    }
  } catch {
    // swallow; caller can still do optimistic marks
  }
  return out;
}

/** Precedence: connected > viewed > new */
export function deriveStatusFor(person, { viewedIds, connectedIds }) {
  const id = String(person?.id || "");
  if (connectedIds?.has(id) || person?.status === "connected") return "connected";
  if (viewedIds?.has(id)) return "viewed";
  return "new";
}
