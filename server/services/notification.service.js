import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getDb } from '../utils/db.js';

let ioInstance = null;
const notificationQueue = [];

// Initialize sockets
export function initNotificationSocket(io) {
  ioInstance = io;
  console.log('✅ Notification Sockets linked.');
  
  // Stagger queue processor (runs every 25 seconds to pop and send notifications)
  setInterval(async () => {
    if (notificationQueue.length > 0) {
      const nextNotification = notificationQueue.shift();
      await processAndDeliver(nextNotification);
    }
  }, 25000); // 25 seconds stagger delay
}

async function processAndDeliver(notif) {
  const { userId, title, subtitle, type } = notif;
  
  // Save to DB
  let savedNotif = null;
  const db = getDb();
  if (db) {
    savedNotif = db.insertOne('notifications', {
      userId,
      title,
      subtitle,
      type,
      read: false,
      timestamp: new Date().toISOString()
    });
  } else {
    try {
      const newNotif = new Notification({
        userId,
        title,
        subtitle,
        type,
        read: false
      });
      savedNotif = await newNotif.save();
    } catch (err) {
      console.error('Failed to write notification to MongoDB:', err);
    }
  }

  // Broadcast to client via Socket.io
  if (ioInstance && savedNotif) {
    ioInstance.to(userId).emit('notification', savedNotif);
    console.log(`[Stagger Dispatch] Broadcasted notification to user: ${userId}`);
  }
}

// Queue notification for staggered delivery
export function queueNotification(userId, title, subtitle, type = 'info') {
  notificationQueue.push({ userId, title, subtitle, type });
  console.log(`[Notification Queued] Current size: ${notificationQueue.length}`);
}

// Broadcast notification to ALL users
export async function broadcastNotification(title, subtitle, type = 'info') {
  const db = getDb();
  let users = [];
  
  if (db) {
    users = db.find('users') || [];
  } else {
    try {
      users = await User.find({});
    } catch (err) {
      console.error('Failed to fetch users for broadcast:', err);
    }
  }

  // Write notification database records for all users
  for (const u of users) {
    const userIdStr = (u._id || u.id)?.toString();
    if (!userIdStr) continue;

    if (db) {
      db.insertOne('notifications', {
        userId: userIdStr,
        title,
        subtitle,
        type,
        read: false,
        timestamp: new Date().toISOString()
      });
    } else {
      try {
        const newNotif = new Notification({
          userId: userIdStr,
          title,
          subtitle,
          type,
          read: false
        });
        await newNotif.save();
      } catch (err) {
        console.error(`Failed to write notification for user ${userIdStr}:`, err.message);
      }
    }
  }

  // Broadcast to all active sockets instantly
  if (ioInstance) {
    ioInstance.emit('notification', {
      _id: 'broadcast-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title,
      subtitle,
      type,
      read: false,
      timestamp: new Date().toISOString(),
      isBroadcast: true
    });
    console.log(`📣 [Broadcast Dispatch] Global notification sent to all clients: ${title}`);
  }
}

export function getActiveSocketCount() {
  if (ioInstance) {
    return ioInstance.engine.clientsCount || 0;
  }
  return 0;
}
