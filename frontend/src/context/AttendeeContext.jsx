import { createContext, useContext, useReducer, useCallback } from "react";
import {
  attendeeReducer,
  initialAttendeeState,
  ATTENDEE_INIT,
  ATTENDEE_READY,
  ATTENDEE_SAVING,
  ATTENDEE_ERROR,
  SET_PROFILE,
  UPDATE_INTERESTS,
} from "@/reducers/attendeeReducer";

import {
  getMyAttendee,
  upsertMyAttendee,
} from "@/api/attendeeApi"; // from previous step

const AttendeeContext = createContext(null);

export function AttendeeProvider({ children }) {
  const [state, dispatch] = useReducer(attendeeReducer, initialAttendeeState);

  // Load the current user's attendee profile
  const loadMyAttendee = useCallback(async () => {
    dispatch({ type: ATTENDEE_INIT });
    try {
      const data = await getMyAttendee(); // expect { attendee } or 404
      dispatch({ type: SET_PROFILE, payload: data?.attendee || null });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        // no profile yet — initialize empty
        dispatch({ type: SET_PROFILE, payload: null });
      } else {
        dispatch({
          type: ATTENDEE_ERROR,
          payload: err?.response?.data?.message || err?.message,
        });
      }
    } finally {
      dispatch({ type: ATTENDEE_READY });
    }
  }, []);

  // Save (create/update) attendee profile
  const saveMyAttendee = useCallback(
    async (partial) => {
      // partial: { bio?, location?, interests?, avatar?, ... }
      dispatch({ type: ATTENDEE_SAVING, payload: true });
      try {
        const { attendee } = await upsertMyAttendee(partial, state.attendee?._id || null);
        dispatch({ type: SET_PROFILE, payload: attendee });
        return attendee;
      } catch (err) {
        dispatch({ type: ATTENDEE_ERROR, payload: err?.response?.data?.message || err?.message });
        throw err;
      } finally {
        dispatch({ type: ATTENDEE_SAVING, payload: false });
      }
    },
    [state.attendee?._id]
  );

  // Replace the entire interests array
  const setInterests = useCallback((interests) => {
    const arr = Array.isArray(interests) ? interests : [];
    dispatch({ type: UPDATE_INTERESTS, payload: arr });
  }, []);

  // Convenience: add/remove a single interest (with normalization)
  const addInterest = useCallback((value, cap = 10) => {
    const v = String(value || "").trim();
    if (!v) return;
    const normalized = v.replace(/\s+/g, " ").trim();

    const current = state.attendee?.interests || [];
    const exists = new Set(current.map((x) => x.toLowerCase()));
    if (exists.has(normalized.toLowerCase())) return;
    if (current.length >= cap) return;

    dispatch({ type: UPDATE_INTERESTS, payload: [...current, normalized] });
  }, [state.attendee?.interests]);

  const removeInterestAt = useCallback((index) => {
    const current = state.attendee?.interests || [];
    const next = current.filter((_, i) => i !== index);
    dispatch({ type: UPDATE_INTERESTS, payload: next });
  }, [state.attendee?.interests]);

  // Expose everything needed by consumers
  const value = {
    state,
    dispatch,
    // data
    attendee: state.attendee,
    interests: state.attendee?.interests || [],
    // ops
    loadMyAttendee,
    saveMyAttendee,
    setInterests,
    addInterest,
    removeInterestAt,
  };

  return <AttendeeContext.Provider value={value}>{children}</AttendeeContext.Provider>;
}

export function useAttendee() {
  const ctx = useContext(AttendeeContext);
  if (!ctx) throw new Error("useAttendee must be used within AttendeeProvider");
  return ctx;
}

