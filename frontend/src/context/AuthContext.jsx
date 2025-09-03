// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from "react";
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from "@/api/authApi";
import {
  authReducer,
  initialAuthState,
  AUTH_INIT,
  AUTH_SUCCESS,
  AUTH_ERROR,
  AUTH_LOGOUT,
  AUTH_READY,
} from "../reducers/authReducer";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // ---- Fetch current session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      dispatch({ type: AUTH_INIT });
      try {
        const data = await getMe(); // { user }
        if (!mounted) return;
        dispatch({ type: AUTH_SUCCESS, payload: data?.user, initialized: true });
      } catch (err) {
        if (!mounted) return;
        // 401/403 means not logged in; still mark initialized
        dispatch({ type: AUTH_READY });
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ---- Public actions
  const refreshMe = useCallback(async () => {
    dispatch({ type: AUTH_INIT });
    try {
      const data = await getMe();
      dispatch({ type: AUTH_SUCCESS, payload: data?.user });
      return data?.user || null;
    } catch (err) {
      dispatch({ type: AUTH_ERROR, error: err });
      return null;
    } finally {
      dispatch({ type: AUTH_READY });
    }
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    dispatch({ type: AUTH_INIT });
    try {
      const data = await apiLogin({ identifier, password }); // { message, user }
      // You can trust BE user or call refreshMe(); we accept BE user here:
      dispatch({ type: AUTH_SUCCESS, payload: data?.user });
      return { ok: true, user: data?.user, message: data?.message };
    } catch (err) {
      dispatch({ type: AUTH_ERROR, error: err });
      return { ok: false, error: err };
    } finally {
      dispatch({ type: AUTH_READY });
    }
  }, []);

  const register = useCallback(async ({ fullName, email, username, password }) => {
    // NOTE: No auto-login after register (per preference)
    dispatch({ type: AUTH_INIT });
    try {
      const data = await apiRegister({ fullName, email, username, password }); // { message, user }
      // Keep state as-is; UI can switch to login mode and prefill identifier
      dispatch({ type: AUTH_READY });
      return { ok: true, data };
    } catch (err) {
      dispatch({ type: AUTH_ERROR, error: err });
      return { ok: false, error: err };
    }
  }, []);

  const logout = useCallback(async () => {
    dispatch({ type: AUTH_INIT });
    try {
      await apiLogout();
      dispatch({ type: AUTH_LOGOUT });
      return { ok: true };
    } catch (err) {
      dispatch({ type: AUTH_ERROR, error: err });
      return { ok: false, error: err };
    } finally {
      dispatch({ type: AUTH_READY });
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      // state shortcuts
      user: state.user,
      loading: state.loading,
      error: state.error,
      initialized: state.initialized,
      // actions
      login,
      register,
      logout,
      refreshMe,
    }),
    [state, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
