import Activity from '../models/Activity.js';
import { getDb } from '../utils/db.js';

export async function getActivityLogs(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    let activities = [];

    if (db) {
      activities = db.find('activities', { userId });
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      activities = await Activity.find({ userId }).sort({ timestamp: -1 });
    }

    res.json(activities);
  } catch (err) {
    console.error('Get activity logs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function logActivity(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { type, title, description, xpEarned, metadata } = req.body;

    const db = getDb();
    let newActivity = null;

    if (db) {
      newActivity = db.insertOne('activities', {
        userId,
        type,
        title,
        description,
        xpEarned: xpEarned || 0,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });
    } else {
      const act = new Activity({
        userId,
        type,
        title,
        description,
        xpEarned,
        metadata
      });
      newActivity = await act.save();
    }

    res.status(201).json(newActivity);
  } catch (err) {
    console.error('Log activity error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
