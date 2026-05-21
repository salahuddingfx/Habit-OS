import Dexie from 'dexie';

export const db = new Dexie('HealthHabitOS');

db.version(2).stores({
  goals: '++id, category, type, targetValue, currentValue, progress, dateKey, completionTimestamp, synced, [category+type+dateKey]',
  activities: '++id, type, title, description, xpEarned, timestamp, synced',
  syncQueue: '++id, store, type, data, timestamp'
});

db.version(3).stores({
  goals: '++id, category, type, targetValue, currentValue, progress, dateKey, completionTimestamp, synced, [category+type+dateKey]',
  activities: '++id, type, title, description, xpEarned, timestamp, synced',
  syncQueue: '++id, store, type, data, timestamp',
  plans: '++id, name, period, active, createdAt'
});

db.version(4).stores({
  goals:      '++id, category, type, targetValue, currentValue, progress, dateKey, completionTimestamp, synced, [category+type+dateKey]',
  activities: '++id, type, title, description, xpEarned, timestamp, synced',
  syncQueue:  '++id, store, type, data, timestamp',
  plans:      '++id, name, period, active, createdAt',
  badges:     '++id, key, unlockedAt',
  challenges: '++id, name, startDate, endDate, active',
  moods:      '++id, date, score, timestamp',
  bodyStats:  '++id, date',
  photos:     '++id, date, type',
  reminders:  '++id, habitCategory, enabled',
  foodLogs:   '++id, date, name, calories, protein, carbs, fat'
});

// Helper functions to log sync queues
export async function queueMutation(store, type, data) {
  await db.syncQueue.add({
    store,
    type,
    data,
    timestamp: Date.now()
  });
}
