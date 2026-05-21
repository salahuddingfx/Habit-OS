import React, { useState, useEffect } from 'react';
import { db } from '../services/db.js';
import {
  Plus, Trash2, X, CheckCircle2, Calendar, Swords,
  Play, ChevronDown, ChevronUp, Trophy, Flame, Target,
  Droplets, Footprints, Bed, Dumbbell, Egg
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HABIT_OPTIONS = {
  water:     { label: 'Water',    unit: 'ml',    Icon: Droplets,  color: '#3B82F6' },
  sleep:     { label: 'Sleep',    unit: 'hrs',   Icon: Bed,       color: '#6366F1' },
  steps:     { label: 'Steps',    unit: 'steps', Icon: Footprints,color: '#7C3AED' },
  workouts:  { label: 'Exercise', unit: 'min',   Icon: Dumbbell,  color: '#EF4444' },
  nutrition: { label: 'Calories', unit: 'kcal',  Icon: Flame,     color: '#10B981' },
  protein:   { label: 'Protein',  unit: 'g',     Icon: Egg,       color: '#F59E0B' },
};

const DURATIONS = [7, 14, 21, 30];

function todayKey() { return new Date().toISOString().split('T')[0]; }

function ChallengeCalendar({ challenge }) {
  const start = new Date(challenge.startDate);
  const end   = new Date(challenge.endDate);
  const days  = Math.round((end - start) / 86400000) + 1;
  const completions = new Set(challenge.completions || []);

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: days }, (_, i) => {
        const d   = new Date(start);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        const done = completions.has(key);
        const isPast = d < new Date();
        return (
          <div
            key={key}
            title={key}
            className="h-5 w-5 rounded-md transition-all"
            style={{
              backgroundColor: done
                ? '#10B981'
                : isPast
                  ? 'var(--color-error-red)20'
                  : 'var(--color-border-slate)40',
              border: `1px solid ${done ? '#10B981' : 'var(--color-border-slate)'}`,
              opacity: isPast && !done ? 0.5 : 1
            }}
          />
        );
      })}
    </div>
  );
}

function ChallengeCard({ ch, onDelete, onCheckIn }) {
  const [expanded, setExpanded] = useState(false);
  const completions = ch.completions || [];
  const start   = new Date(ch.startDate);
  const end     = new Date(ch.endDate);
  const total   = Math.round((end - start) / 86400000) + 1;
  const pct     = Math.round((completions.length / total) * 100);
  const today   = todayKey();
  const checkedToday = completions.includes(today);
  const isExpired = new Date() > end;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="bg-surface-dark border border-border-slate/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="font-extrabold text-text-white font-outfit text-base">{ch.name}</h3>
              {ch.active && !isExpired && (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple border border-accent-purple/30">Active</span>
              )}
              {isExpired && (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-border-slate/40 text-text-muted border border-border-slate/50">Ended</span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {ch.startDate} → {ch.endDate} · {total} days · {completions.length} completed
            </p>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button onClick={() => onDelete(ch.id)} className="p-2 text-text-muted hover:text-error-red hover:bg-error-red/10 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></button>
            <button onClick={() => setExpanded(!expanded)} className="p-2 text-text-muted hover:text-text-white hover:bg-border-slate/30 rounded-xl transition-all">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-text-muted">Progress</span>
            <span style={{ color: pct >= 100 ? '#10B981' : '#7C3AED' }}>{pct}%</span>
          </div>
          <div className="h-1.5 bg-border-slate/40 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#10B981' : '#7C3AED' }} />
          </div>
        </div>

        {/* Calendar */}
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2">
            <ChallengeCalendar challenge={ch} />
          </motion.div>
        )}

        {/* Check-in */}
        {!isExpired && (
          <button onClick={() => onCheckIn(ch)}
            disabled={checkedToday}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold transition-all border
              ${checkedToday
                ? 'bg-success-emerald/15 text-success-emerald border-success-emerald/30 cursor-default'
                : 'bg-accent-purple/15 text-accent-purple border-accent-purple/30 hover:bg-accent-purple hover:text-white'}`}
          >
            {checkedToday ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{checkedToday ? 'Done for Today!' : 'Mark Today Complete'}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

const EMPTY = { name: '', habitKey: 'water', duration: 30, startDate: todayKey() };

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY);

  const load = async () => setChallenges((await db.challenges.toArray()).reverse());
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    const start = new Date(form.startDate);
    const end   = new Date(start);
    end.setDate(end.getDate() + form.duration - 1);
    await db.challenges.add({
      name:      form.name.trim(),
      habitKey:  form.habitKey,
      startDate: form.startDate,
      endDate:   end.toISOString().split('T')[0],
      duration:  form.duration,
      completions: [],
      active:    true,
      createdAt: new Date().toISOString()
    });
    setShowForm(false); setForm(EMPTY); load();
  };

  const del = async (id) => { await db.challenges.delete(id); load(); };

  const checkIn = async (ch) => {
    const today = todayKey();
    if ((ch.completions || []).includes(today)) return;
    await db.challenges.update(ch.id, { completions: [...(ch.completions || []), today] });
    load();
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Challenges</h1>
          <p className="text-sm text-text-muted mt-1">Join a habit challenge and check in every day to complete it.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-accent-purple hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent-purple/20">
          <Plus className="h-4 w-4" /><span>New Challenge</span>
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-12 text-center space-y-3">
          <Swords className="h-12 w-12 text-text-muted/20 mx-auto" />
          <p className="text-sm text-text-muted">No challenges yet. Start your first one!</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 bg-accent-purple text-white text-xs font-bold px-4 py-2 rounded-xl">
            <Plus className="h-3.5 w-3.5" /><span>Create Challenge</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {challenges.map(ch => <ChallengeCard key={ch.id} ch={ch} onDelete={del} onCheckIn={checkIn} />)}
          </AnimatePresence>
        </div>
      )}

      {/* Create drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface-dark border-l border-border-slate/60 z-50 overflow-y-auto shadow-2xl">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-text-white font-outfit">New Challenge</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 text-text-muted hover:text-text-white hover:bg-border-slate/30 rounded-xl"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Challenge Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder='e.g. "30-Day Walking Challenge"'
                    className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Focus Habit</label>
                  <select value={form.habitKey} onChange={e => setForm(f => ({ ...f, habitKey: e.target.value }))}
                    className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white focus:outline-none focus:border-accent-purple">
                    {Object.entries(HABIT_OPTIONS).map(([k, h]) => <option key={k} value={k}>{h.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATIONS.map(d => (
                      <button key={d} onClick={() => setForm(f => ({ ...f, duration: d }))}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${form.duration === d ? 'bg-accent-purple text-white border-accent-purple' : 'border-border-slate text-text-muted hover:border-accent-purple/50'}`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white focus:outline-none focus:border-accent-purple" />
                </div>

                <div className="bg-accent-purple/10 border border-accent-purple/20 rounded-xl p-4 text-xs text-text-muted">
                  <span className="font-bold text-accent-purple">How it works: </span>
                  Check in every day by tapping "Mark Today Complete". Build a {form.duration}-day streak!
                </div>

                <div className="flex space-x-3">
                  <button onClick={save}
                    disabled={!form.name.trim()}
                    className="flex-1 bg-accent-purple hover:bg-accent-hover disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                    Start Challenge
                  </button>
                  <button onClick={() => setShowForm(false)}
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
