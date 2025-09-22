// controllers/notificationController.js
import Notification from "../models/Notification.js";

// Fetch recent notifications (with pagination support)
export async function getNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

// Get unread count
export async function getUnreadNotifications(req, res, next) {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      readAt: null,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

// Mark single notification as read
export async function markNotificationRead(req, res, next) {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// Delete single notification
export async function deleteNotification(req, res, next) {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) return res.status(404).json({ message: "Notification not found" });

    res.json({ ok: true, deletedId: req.params.id });
  } catch (err) {
    next(err);
  }
}

// Delete all read notifications
export async function deleteAllReadNotifications(req, res, next) {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      readAt: { $ne: null },
    });

    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
}
