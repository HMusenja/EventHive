import axios from "@/services/axiosConfig";

// Get all notifications
export const getNotifications = () =>
  axios.get("/notifications").then((r) => r.data);

// Get unread notifications count
export const getUnreadCount = () =>
  axios.get("/notifications/unread").then((r) => r.data);

// Mark a single notification as read
export const markNotificationRead = (id) =>
  axios.patch(`/notifications/${id}/read`).then((r) => r.data);

// Mark all as read
export const markAllNotificationsRead = () =>
  axios.patch("/notifications/read-all").then((r) => r.data);

// Delete a notification
export const deleteNotification = (id) =>
  axios.delete(`/notifications/${id}`).then((r) => r.data);

// Clear all read notifications
export const clearReadNotifications = () =>
  axios.delete("/notifications/clear-read").then((r) => r.data);
