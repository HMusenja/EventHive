import axios from "axios";

// Get all notifications
export const getNotifications = () =>
  axios.get("/api/notifications").then((r) => r.data);

// Get unread notifications count
export const getUnreadCount = () =>
  axios.get("/api/notifications/unread").then((r) => r.data);

// Mark a single notification as read
export const markNotificationRead = (id) =>
  axios.patch(`/api/notifications/${id}/read`).then((r) => r.data);

// Mark all as read
export const markAllNotificationsRead = () =>
  axios.patch("/api/notifications/read-all").then((r) => r.data);

// Delete a notification
export const deleteNotification = (id) =>
  axios.delete(`/api/notifications/${id}`).then((r) => r.data);

// Clear all read notifications
export const clearReadNotifications = () =>
  axios.delete("/api/notifications/clear-read").then((r) => r.data);
