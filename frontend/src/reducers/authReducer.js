// src/context/authReducer.js

export const initialAuthState = {
  user: null,          // { _id, fullName, email, username, role?, createdAt? }
  loading: false,      // true during any auth action
  error: null,         // { status?, message } or string
  initialized: false,  // becomes true after first /auth/me attempt finishes
};

export const AUTH_INIT       = "AUTH_INIT";       // start of any auth operation
export const AUTH_SUCCESS    = "AUTH_SUCCESS";    // user loaded or login success
export const AUTH_ERROR      = "AUTH_ERROR";      // failed op
export const AUTH_LOGOUT     = "AUTH_LOGOUT";     // logout success
export const AUTH_READY      = "AUTH_READY";      // finished initial getMe()

export function authReducer(state, action) {
  switch (action.type) {
    case AUTH_INIT:
      return { ...state, loading: true, error: null };

    case AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload || null,
        loading: false,
        error: null,
        initialized: action.initialized ?? state.initialized,
      };

    case AUTH_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error || { message: "Unknown error" },
      };

    case AUTH_LOGOUT:
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
      };

    case AUTH_READY:
      return { ...state, initialized: true, loading: false };

    default:
      return state;
  }
}
