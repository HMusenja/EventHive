import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useCallback,
} from "react";
import { getMySummary, updateMyProfile, getMyProfile } from "@/api/profileApi";

const ProfileContext = createContext(null);

const INIT = "PROFILE_INIT";
const READY = "PROFILE_READY";
const ERROR = "PROFILE_ERROR";
const UPDATE = "PROFILE_UPDATE";

const initialState = {
  loading: true,
  error: null,
  profile: null,
  memberships: {
    counts: { organizer: 0, staff: 0, speaker: 0, attendee: 0 },
    organizing: [],
    staff: [],
    speaker: [],
    attending: [],
  },
  nextOrganizing: null,
  hasAnyEventRole: false,
  isOrganizer: false,
};

function reducer(state, action) {
  switch (action.type) {
    case INIT:
      return { ...state, loading: true, error: null };
    case READY:
      return { ...state, loading: false, error: null, ...action.payload };
    case ERROR:
      return { ...state, loading: false, error: action.error };
    case UPDATE:
      return { ...state, profile: { ...state.profile, ...action.payload } };
    default:
      return state;
  }
}

export function ProfileProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Normalize user-scoped interests (client-side safety)
  const normalizeInterests = useCallback((arr) => {
    if (typeof arr === "string") {
      arr = arr.split(",").map((s) => s.trim());
    }
    if (!Array.isArray(arr)) return undefined;
    return [
      ...new Set(
        arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
      ),
    ].slice(0, 25);
  }, []);

  const load = useCallback(async () => {
    dispatch({ type: INIT });
    try {
      const data = await getMySummary();
      dispatch({ type: READY, payload: data });
    } catch (e) {
      dispatch({
        type: ERROR,
        error:
          e?.response?.data?.message || e.message || "Failed to load profile",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = useCallback(
    async (partial) => {
      const { email, ...rest } = partial || {}; // never send email from here
      const normalized = { ...rest };
      if (typeof rest.interests !== "undefined") {
        const tags = normalizeInterests(rest.interests);
        if (tags) normalized.interests = tags; // only include if valid array after normalization
        else delete normalized.interests;      // drop invalid shapes
      }

      // optimistic update (use normalized shape so UI reflects what we’ll persist)
      dispatch({ type: UPDATE, payload: normalized });
      try {
        const serverRes = await updateMyProfile(normalized);
        // api may return { profile } or raw profile — handle both
        const updatedProfile = serverRes?.profile || serverRes;
        dispatch({ type: UPDATE, payload: updatedProfile });
        return { ok: true, profile: updatedProfile };
      } catch (e) {
        // reload to recover
        await load();
        return { ok: false, error: e?.response?.data?.message || e.message };
      }
    },
    [load, normalizeInterests]
  );

  const value = useMemo(
    () => ({ ...state, reload: load, saveProfile }),
    [state, load, saveProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
