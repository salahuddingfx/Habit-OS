import Goal from '../models/Goal.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { getDb } from '../utils/db.js';
import { queueNotification } from '../services/notification.service.js';
import { calculateTier } from '../services/leaderboard.service.js';

export async function getGoals(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    let goals = [];

    if (db) {
      goals = db.find('goals', { userId });
    } else {
      goals = await Goal.find({ userId });
    }

    res.json(goals);
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createOrUpdateGoal(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { category, type, targetValue, currentValue, dateKey } = req.body;

    const db = getDb();
    let goal = null;
    const progress = Math.min(Math.round((currentValue / targetValue) * 100), 100);
    const completed = progress === 100;

    if (db) {
      const existing = db.findOne('goals', { userId, category, type, dateKey });
      if (existing) {
        goal = db.updateOne('goals', { _id: existing._id }, {
          currentValue,
          progress,
          completionTimestamp: completed ? new Date().toISOString() : null
        });
      } else {
        goal = db.insertOne('goals', {
          userId,
          category,
          type,
          targetValue,
          currentValue,
          progress,
          dateKey,
          xpReward: 15,
          streak: 1,
          completionTimestamp: completed ? new Date().toISOString() : null
        });
      }
    } else {
      goal = await Goal.findOneAndUpdate(
        { userId, category, type, dateKey },
        {
          targetValue,
          currentValue,
          progress,
          completionTimestamp: completed ? new Date() : null
        },
        { new: true, upsert: true }
      );
    }

    res.json(goal);
  } catch (err) {
    console.error('Goal save error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Batch Sync offline mutations
export async function syncOfflineMutations(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { mutations } = req.body; // Array of pending actions
    
    if (!mutations || !Array.isArray(mutations)) {
      return res.status(400).json({ message: 'Invalid mutations payload' });
    }

    const db = getDb();
    const syncedItems = [];
    let xpEarnedTotal = 0;

    for (const mutation of mutations) {
      const { type, store, data } = mutation;
      
      if (store === 'goals') {
        const { category, type: goalType, targetValue, currentValue, dateKey, completed } = data;
        const progress = Math.min(Math.round((currentValue / targetValue) * 100), 100);
        const isGoalDone = progress === 100;
        
        let goalRecord = null;
        if (db) {
          const existing = db.findOne('goals', { userId, category, type: goalType, dateKey });
          if (existing) {
            goalRecord = db.updateOne('goals', { _id: existing._id }, {
              currentValue,
              progress,
              completionTimestamp: isGoalDone ? new Date().toISOString() : null
            });
          } else {
            goalRecord = db.insertOne('goals', {
              userId,
              category,
              type: goalType,
              targetValue,
              currentValue,
              progress,
              dateKey,
              xpReward: 15,
              streak: 1,
              completionTimestamp: isGoalDone ? new Date().toISOString() : null
            });
          }
        } else {
          goalRecord = await Goal.findOneAndUpdate(
            { userId, category, type: goalType, dateKey },
            {
              targetValue,
              currentValue,
              progress,
              completionTimestamp: isGoalDone ? new Date() : null
            },
            { new: true, upsert: true }
          );
        }

        // If completed during this sync, accumulate XP
        if (isGoalDone && (!goalRecord.completionTimestamp || completed)) {
          xpEarnedTotal += goalRecord.xpReward || 15;
          queueNotification(userId, `Goal Synced & Completed!`, `You earned +${goalRecord.xpReward} XP for completing your ${category} goal.`, 'success');
        }

        syncedItems.push({ id: data.id || data._id, serverId: goalRecord._id, status: 'synced' });
      }

      if (store === 'activities') {
        let actRecord = null;
        if (db) {
          actRecord = db.insertOne('activities', {
            userId,
            type: data.type,
            title: data.title,
            description: data.description,
            xpEarned: data.xpEarned || 0,
            metadata: data.metadata || {},
            timestamp: data.timestamp || new Date().toISOString()
          });
        } else {
          const actObj = new Activity({
            userId,
            type: data.type,
            title: data.title,
            description: data.description,
            xpEarned: data.xpEarned || 0,
            metadata: data.metadata || {},
            timestamp: data.timestamp
          });
          actRecord = await actObj.save();
        }
        syncedItems.push({ id: data.id, serverId: actRecord._id, status: 'synced' });
      }
    }

    // Apply accumulated XP to the user
    if (xpEarnedTotal > 0 && !req.user.isGuest) {
      if (db) {
        const u = db.findOne('users', { _id: userId });
        if (u) {
          const updatedXp = (u.xp || 0) + xpEarnedTotal;
          db.updateOne('users', { _id: userId }, {
            xp: updatedXp,
            tier: calculateTier(updatedXp)
          });
        }
      } else {
        const u = await User.findById(userId);
        if (u) {
          u.xp += xpEarnedTotal;
          u.tier = calculateTier(u.xp);
          await u.save();
        }
      }
    }

    res.json({
      status: 'ok',
      syncedCount: syncedItems.length,
      xpEarned: xpEarnedTotal,
      syncResults: syncedItems
    });
  } catch (err) {
    console.error('Offline sync error:', err);
    res.status(500).json({ message: 'Sync process failed' });
  }
}
