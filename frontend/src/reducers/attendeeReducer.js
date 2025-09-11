// src/reducers/attendeeReducer.js

export const ATTENDEE_INIT = "ATTENDEE_INIT";
export const SET_PROFILE = "SET_PROFILE";
export const UPDATE_INTERESTS = "UPDATE_INTERESTS";
export const ATTENDEE_ERROR = "ATTENDEE_ERROR";
export const ATTENDEE_SAVING = "ATTENDEE_SAVING";
export const ATTENDEE_READY = "ATTENDEE_READY";

export const initialAttendeeState = {
  attendee: null,      // { _id, bio, location, interests, avatar, ... }
  loading: false,
  saving: false,
  error: null,
  initialized: false,
};

export function attendeeReducer(state, action) {
  switch (action.type) {
    case ATTENDEE_INIT:
      return { ...state, loading: true, error: null };
    case SET_PROFILE:
      return {
        ...state,
        loading: false,
        error: null,
        attendee: action.payload || null,
        initialized: true,
      };
    case UPDATE_INTERESTS:
      if (!state.attendee) return state;
      return {
        ...state,
        attendee: {
          ...state.attendee,
          interests: Array.isArray(action.payload) ? action.payload : state.attendee.interests,
        },
      };
    case ATTENDEE_SAVING:
      return { ...state, saving: action.payload === true, error: null };
    case ATTENDEE_ERROR:
      return { ...state, loading: false, saving: false, error: action.payload || "Unknown error" };
    case ATTENDEE_READY:
      return { ...state, loading: false, initialized: true };
    default:
      return state;
  }
}
