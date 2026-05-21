import { create } from 'zustand';
import { db } from '../services/db.js';

// ── Badge Definitions ─────────────────────────────────────────────────────
export const BADGE_DEFINITIONS = [
  { key: 'first_habit',  label: 'First Step',       desc: 'Log your very first habit',           iconKey: 'Target',       color: '#10B981' },
  { key: 'streak_3',    label: 'On a Roll',         desc: '3-day streak on any habit',           iconKey: 'Flame',        color: '#F59E0B' },
  { key: 'streak_7',    label: 'Week Warrior',      desc: '7-day streak on any habit',           iconKey: 'Award',        color: '#7C3AED' },
  { key: 'streak_30',   label: 'Monthly Master',    desc: '30-day streak on any habit',          iconKey: 'Crown',        color: '#EC4899' },
  { key: 'perfect_week',label: 'Perfect Week',      desc: 'Complete every habit for 7 days',     iconKey: 'Star',         color: '#3B82F6' },
  { key: 'hydration',   label: 'Hydration King',    desc: 'Log water 7 days in a row',           iconKey: 'Droplets',     color: '#06B6D4' },
  { key: 'early_bird',  label: 'Early Bird',        desc: 'Log a habit before 8am',              iconKey: 'Sunrise',      color: '#F59E0B' },
  { key: 'night_owl',   label: 'Night Owl',         desc: 'Log a habit after 10pm',              iconKey: 'Moon',         color: '#6366F1' },
  { key: 'xp_100',      label: 'XP Grinder',        desc: 'Earn 100 XP total',                   iconKey: 'Zap',          color: '#EF4444' },
  { key: 'planner',     label: 'Master Planner',    desc: 'Create your first plan',              iconKey: 'ClipboardList',color: '#8B5CF6' },
  { key: 'consistent',  label: 'Consistent',        desc: 'Log habits 14 days in a row',         iconKey: 'TrendingUp',   color: '#10B981' },
  { key: 'challenger',  label: 'Challenger',        desc: 'Complete a 30-day challenge',         iconKey: 'Swords',       color: '#EC4899' },
  { key: 'mood_logger', label: 'Self-Aware',        desc: 'Log your mood 7 days in a row',       iconKey: 'Smile',        color: '#F59E0B' },
  { key: 'body_tracker',label: 'Body Conscious',    desc: 'Log body stats 5 times',              iconKey: 'Scale',        color: '#3B82F6' },
  { key: 'overachiever',label: 'Overachiever',      desc: 'Exceed your target by 150%',          iconKey: 'Trophy',       color: '#F59E0B' },
];

// ── Streak calculation helper ─────────────────────────────────────────────
export function calcStreak(goals, category = null) {
  const completedDays = new Set(
    goals
      .filter(g => g.completionTimestamp && (!category || g.category === category))
      .map(g => g.dateKey)
  );
  const today = new Date();
  let streak  = 0;
  for (let i = 0; i < 365; i++) {
    const d    = new Date(today);
    d.setDate(d.getDate() - i);
    const key  = d.toISOString().split('T')[0];
    if (completedDays.has(key)) streak++;
    else if (i > 0) break; // allow today to be incomplete
  }
  return streak;
}

// Last N days as dateKey strings
export function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

// ── Store ─────────────────────────────────────────────────────────────────
export const useBadgeStore = create((set, get) => ({
  unlockedKeys: new Set(),
  badges: [],

  loadBadges: async () => {
    const rows = await db.badges.toArray();
    set({ badges: rows, unlockedKeys: new Set(rows.map(b => b.key)) });
  },

  checkAndUnlock: async (goals, user, plans) => {
    const { unlockedKeys } = get();
    const newlyUnlocked = [];
    const now           = new Date();
    const hour          = now.getHours();

    const streak        = calcStreak(goals);
    const totalXP       = (user?.xp || 0);
    const waterGoals    = goals.filter(g => g.category === 'water');

    const conditions = {
      first_habit:   goals.length > 0,
      streak_3:      streak >= 3,
      streak_7:      streak >= 7,
      streak_30:     streak >= 30,
      consistent:    streak >= 14,
      hydration:     calcStreak(waterGoals.length ? waterGoals : goals, 'water') >= 7,
      early_bird:    goals.some(g => new Date(g.completionTimestamp).getHours() < 8),
      night_owl:     goals.some(g => new Date(g.completionTimestamp).getHours() >= 22),
      xp_100:        totalXP >= 100,
      planner:       plans?.length > 0,
      overachiever:  goals.some(g => g.targetValue > 0 && (g.currentValue / g.targetValue) >= 1.5),
    };

    for (const [key, earned] of Object.entries(conditions)) {
      if (earned && !unlockedKeys.has(key)) {
        await db.badges.add({ key, unlockedAt: now.toISOString() });
        newlyUnlocked.push(key);
      }
    }

    if (newlyUnlocked.length > 0) {
      const rows = await db.badges.toArray();
      set({ badges: rows, unlockedKeys: new Set(rows.map(b => b.key)) });
    }

    return newlyUnlocked;
  },
}));
