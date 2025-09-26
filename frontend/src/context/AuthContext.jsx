

import { createContext, useReducer, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authReducer } from "../reducers/authReducer";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "../api/authApi";
import { getMyOrganizing } from "@/api/eventsApi";
import { refreshSocketAuth } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";


const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  loaded: false,
  error: null,
};

// --- normalize fields coming from API so UI has stable keys ---
function normalizeUser(u = {}) {
  if (!u) return null;
  return {
    ...u,
    // unify avatar field names to a single key the UI can rely on
    avatarUrl: u.avatar || u.profilePicture || u.avatarUrl || "",
    // a friendly display name used across the app
    displayName: u.fullName || u.username || u.email || "User",
  };
}

async function attachOrganizerFlag(user) {
  if (!user?._id) return { ...user, isOrganizer: false };

  try {
    const data = await getMyOrganizing();
    const events = Array.isArray(data) ? data : data?.events || [];

    const isOrganizer = events.length > 0;
    return { ...user, isOrganizer };
  } catch (err) {
    console.warn("[AuthContext] organizer check failed:", err?.message || err);

  //  return { ...user, isOrganizer: events.length > 0 };
  //} catch (err) {
    //console.warn("[AuthContext] Failed to attach organizer flag:", err.message);

   // return { ...user, isOrganizer: false };
  }
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(authReducer, initialState);


  // ----- Fetch current user on app load -----
  const fetchUser = async () => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const res = await getCurrentUser(); // expects { data: { user } }
      const rawUser = res?.data?.user || null;

      if (!rawUser) {
        dispatch({ type: "AUTH_LOGOUT" });
        refreshSocketAuth({ force: true });
        return { ok: false };
      }


  // Fetch current user on app load
  //////const fetchUser = async () => {
   ////// try {
     //// dispatch({ type: "AUTH_LOADING" });
      //const res = await getCurrentUser();
     //const rawUser = res.data?.user;

      // normalize first → attach flags second
      const normalized = normalizeUser(rawUser);
      const userWithFlag = await attachOrganizerFlag(normalized);

      dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });

      // ensure socket carries the *current* auth (cookie/JWT)
      refreshSocketAuth({ force: true });

      return { ok: true, user: userWithFlag };
    } catch (error) {
      if (error?.response?.status === 401) {
        console.log("[AuthContext] Not authenticated (401)");
      } else {
        console.warn("[AuthContext] fetchUser error:", error?.message || error);
      }
      dispatch({ type: "AUTH_LOGOUT" });
      refreshSocketAuth({ force: true }); // drop any stale socket auth
      return { ok: false, message: error?.message };
    }
  };


  useEffect(() => {
    if (!state.loaded) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Login -----



  const login = async ({ identifier, password }) => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const res = await loginUser({ identifier, password });


      // If your API returns a JWT, persist it (optional; safe no-op if undefined)
      const token = res?.data?.token;
      if (token) {
        try {
          localStorage.setItem("token", token);
        } catch { }
      }

      const rawUser = res?.data?.user;
      const normalized = normalizeUser(rawUser);
      const userWithFlag = await attachOrganizerFlag(normalized);

      dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });
      refreshSocketAuth({ force: true }); // re-auth socket to new user

      return { ok: true, user: userWithFlag };
    } catch (error) {
      console.error(
        "[AuthContext] Login failed:",
        error?.response?.data?.message || error?.message
      );

     // const userWithFlag = await attachOrganizerFlag(rawUser);
      //dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });

    //  return { ok: true, user: userWithFlag };
   // } catch (error) {

      dispatch({
        type: "AUTH_ERROR",
        payload: error?.response?.data?.message || "Login failed",
      });
      throw error;
    }
  };


  // ----- Register -----

  const register = async (userData) => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const res = await registerUser(userData);

      // Optional JWT sync
      const token = res?.data?.token;
      if (token) {
        try {
          localStorage.setItem("token", token);
        } catch { }
      }

      const rawUser = res?.data?.user;
       const normalized = normalizeUser(rawUser);
      const userWithFlag = await attachOrganizerFlag(normalized);

      dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });
      refreshSocketAuth({ force: true }); // re-auth socket to new user

      return { ok: true, user: userWithFlag };
    } catch (error) {

      console.error(
        "[AuthContext] Registration failed:",
        error?.response?.data?.message || error?.message
      );
dispatch({
        type: "AUTH_ERROR",
        payload: error?.response?.data?.message || "Registration failed",
      });
      throw error;
    }
  };


  // Logout
  const logout = async () => {
    try {
      await logoutUser();
      dispatch({ type: "AUTH_LOGOUT" });
      toast({
        title: "Signed out",
        description: "You have been successfully logged out.",
      });
      navigate("/");

    } catch (err) {
      console.error("[AuthContext] Logout request failed:", err?.message || err);
      // continue with local cleanup regardless
    }
    dispatch({ type: "AUTH_LOGOUT" });
    try {
      localStorage.removeItem("token");
    } catch { }
    refreshSocketAuth({ force: true }); // drop auth + reconnect socket
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,

        authDispatch: dispatch,
        fetchUser,
        refreshMe: fetchUser,
        login,
        register,
        // registerLite,
        logout,

      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {

    console.warn("[useAuth] Used outside provider.");
    return {
      ...initialState,
      authDispatch: () => { },
      fetchUser: async () => ({ ok: false }),
      refreshMe: async () => ({ ok: false }),
      login: async () => ({ ok: false }),
      register: async () => ({ ok: false }),
      // registerLite: async () => ({}),
      logout: async () => { },
    };

   // console.warn("[useAuth] Tried to use AuthContext outside its provider.");
  //  return { user: null, isAuthenticated: false, loading: true, logout: () => {} };

  }
  return context;
};

