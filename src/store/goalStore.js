import { create } from 'zustand';
import { db, queueMutation } from '../services/db.js';
import { useAuthStore } from './authStore.js';
import { useSyncStore } from './syncStore.js';
import { useNotificationStore } from './notificationStore.js';

// ── Date key helpers ────────────────────────────────────────────────────────
export function getDateKey(type = 'daily') {
  const now = new Date();
  if (type instanceof Date || (typeof type === 'string' && type.includes('-') && type.length === 10)) {
    // Called with a Date object or ISO date string — return daily key
    const d = type instanceof Date ? type : new Date(type);
    return d.toISOString().split('T')[0];
  }
  if (type === 'daily' || !type) {
    return now.toISOString().split('T')[0];
  }
  if (type === 'weekly') {
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    return `${now.getFullYear()}-W${week}`;
  }
  if (type === 'monthly') {
    return `${now.getFullYear()}-M${now.getMonth() + 1}`;
  }
  return now.toISOString().split('T')[0];
}

const FALLBACK_TARGETS = {
  water:     2500,
  sleep:     8,
  steps:     10000,
  nutrition: 2000,
  protein:   140,
  workouts:  45,
};

export const useGoalStore = create((set, get) => ({
  goals:   [],
  loading: false,

  // Load goals from local IndexedDB — works for both guest and logged-in users
  loadLocalGoals: async () => {
    set({ loading: true });
    try {
      const allGoals = await db.goals.toArray();
      set({ goals: allGoals, loading: false });
    } catch (err) {
      console.error('Failed to load local goals:', err);
      set({ loading: false });
    }
  },

  // Log habit or health value
  logValue: async (category, type, value, targetValue = null) => {
    const auth    = useAuthStore.getState();
    const dateKey = getDateKey(type);

    let localGoal = await db.goals.where({ category, type, dateKey }).first();

    const finalTarget  = targetValue !== null ? targetValue : (localGoal ? localGoal.targetValue : (FALLBACK_TARGETS[category] || 1));
    const finalCurrent = (localGoal ? localGoal.currentValue : 0) + Number(value);
    const progress     = Math.min(Math.round((finalCurrent / finalTarget) * 100), 100);
    const completedNow = progress === 100 && (!localGoal || localGoal.progress < 100);

    const goalData = {
      category,
      type,
      targetValue:          finalTarget,
      currentValue:         finalCurrent,
      progress,
      dateKey,
      completionTimestamp:  completedNow ? new Date().toISOString() : (localGoal?.completionTimestamp || null),
      synced:               0,
    };

    if (localGoal) {
      goalData.id = localGoal.id;
      await db.goals.put(goalData);
    } else {
      const newId  = await db.goals.add(goalData);
      goalData.id  = newId;
    }

    // Activity log
    const activityData = {
      type:        completedNow ? 'completed' : 'updated',
      title:       completedNow ? `${category.toUpperCase()} Completed` : `Updated ${category}`,
      description: completedNow
        ? `Successfully reached ${finalTarget} ${category === 'water' ? 'ml' : category === 'steps' ? 'steps' : 'units'}.`
        : `Logged +${value} to your ${category} tracker.`,
      xpEarned:    completedNow ? 15 : 0,
      timestamp:   new Date().toISOString(),
      synced:      0,
    };
    await db.activities.add(activityData);

    // Queue for server sync
    await queueMutation('goals',      localGoal ? 'update' : 'create', goalData);
    await queueMutation('activities', 'create', activityData);

    // Vibration (web fallback — no Capacitor dependency)
    if (completedNow) {
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (_) {}

      auth.addXP(15);

      useNotificationStore.getState().showInAppBanner(
        'Goal Accomplished!',
        `You completed your ${category} goal and earned +15 XP!`,
        'success'
      );
    }

    // Refresh store
    await get().loadLocalGoals();

    // Sync if online
    useSyncStore.getState().syncOfflineData();
  },
}));
