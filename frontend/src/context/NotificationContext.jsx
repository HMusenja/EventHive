import React, { createContext, useReducer, useContext, useEffect } from "react";
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
    case "MARK_READ":

      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === action.payload ? { ...n, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(state.unreadCount - 1, 0),
      };
    case "MARK_ALL_READ":

      return {
        ...state,
        notifications: state.notifications.map((n) => ({
          ...n,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      };
    case "DELETE_NOTIFICATION":

      return {
        ...state,
        notifications: state.notifications.filter((n) => n._id !== action.payload),
      };
    case "CLEAR_READ":

      return {
        ...state,
        notifications: state.notifications.filter((n) => !n.readAt),
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function normalizeListResp(listRes) {
    if (!listRes) return [];
    const data = listRes.data ?? listRes;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.notifications)) return data.notifications;
    if (Array.isArray(data.items)) return data.items;
    return [];
  }

  async function fetchNotifications() {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [listRes, countRes] = await Promise.all([getNotifications(), getUnreadCount()]);

      const list = normalizeListResp(listRes);

      // sort by createdAt if available
      list.sort((a, b) => {
        const aa = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bb - aa;
      });

      dispatch({ type: "SET_NOTIFICATIONS", payload: list });
      dispatch({
        type: "SET_UNREAD_COUNT",
        payload: countRes?.data?.count ?? countRes?.data ?? 0,
      });
    } catch (err) {
      console.error("[NotificationContext] fetchNotifications failed:", err);
      dispatch({ type: "SET_NOTIFICATIONS", payload: [] });
      dispatch({ type: "SET_UNREAD_COUNT", payload: 0 });
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

