import React, { useState, useEffect } from 'react';
import { db } from '../services/db.js';
import {
  Bell, BellOff, Plus, Trash2, Clock, CheckCircle2,
  Droplets, Footprints, Bed, Flame, Dumbbell, Egg, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HABITS = {
  water:     { label: 'Water',    Icon: Droplets,   color: '#3B82F6' },
  sleep:     { label: 'Sleep',    Icon: Bed,        color: '#6366F1' },
  steps:     { label: 'Steps',    Icon: Footprints, color: '#7C3AED' },
  workouts:  { label: 'Exercise', Icon: Dumbbell,   color: '#EF4444' },
  nutrition: { label: 'Calories', Icon: Flame,      color: '#10B981' },
  protein:   { label: 'Protein',  Icon: Egg,        color: '#F59E0B' },
};

async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

function fireNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' });
}

export default function Reminders() {
  const [permission, setPermission] = useState(Notification?.permission || 'default');
  const [reminders, setReminders]   = useState([]);
  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState({ habitCategory: 'water', times: ['08:00'], label: '' });
  const [tested, setTested]         = useState(false);

  const load = async () => setReminders(await db.reminders.toArray());
  useEffect(() => { load(); }, []);

  // Check reminders every minute
  useEffect(() => {
    const check = () => {
      const now  = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      reminders.forEach(r => {
        if (!r.enabled) return;
        (r.times || []).forEach(t => {
          if (t === hhmm) {
            const habit = HABITS[r.habitCategory];
            fireNotification(
              `Time to log your ${r.label || habit?.label || r.habitCategory}!`,
              `Don't forget to track your ${habit?.label || r.habitCategory} today. Tap to open the app.`
            );
          }
        });
      });
    };
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  const askPermission = async () => {
    const result = await requestPermission();
    setPermission(result);
  };

  const saveReminder = async () => {
    const times = form.times.filter(Boolean);
    if (!times.length) return;
    await db.reminders.add({
      habitCategory: form.habitCategory,
      label:         form.label || HABITS[form.habitCategory]?.label,
      times,
      enabled:       true,
      createdAt:     new Date().toISOString()
    });
    setShowAdd(false);
    setForm({ habitCategory: 'water', times: ['08:00'], label: '' });
    load();
  };

  const toggleReminder = async (r) => {
    await db.reminders.update(r.id, { enabled: !r.enabled });
    load();
  };

  const deleteReminder = async (id) => {
    await db.reminders.delete(id);
    load();
  };

  const addTime = () => setForm(f => ({ ...f, times: [...f.times, '09:00'] }));
  const removeTime = (i) => setForm(f => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }));
  const updateTime = (i, val) => setForm(f => ({ ...f, times: f.times.map((t, idx) => idx === i ? val : t) }));

  const testNotification = () => {
    fireNotification('Test Reminder', 'Your reminders are working correctly!');
    setTested(true);
    setTimeout(() => setTested(false), 3000);
  };

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Reminders</h1>
          <p className="text-sm text-text-muted mt-1">Get notified at the right time to log your daily habits.</p>
        </div>
        {permission === 'granted' && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center space-x-2 bg-accent-purple hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent-purple/20 shrink-0">
            <Plus className="h-4 w-4" /><span>Add Reminder</span>
          </button>
        )}
      </div>

      {/* Permission banner */}
      {permission !== 'granted' && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 border ${permission === 'denied'
            ? 'bg-error-red/10 border-error-red/30'
            : 'bg-accent-purple/10 border-accent-purple/30'}`}>
          <div className="flex items-start space-x-3">
            {permission === 'denied'
              ? <BellOff className="h-5 w-5 text-error-red shrink-0 mt-0.5" />
              : <Bell className="h-5 w-5 text-accent-purple shrink-0 mt-0.5" />}
            <div className="flex-1">
              <div className="text-sm font-bold text-text-white">
                {permission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {permission === 'denied'
                  ? 'You have blocked notifications. Please allow them in your browser settings (click the lock icon in the URL bar).'
                  : 'Allow browser notifications so we can remind you to log your habits at the right time.'}
              </div>
              {permission !== 'denied' && (
                <button onClick={askPermission}
                  className="mt-3 bg-accent-purple hover:bg-accent-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center space-x-1.5">
                  <Bell className="h-3.5 w-3.5" /><span>Allow Notifications</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Test notification button */}
      {permission === 'granted' && (
        <div className="flex items-center space-x-3 bg-success-emerald/10 border border-success-emerald/30 rounded-2xl px-5 py-3">
          <CheckCircle2 className="h-4 w-4 text-success-emerald shrink-0" />
          <span className="text-xs text-success-emerald font-semibold flex-1">Notifications are enabled</span>
          <button onClick={testNotification}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${tested ? 'bg-success-emerald/20 text-success-emerald border-success-emerald/30' : 'border-success-emerald/30 text-success-emerald hover:bg-success-emerald/15'}`}>
            {tested ? 'Sent!' : 'Send Test'}
          </button>
        </div>
      )}

      {/* Reminders list */}
      {reminders.length === 0 && permission === 'granted' ? (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-12 text-center space-y-3">
          <Bell className="h-12 w-12 text-text-muted/20 mx-auto" />
          <p className="text-sm text-text-muted">No reminders set.</p>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center space-x-2 bg-accent-purple text-white text-xs font-bold px-4 py-2 rounded-xl">
            <Plus className="h-3.5 w-3.5" /><span>Add Your First Reminder</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {reminders.map(r => {
              const habit = HABITS[r.habitCategory] || HABITS.water;
              const Icon  = habit.Icon;
              return (
                <motion.div key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`bg-surface-dark border rounded-2xl p-4 flex items-center space-x-4 transition-all ${r.enabled ? 'border-border-slate/60' : 'border-border-slate/30 opacity-60'}`}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: habit.color + '20', border: `1px solid ${habit.color}40` }}>
                    <Icon className="h-5 w-5" style={{ color: habit.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-white">{r.label || habit.label}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(r.times || []).map((t, i) => (
                        <span key={i} className="flex items-center space-x-1 text-[10px] font-bold bg-background-dark border border-border-slate/50 px-2 py-0.5 rounded-lg text-text-muted">
                          <Clock className="h-2.5 w-2.5" /><span>{t}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Toggle */}
                    <button onClick={() => toggleReminder(r)}
                      className={`relative h-6 w-11 rounded-full transition-all ${r.enabled ? 'bg-accent-purple' : 'bg-border-slate'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${r.enabled ? 'left-5.5' : 'left-0.5'}`}
                        style={{ left: r.enabled ? '22px' : '2px' }} />
                    </button>
                    <button onClick={() => deleteReminder(r.id)}
                      className="p-2 text-text-muted hover:text-error-red hover:bg-error-red/10 rounded-xl transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add reminder drawer */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface-dark border-l border-border-slate/60 z-50 overflow-y-auto shadow-2xl">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-text-white font-outfit">New Reminder</h2>
                  <button onClick={() => setShowAdd(false)} className="p-2 text-text-muted hover:text-text-white hover:bg-border-slate/30 rounded-xl"><X className="h-5 w-5" /></button>
                </div>

                {/* Habit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Habit</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(HABITS).map(([key, h]) => {
                      const Icon = h.Icon;
                      const sel  = form.habitCategory === key;
                      return (
                        <button key={key} onClick={() => setForm(f => ({ ...f, habitCategory: key }))}
                          className={`flex flex-col items-center space-y-1.5 p-3 rounded-xl border-2 transition-all ${sel ? 'border-accent-purple bg-accent-purple/10' : 'border-border-slate text-text-muted hover:border-accent-purple/40'}`}>
                          <Icon className="h-5 w-5" style={{ color: sel ? h.color : undefined }} />
                          <span className="text-[10px] font-bold">{h.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom label */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Custom Label (optional)</label>
                  <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    placeholder={`e.g. "Drink water before lunch"`}
                    className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple" />
                </div>

                {/* Times */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Reminder Times</label>
                    <button onClick={addTime} className="text-[10px] text-accent-purple font-bold hover:underline flex items-center space-x-1">
                      <Plus className="h-3 w-3" /><span>Add Time</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.times.map((t, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <input type="time" value={t} onChange={e => updateTime(i, e.target.value)}
                          className="flex-1 bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple" />
                        {form.times.length > 1 && (
                          <button onClick={() => removeTime(i)} className="p-2.5 text-text-muted hover:text-error-red transition-colors rounded-xl hover:bg-error-red/10">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-accent-purple/10 border border-accent-purple/20 rounded-xl p-3 text-xs text-text-muted">
                  <span className="font-bold text-accent-purple">Note: </span>
                  Reminders fire as browser notifications. Keep this tab open (or install as PWA) for them to work reliably.
                </div>

                <div className="flex space-x-3">
                  <button onClick={saveReminder}
                    className="flex-1 bg-accent-purple hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2">
                    <Save className="h-4 w-4" /><span>Save Reminder</span>
                  </button>
                  <button onClick={() => setShowAdd(false)}
                    className="px-5 py-3 bg-border-slate/20 hover:bg-border-slate/40 text-text-muted font-bold rounded-xl transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
