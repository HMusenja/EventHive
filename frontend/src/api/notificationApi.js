import axios from "axios";

//  Get all notifications
export const getNotifications = () => axios.get("/api/notifications");

//  Get unread notifications count
export const getUnreadCount = () => axios.get("/api/notifications/unread");

//  Mark a single notification as read
export const markNotificationRead = (id) =>
  axios.patch(`/api/notifications/${id}/read`);

//  Mark all as read
export const markAllNotificationsRead = () =>
  axios.patch("/api/notifications/read-all");

//  Delete a notification
export const deleteNotification = (id) =>
  axios.delete(`/api/notifications/${id}`);

//  Clear all read notifications
export const clearReadNotifications = () =>
  axios.delete("/api/notifications/clear-read");
