import React, { createContext, useReducer, useContext, useEffect, useRef } from "react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
  clearReadNotifications as apiClearReadNotifications,
} from "../api/notificationApi";

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload, loading: false };

    case "SET_UNREAD_COUNT":
      return { ...state, unreadCount: action.payload };

    case "MARK_READ": {
      const wasUnread = state.notifications.some(
        (n) => n._id === action.payload && !n.readAt
      );
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === action.payload
            ? { ...n, readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: wasUnread
          ? Math.max(state.unreadCount - 1, 0)
          : state.unreadCount,
      };
    }

    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({
          ...n,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      };

    case "DELETE_NOTIFICATION": {
      // 🔧 fix: decrement badge if the deleted one was unread
      const wasUnread = state.notifications.some(
        (n) => n._id === action.payload && !n.readAt
      );
      return {
        ...state,
        notifications: state.notifications.filter((n) => n._id !== action.payload),
        unreadCount: wasUnread
          ? Math.max(state.unreadCount - 1, 0)
          : state.unreadCount,
      };
    }

    case "CLEAR_READ":
      // read ones are removed; unreadCount unchanged
      return {
        ...state,
        notifications: state.notifications.filter((n) => !n.readAt),
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "RESET":
      return { ...state, notifications: [], unreadCount: 0, loading: false };

    default:
      return state;
  }
}

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const resetNotifications = () => dispatch({ type: "RESET" });

  // keep last list reference to avoid unnecessary state writes
  const lastListRef = useRef(null);

  function normalizeListResp(listRes) {
    if (!listRes) return [];
    const data = listRes.data ?? listRes;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.notifications)) return data.notifications;
    if (Array.isArray(data.items)) return data.items;
    return [];
  }

  function shallowEqualLists(a, b) {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    // compare by id + readAt + createdAt (enough for our list)
    for (let i = 0; i < a.length; i++) {
      const A = a[i], B = b[i];
      if (
        A._id !== B._id ||
        String(A.readAt || "") !== String(B.readAt || "") ||
        String(A.createdAt || "") !== String(B.createdAt || "")
      ) return false;
    }
    return true;
  }

  async function fetchNotifications() {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [listRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);

      const list = normalizeListResp(listRes);

      // sort by createdAt if available
      list.sort((a, b) => {
        const aa = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bb - aa;
      });

      // avoid redundant re-renders if nothing changed
      if (!shallowEqualLists(lastListRef.current || [], list)) {
        dispatch({ type: "SET_NOTIFICATIONS", payload: list });
        lastListRef.current = list;
      } else {
        // if list didn't change, at least stop loading
        dispatch({ type: "SET_LOADING", payload: false });
      }

      dispatch({
        type: "SET_UNREAD_COUNT",
        payload: typeof countRes === "number" ? countRes : countRes?.count ?? 0,
      });
    } catch (err) {
      // If user is not authenticated, clear the list quietly
      if (err?.response?.status === 401) {
        dispatch({ type: "RESET" });
      } else {
        console.error("[NotificationContext] fetchNotifications failed:", err);
        dispatch({ type: "SET_NOTIFICATIONS", payload: [] });
        dispatch({ type: "SET_UNREAD_COUNT", payload: 0 });
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  async function markAsRead(id) {
    try {
      dispatch({ type: "MARK_READ", payload: id });
      await apiMarkNotificationRead(id);
    } catch (err) {
      console.error("[NotificationContext] markAsRead failed:", err);
      fetchNotifications();
    }
  }
  const markNotificationRead = markAsRead;

  async function markAllAsRead() {
    try {
      dispatch({ type: "MARK_ALL_READ" });
      await apiMarkAllNotificationsRead();
    } catch (err) {
      console.error("[NotificationContext] markAllAsRead failed:", err);
      fetchNotifications();
    }
  }

  async function removeNotification(id) {
    try {
      dispatch({ type: "DELETE_NOTIFICATION", payload: id });
      await apiDeleteNotification(id);
    } catch (err) {
      console.error("[NotificationContext] removeNotification failed:", err);
      fetchNotifications();
    }
  }

  async function clearRead() {
    try {
      dispatch({ type: "CLEAR_READ" });
      await apiClearReadNotifications();
    } catch (err) {
      console.error("[NotificationContext] clearRead failed:", err);
      fetchNotifications();
    }
  }

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 30_000); // every 30s
    return () => clearInterval(t);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        fetchNotifications,
        resetNotifications,
        markAsRead,
        markNotificationRead,
        markAllAsRead,
        removeNotification,
        clearRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
