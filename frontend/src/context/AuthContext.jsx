// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useReducer } from "react";
import { authReducer } from "../reducers/authReducer";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "../api/authApi";
import { getMyOrganizing } from "@/api/eventsApi";

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  loaded: false,
  error: null,
};

async function attachOrganizerFlag(user) {
  if (!user || !user._id) return { ...user, isOrganizer: false };

  try {
    console.log("[AuthContext] Checking if user is organizer...");
    const data = await getMyOrganizing();
    const events = Array.isArray(data) ? data : data?.events || [];
    const isOrganizer = events.length > 0;
    console.log("[AuthContext] isOrganizer →", isOrganizer);
    return { ...user, isOrganizer };
  } catch (err) {
    console.warn(
      "[AuthContext] Failed to attach organizer flag:",
      err.message || err
    );
    return { ...user, isOrganizer: false };
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);


  // Fetch current user on app load
  const fetchUser = async () => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const res = await getCurrentUser(); // expects { data: { user } }
      const rawUser = res.data?.user;
      const userWithFlag = await attachOrganizerFlag(rawUser);
      dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });
      return { ok: true, user: userWithFlag };
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("[AuthContext] Not authenticated (401)");
      } else {
        console.warn("[AuthContext] Error fetching user:", error.message);
      }
      dispatch({ type: "AUTH_LOGOUT" });
      return { ok: false, message: error.message };
    }
  };

  // fetchUser only on initial load, not after login
  useEffect(() => {
    if (!state.loaded) {
      fetchUser();
    }
  }, []);

  const login = async ({ identifier, password }) => {

    try {
      dispatch({ type: "AUTH_LOADING" });
      console.log("[AuthContext] Logging in...");
      const res = await loginUser({ identifier, password });
      const rawUser = res.data?.user;

      // attach flag ONCE
      console.debug("[AuthContext] Checking if user is organizer...");
      const userWithFlag = await attachOrganizerFlag(rawUser);
      console.log("[AuthContext] Login successful:", userWithFlag);

      dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });
      return { ok: true, user: userWithFlag };
    } catch (error) {
      console.error(
        "[AuthContext] Login failed:",
        error.response?.data?.message || error.message
      );
      dispatch({
        type: "AUTH_ERROR",
        payload: error.response?.data?.message || "Login failed",
      });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      console.log("[AuthContext] Registering user...");
      const res = await registerUser(userData);
      const rawUser = res.data?.user;
      const userWithFlag = await attachOrganizerFlag(rawUser);
      console.log("[AuthContext] Registration successful:", userWithFlag);
      dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });
      return { ok: true, user: userWithFlag };
    } catch (error) {
      console.error(
        "[AuthContext] Registration failed:",
        error.response?.data?.message || error.message
      );
      dispatch({
        type: "AUTH_ERROR",
        payload: error.response?.data?.message || "Registration failed",
      });
      throw error;
    }
  };

  const registerLite = async (userData) => {
    try {
      const res = await registerUser(userData);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthContext] Logging out...");
      await logoutUser();
      dispatch({ type: "AUTH_LOGOUT" });
      console.log("[AuthContext] Logged out.");
    } catch (err) {
      console.error("[AuthContext] Logout failed:", err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        authDispatch: dispatch,
        logout,
        login,
        register,
        registerLite,
        fetchUser,
        refreshMe: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn("[useAuth] Tried to use AuthContext outside its provider.");
    return {
      user: null,
      isAuthenticated: false,
      loading: true,
      loaded: false,
      error: null,
      authDispatch: () => {},
      logout: () => {},
      login: () => {},
      register: () => {},
      fetchUser: () => {},
    };
  }
  return context;
};
