// routes/notifications.routes.js
import express from "express";
import {
  getNotifications,            
  getUnreadNotifications,      // fetch unread count only
  markNotificationRead,        // mark one as read
    markAllNotificationsRead,    // mark all as read
  deleteNotification,        //  new
  deleteAllReadNotifications //  new
} from "../controllers/notificationController.js";
import checkToken from "../middleware/checkToken.js";

const router = express.Router();

// Get all notifications (latest first, with optional pagination)
router.get("/notifications", checkToken, getNotifications);

// Get unread notifications count
router.get("/notifications/unread", checkToken, getUnreadNotifications);

// Mark single notification as read
router.patch("/notifications/:id/read", checkToken, markNotificationRead);

// Mark all notifications as read
router.patch("/notifications/read-all", checkToken, markAllNotificationsRead);

// Delete single notification
router.delete("/notifications/:id", checkToken, deleteNotification);

// Delete all read notifications
router.delete("/notifications/clear-read", checkToken, deleteAllReadNotifications);


export default router;

