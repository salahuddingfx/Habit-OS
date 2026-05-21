import React, { useState, useEffect } from 'react';
import { db } from '../services/db.js';
import {
  Frown, Meh, Smile, Laugh, Zap, Plus, Calendar,
  TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
  { score: 1, Icon: Frown,  label: 'Rough',     color: '#EF4444' },
  { score: 2, Icon: Meh,   label: 'Meh',        color: '#F97316' },
  { score: 3, Icon: Smile, label: 'Okay',        color: '#F59E0B' },
  { score: 4, Icon: Laugh, label: 'Good',        color: '#10B981' },
  { score: 5, Icon: Zap,   label: 'Amazing',     color: '#7C3AED' },
];

function todayKey() { return new Date().toISOString().split('T')[0]; }

function last7Keys() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

export default function MoodTracker() {
  const [moods, setMoods]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote]         = useState('');
  const [saved, setSaved]       = useState(false);

  const load = async () => setMoods((await db.moods.orderBy('date').reverse().toArray()));
  useEffect(() => { load(); }, []);

  const todayMood = moods.find(m => m.date === todayKey());

  const save = async () => {
    if (!selected) return;
    if (todayMood) {
      await db.moods.update(todayMood.id, { score: selected, note, timestamp: Date.now() });
    } else {
      await db.moods.add({ date: todayKey(), score: selected, note, timestamp: Date.now() });
    }
    setSaved(true); load();
    setTimeout(() => setSaved(false), 2500);
  };

  // Chart data: last 14 days
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().split('T')[0];
    const entry = moods.find(m => m.date === key);
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      score: entry?.score ?? 0,
      color: entry ? (MOODS.find(m => m.score === entry.score)?.color || '#7C3AED') : 'transparent'
    };
  });

  const avg = moods.length ? (moods.reduce((s, m) => s + m.score, 0) / moods.length).toFixed(1) : '—';
  const weekAvg = (() => {
    const week = moods.filter(m => last7Keys().includes(m.date));
    return week.length ? (week.reduce((s, m) => s + m.score, 0) / week.length).toFixed(1) : '—';
  })();

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Mood Tracker</h1>
        <p className="text-sm text-text-muted mt-1">Log how you feel each day and track your emotional patterns.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 text-center">
          <div className="text-2xl font-extrabold text-accent-purple">{weekAvg}</div>
          <div className="text-xs text-text-muted mt-1">7-day avg</div>
        </div>
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 text-center">
          <div className="text-2xl font-extrabold text-text-white">{avg}</div>
          <div className="text-xs text-text-muted mt-1">All-time avg</div>
        </div>
      </div>

      {/* Log today */}
      <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-text-white">How are you feeling today?</h2>
          {todayMood && (
            <span className="text-[10px] font-bold text-success-emerald bg-success-emerald/10 border border-success-emerald/20 px-2 py-0.5 rounded-full">
              Logged today
            </span>
          )}
        </div>

        <div className="flex justify-between gap-2">
          {MOODS.map(m => {
            const Icon = m.Icon;
            const isActive = selected === m.score || (!selected && todayMood?.score === m.score);
            return (
              <button key={m.score} onClick={() => setSelected(m.score)}
                className="flex-1 flex flex-col items-center space-y-1.5 py-3 rounded-2xl border-2 transition-all"
                style={{
                  borderColor:     isActive ? m.color : 'var(--color-border-slate)',
                  backgroundColor: isActive ? m.color + '18' : 'transparent'
                }}>
                <Icon className="h-6 w-6 transition-transform" style={{ color: isActive ? m.color : 'var(--color-text-muted)', transform: isActive ? 'scale(1.15)' : 'scale(1)' }} />
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: isActive ? m.color : 'var(--color-text-muted)' }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        <textarea
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional note — what made today feel this way?"
          className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple resize-none"
        />

        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center space-x-2 py-3 bg-success-emerald/10 border border-success-emerald/30 rounded-xl text-sm text-success-emerald font-bold">
              <Smile className="h-4 w-4" /><span>Mood saved!</span>
            </motion.div>
          ) : (
            <button key="btn" onClick={save} disabled={!selected}
              className="w-full bg-accent-purple hover:bg-accent-hover disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
              {todayMood ? 'Update Today\'s Mood' : 'Save Today\'s Mood'}
            </button>
          )}
        </AnimatePresence>
      </div>

      {/* Chart */}
      {moods.length > 0 && (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-extrabold text-text-white flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-accent-purple" /><span>Last 14 Days</span>
          </h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={last14} barSize={14}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} hide />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-dark)', border: '1px solid var(--color-border-slate)', borderRadius: 12, fontSize: 11 }}
                formatter={(v) => [v ? MOODS.find(m => m.score === v)?.label : '—', 'Mood']}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {last14.map((entry, i) => <Cell key={i} fill={entry.color || '#27272A'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {moods.length > 0 && (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-slate/40">
            <h2 className="text-sm font-extrabold text-text-white">History</h2>
          </div>
          <div className="divide-y divide-border-slate/30 max-h-64 overflow-y-auto">
            {moods.map(m => {
              const mood = MOODS.find(x => x.score === m.score);
              if (!mood) return null;
              const Icon = mood.Icon;
              return (
                <div key={m.id} className="flex items-center space-x-3 px-5 py-3">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: mood.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-text-white">{mood.label}</div>
                    {m.note && <div className="text-[10px] text-text-muted truncate">{m.note}</div>}
                  </div>
                  <div className="text-[10px] text-text-muted shrink-0">{m.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
