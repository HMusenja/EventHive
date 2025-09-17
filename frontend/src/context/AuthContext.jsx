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
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  loaded: false,
  error: null,
};

async function attachOrganizerFlag(user) {
  if (!user?._id) return { ...user, isOrganizer: false };

  try {
    const data = await getMyOrganizing();
    const events = Array.isArray(data) ? data : data?.events || [];
    return { ...user, isOrganizer: events.length > 0 };
  } catch (err) {
    console.warn("[AuthContext] Failed to attach organizer flag:", err.message);
    return { ...user, isOrganizer: false };
  }
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Fetch current user on app load
  const fetchUser = async () => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const res = await getCurrentUser();
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

  // Run only once on mount
  useEffect(() => {
    if (!state.loaded) fetchUser();
  }, []);

  // Login
  const login = async ({ identifier, password }) => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const res = await loginUser({ identifier, password });
      const rawUser = res.data?.user;

      const userWithFlag = await attachOrganizerFlag(rawUser);
      dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });

      return { ok: true, user: userWithFlag };
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.response?.data?.message || "Login failed",
      });
      throw error;
    }
  };

  // Register
  const register = async (userData) => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const res = await registerUser(userData);
      const rawUser = res.data?.user;
      const userWithFlag = await attachOrganizerFlag(rawUser);
      dispatch({ type: "AUTH_SUCCESS", payload: userWithFlag });
      return { ok: true, user: userWithFlag };
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.response?.data?.message || "Registration failed",
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
      console.error("[AuthContext] Logout failed:", err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        fetchUser,
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
    return { user: null, isAuthenticated: false, loading: true, logout: () => {} };
  }
  return context;
};

