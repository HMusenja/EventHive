import { createContext, useContext, useEffect, useReducer } from "react";
import { authReducer } from "../reducers/authReducer";
import {
  getCurrentUser,
  logoutUser,
  loginUser,
  registerUser,
} from "../api/authApi";

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  loaded: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Fetch user on first load
const fetchUser = async () => {
  try {
    dispatch({ type: "AUTH_LOADING" });
    const res = await getCurrentUser();
    dispatch({ type: "AUTH_SUCCESS", payload: res.data.user });
    return { ok: true, user: res.data.user };
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

  useEffect(() => {
  fetchUser();
}, []);

  const login = async ({ identifier, password }) => {
  try {
    dispatch({ type: "AUTH_LOADING" });
    console.log("[AuthContext] Logging in...");
    const res = await loginUser({ identifier, password }); // matches backend
    console.log("[AuthContext] Login successful:", res.data.user);
    dispatch({ type: "AUTH_SUCCESS", payload: res.data.user });
    return { ok: true, user: res.data.user };
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
      console.log("[AuthContext] Registration successful:", res.data.user);
      dispatch({ type: "AUTH_SUCCESS", payload: res.data.user });
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
      // do NOT dispatch AUTH_SUCCESS here
      const res = await registerUser(userData);
      return res.data; // { user, message, ... } as your API returns
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
    };
  }
  return context;
};
