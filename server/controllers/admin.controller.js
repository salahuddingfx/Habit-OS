import User from '../models/User.js';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import { getDb } from '../utils/db.js';
import { broadcastNotification, getActiveSocketCount } from '../services/notification.service.js';
import { calculateTier } from '../services/leaderboard.service.js';
import os from 'os';

// In-memory request log queue
export const apiLogs = [];

export function logRequest(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress || '127.0.0.1'
    };
    apiLogs.push(logEntry);
    if (apiLogs.length > 50) {
      apiLogs.shift();
    }
  });
  next();
}

// 1. Get all users
export async function getUsers(req, res) {
  try {
    const db = getDb();
    let usersList = [];
    if (db) {
      usersList = db.find('users') || [];
    } else {
      usersList = await User.find({}).select('-password');
    }
    res.json(usersList);
  } catch (err) {
    console.error('Admin getUsers error:', err);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
}

// 2. Update user
export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { xp, streak, role, region, username } = req.body;
    const db = getDb();

    // Recalculate tier based on updated XP
    const newTier = calculateTier(Number(xp || 0));

    let updatedUser = null;
    if (db) {
      updatedUser = db.updateOne('users', { _id: userId }, {
        xp: Number(xp),
        streak: Number(streak),
        role,
        region,
        username,
        tier: newTier
      });
    } else {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            xp: Number(xp),
            streak: Number(streak),
            role,
            region,
            username,
            tier: newTier
          }
        },
        { new: true }
      ).select('-password');
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Admin updateUser error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
}

// 3. Delete user
export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    const db = getDb();

    if (db) {
      db.deleteMany('users', { _id: userId });
      db.deleteMany('goals', { userId });
      db.deleteMany('notifications', { userId });
      db.deleteMany('activities', { userId });
    } else {
      await User.findByIdAndDelete(userId);
      await Goal.deleteMany({ userId });
      await Notification.deleteMany({ userId });
      // Delete from activities if it exists
      try {
        const Activity = (await import('../models/Activity.js')).default;
        await Activity.deleteMany({ userId });
      } catch (e) {
        // Ignored
      }
    }

    res.json({ message: 'User and all related records deleted successfully' });
  } catch (err) {
    console.error('Admin deleteUser error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
}

// 4. Get System Stats
export async function getSystemStats(req, res) {
  try {
    const db = getDb();
    const dbType = db ? 'Local JSON File' : 'MongoDB / Cloud Atlas';
    
    let usersCount = 0;
    let goalsCount = 0;
    let notificationsCount = 0;

    if (db) {
      usersCount = (db.find('users') || []).length;
      goalsCount = (db.find('goals') || []).length;
      notificationsCount = (db.find('notifications') || []).length;
    } else {
      usersCount = await User.countDocuments();
      goalsCount = await Goal.countDocuments();
      notificationsCount = await Notification.countDocuments();
    }

    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memUsage = ((1 - freeMem / totalMem) * 100).toFixed(1);

    res.json({
      dbType,
      activeSockets: getActiveSocketCount(),
      usersCount,
      goalsCount,
      notificationsCount,
      systemMetrics: {
        platform: os.platform(),
        arch: os.arch(),
        cpuCores: os.cpus().length,
        memoryUsage: `${memUsage}%`,
        uptime: `${(os.uptime() / 3600).toFixed(1)} hrs`
      }
    });
  } catch (err) {
    console.error('Admin getSystemStats error:', err);
    res.status(500).json({ message: 'Failed to retrieve stats' });
  }
}

// 5. Broadcast notification
export async function broadcast(req, res) {
  try {
    const { title, subtitle, type } = req.body;
    if (!title || !subtitle) {
      return res.status(400).json({ message: 'Title and subtitle are required' });
    }

    await broadcastNotification(title, subtitle, type || 'info');
    res.json({ message: 'Global broadcast dispatched successfully' });
  } catch (err) {
    console.error('Admin broadcast error:', err);
    res.status(500).json({ message: 'Failed to dispatch broadcast' });
  }
}

// 6. Get logs
export async function getLogs(req, res) {
  res.json(apiLogs);
}

// 7. Seed Database
export async function seedDatabase(req, res) {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    const mockSeedUsers = [
      {
        username: 'HabitHero',
        xp: 820,
        streak: 15,
        region: 'Global',
        role: 'user',
        tier: 'Platinum',
        height: 180,
        weight: 78,
        age: 28,
        activityLevel: 'moderately_active'
      },
      {
        username: 'PulseOperator',
        xp: 410,
        streak: 8,
        region: 'North America',
        role: 'user',
        tier: 'Gold',
        height: 172,
        weight: 65,
        age: 24,
        activityLevel: 'very_active'
      },
      {
        username: 'AquaWalker',
        xp: 140,
        streak: 3,
        region: 'Asia',
        role: 'user',
        tier: 'Silver',
        height: 165,
        weight: 58,
        age: 30,
        activityLevel: 'lightly_active'
      }
    ];

    const usersAdded = [];

    for (const u of mockSeedUsers) {
      let createdUser = null;
      if (db) {
        // Check if exists
        const existing = db.findOne('users', { username: u.username });
        if (existing) {
          createdUser = existing;
        } else {
          createdUser = db.insertOne('users', {
            ...u,
            password: '$2b$10$tM.yF5pG/tTqFz283Y3pGecO39UqN2v/9W30w.2Q7/e5R4s2Tye.G' // "password" encrypted
          });
        }
      } else {
        const existing = await User.findOne({ username: u.username });
        if (existing) {
          createdUser = existing;
        } else {
          const user = new User({
            ...u,
            password: '$2b$10$tM.yF5pG/tTqFz283Y3pGecO39UqN2v/9W30w.2Q7/e5R4s2Tye.G'
          });
          createdUser = await user.save();
        }
      }
      usersAdded.push(createdUser);
    }

    // Seed goals for each added user
    const goalsToSeed = [
      { category: 'water', type: 'daily', targetValue: 2500, currentValue: 1500, dateKey: today, xpReward: 15 },
      { category: 'steps', type: 'daily', targetValue: 10000, currentValue: 8200, dateKey: today, xpReward: 20 },
      { category: 'sleep', type: 'daily', targetValue: 8, currentValue: 7, dateKey: today, xpReward: 10 },
      { category: 'nutrition', type: 'daily', targetValue: 2000, currentValue: 1800, dateKey: today, xpReward: 15 }
    ];

    for (const user of usersAdded) {
      const userIdStr = (user._id || user.id).toString();
      for (const goalInfo of goalsToSeed) {
        // Calculate progress percentage
        const progress = Math.min(Math.round((goalInfo.currentValue / goalInfo.targetValue) * 100), 100);

        if (db) {
          const existingGoal = db.findOne('goals', { userId: userIdStr, category: goalInfo.category, dateKey: today });
          if (!existingGoal) {
            db.insertOne('goals', {
              userId: userIdStr,
              progress,
              ...goalInfo
            });
          }
        } else {
          const existingGoal = await Goal.findOne({ userId: userIdStr, category: goalInfo.category, dateKey: today });
          if (!existingGoal) {
            const newGoal = new Goal({
              userId: userIdStr,
              progress,
              ...goalInfo
            });
            await newGoal.save();
          }
        }
      }
    }

    res.json({ message: 'Database successfully seeded with mock operators and habits.' });
  } catch (err) {
    console.error('Seed DB failed:', err);
    res.status(500).json({ message: 'Database seeding failed.' });
  }
}
