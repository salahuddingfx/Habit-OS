import Notification from '../models/Notification.js';
import { getDb } from '../utils/db.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    let notifications = [];

    if (db) {
      notifications = db.find('notifications', { userId });
      // Sort notifications by timestamp descending
      notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      notifications = await Notification.find({ userId }).sort({ timestamp: -1 });
    }

    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { notificationId } = req.body;
    const userId = req.user._id || req.user.id;
    const db = getDb();

    if (db) {
      if (notificationId) {
        db.updateOne('notifications', { _id: notificationId, userId }, { read: true });
      } else {
        // Mark all as read
        const userNotifs = db.find('notifications', { userId });
        userNotifs.forEach(n => {
          db.updateOne('notifications', { _id: n._id }, { read: true });
        });
      }
    } else {
      if (notificationId) {
        await Notification.findOneAndUpdate({ _id: notificationId, userId }, { read: true });
      } else {
        await Notification.updateMany({ userId }, { read: true });
      }
    }

    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Mark read notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
