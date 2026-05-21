import React, { useState, useRef, useCallback } from 'react';
import { useGoalStore } from '../store/goalStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useBadgeStore } from '../store/badgeStore.js';
import { calcStreak, lastNDays } from '../store/badgeStore.js';
import BadgeShelf from '../components/BadgeShelf.jsx';
import {
  Activity, Flame, Trophy, Zap, TrendingUp,
  Smile, Scale, LayoutDashboard, GripVertical, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ── Widget definitions ────────────────────────────────────────────────────
const WIDGET_DEFS = [
  { id: 'streak',     label: 'Streak Counter',    icon: Flame,    cols: 1 },
  { id: 'xp',         label: 'XP & Tier',         icon: Zap,      cols: 1 },
  { id: 'progress',   label: "Today's Progress",  icon: Activity, cols: 2 },
  { id: 'heatmap',    label: 'Weekly Heatmap',    icon: TrendingUp,cols: 2 },
  { id: 'badges',     label: 'Recent Badges',     icon: Trophy,   cols: 2 },
];

// ── Storage helpers ───────────────────────────────────────────────────────
const STORAGE_KEY = 'hhos_widgets';
const defaultState = () => WIDGET_DEFS.map((w, i) => ({ ...w, order: i, visible: true }));
function loadWidgets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState(); }
  catch { return defaultState(); }
}
function saveWidgets(widgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

// ── Individual Widgets ────────────────────────────────────────────────────
function StreakWidget({ goals }) {
  const streak = calcStreak(goals);
  const days   = lastNDays(7);
  const completedDays = new Set(goals.filter(g => g.completionTimestamp).map(g => g.dateKey));
  return (
    <div className="space-y-3">
      <div className="flex items-end space-x-2">
        <span className="text-5xl font-black text-accent-purple leading-none">{streak}</span>
        <div className="pb-1 space-y-0.5">
          <div className="text-xs font-bold text-text-white">day streak</div>
          <div className="text-[10px] text-text-muted">Keep it going!</div>
        </div>
      </div>
      <div className="flex space-x-1.5">
        {days.map((d, i) => {
          const done = completedDays.has(d);
          const isToday = i === 6;
          return (
            <div key={d} className="flex-1 flex flex-col items-center space-y-1">
              <div className="h-6 w-6 rounded-lg transition-all"
                style={{ backgroundColor: done ? '#7C3AED' : isToday ? 'rgba(124,58,237,0.2)' : 'var(--color-border-slate)40',
                         border: isToday ? '1.5px solid #7C3AED' : '1.5px solid transparent' }} />
              <span className="text-[8px] text-text-muted">{new Date(d).toLocaleDateString('en',{weekday:'narrow'})}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function XPWidget({ user }) {
  const xp     = user?.xp || 0;
  const tier   = user?.tier || 'Bronze';
  const next   = { Bronze: 500, Silver: 1500, Gold: 5000, Platinum: 15000, Titan: Infinity };
  const target = next[tier] || 500;
  const pct    = Math.min(100, Math.round((xp / target) * 100));
  const TIER_COLORS = { Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Platinum: '#00CED1', Titan: '#7C3AED' };
  const color  = TIER_COLORS[tier] || '#7C3AED';
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-black text-text-white">{xp.toLocaleString()}</div>
          <div className="text-[10px] text-text-muted">Total XP</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-extrabold" style={{ color }}>{tier}</div>
          <div className="text-[10px] text-text-muted">{target === Infinity ? 'Max' : `${target - xp} to next`}</div>
        </div>
      </div>
      <div className="h-2 bg-border-slate/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ProgressWidget({ goals }) {
  const todayKey = new Date().toISOString().split('T')[0];
  const todayGoals = goals.filter(g => g.dateKey === todayKey);
  const completed  = todayGoals.filter(g => g.progress >= 100).length;
  const total      = todayGoals.length;
  if (total === 0) return <div className="text-sm text-text-muted">No habits logged today yet.</div>;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{completed}/{total} habits done</span>
        <span className="font-bold text-accent-purple">{total > 0 ? Math.round((completed/total)*100) : 0}%</span>
      </div>
      <div className="h-2 bg-border-slate/40 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-accent-purple"
          initial={{ width: 0 }} animate={{ width: `${total > 0 ? (completed/total)*100 : 0}%` }} transition={{ duration: 0.6 }} />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        {todayGoals.slice(0, 4).map((g, i) => {
          const pct = Math.min(100, g.progress || 0);
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[9px]">
                <span className="text-text-muted capitalize">{g.category}</span>
                <span className="font-bold" style={{ color: pct >= 100 ? '#10B981' : '#7C3AED' }}>{pct}%</span>
              </div>
              <div className="h-1 bg-border-slate/40 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#10B981' : '#7C3AED' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeatmapWidget({ goals }) {
  const days = lastNDays(14);
  const completedDays = {};
  goals.filter(g => g.completionTimestamp).forEach(g => {
    completedDays[g.dateKey] = (completedDays[g.dateKey] || 0) + 1;
  });
  const data = days.map(d => ({ day: new Date(d).toLocaleDateString('en',{weekday:'short'}), count: completedDays[d] || 0 }));
  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} barSize={12}>
        <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'var(--color-surface-dark)', border: '1px solid var(--color-border-slate)', borderRadius: 10, fontSize: 10 }} />
        <Bar dataKey="count" radius={[4,4,0,0]}>
          {data.map((d,i) => <Cell key={i} fill={d.count > 0 ? '#7C3AED' : 'var(--color-border-slate)'} opacity={d.count > 0 ? Math.min(1, 0.4 + d.count*0.2) : 0.3} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function BadgesWidget({ unlockedKeys }) {
  return <BadgeShelf unlockedKeys={unlockedKeys} compact />;
}

// ── Widget renderer ────────────────────────────────────────────────────────
function WidgetContent({ id, goals, user, unlockedKeys }) {
  switch (id) {
    case 'streak':   return <StreakWidget goals={goals} />;
    case 'xp':       return <XPWidget user={user} />;
    case 'progress': return <ProgressWidget goals={goals} />;
    case 'heatmap':  return <HeatmapWidget goals={goals} />;
    case 'badges':   return <BadgesWidget unlockedKeys={unlockedKeys} />;
    default:         return null;
  }
}

// ── Draggable Widget Card ─────────────────────────────────────────────────
function WidgetCard({ widget, goals, user, unlockedKeys, onDragStart, onDragOver, onDrop, isDragging }) {
  const def = WIDGET_DEFS.find(d => d.id === widget.id);
  const Icon = def?.icon || Activity;
  return (
    <motion.div
      layout
      draggable
      onDragStart={() => onDragStart(widget.id)}
      onDragOver={e => { e.preventDefault(); onDragOver(widget.id); }}
      onDrop={() => onDrop(widget.id)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      className={`bg-surface-dark border border-border-slate/60 rounded-2xl p-5 space-y-4 cursor-grab active:cursor-grabbing transition-all hover-glowing-card ${widget.cols === 2 ? 'sm:col-span-2' : ''}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-accent-purple" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{def?.label}</span>
        </div>
        <GripVertical className="h-4 w-4 text-text-muted/40" />
      </div>
      <WidgetContent id={widget.id} goals={goals} user={user} unlockedKeys={unlockedKeys} />
    </motion.div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function CustomDashboard({ setActivePage }) {
  const { goals }  = useGoalStore();
  const { user }   = useAuthStore();
  const { unlockedKeys } = useBadgeStore();

  const [widgets, setWidgets]     = useState(loadWidgets);
  const [editMode, setEditMode]   = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId]       = useState(null);

  const visibleWidgets = [...widgets]
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  const allWidgets = [...widgets].sort((a, b) => a.order - b.order);

  const handleDragStart = (id) => setDraggingId(id);
  const handleDragOver  = (id) => setOverId(id);

  const handleDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setOverId(null); return; }
    const updated = [...widgets];
    const fromIdx = updated.findIndex(w => w.id === draggingId);
    const toIdx   = updated.findIndex(w => w.id === targetId);
    const fromOrder = updated[fromIdx].order;
    updated[fromIdx] = { ...updated[fromIdx], order: updated[toIdx].order };
    updated[toIdx]   = { ...updated[toIdx],   order: fromOrder };
    setWidgets(updated);
    saveWidgets(updated);
    setDraggingId(null); setOverId(null);
  };

  const toggleVisible = (id) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setWidgets(updated);
    saveWidgets(updated);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            {editMode ? 'Drag widgets to reorder. Toggle visibility with the eye button.' : `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.username || 'there'}!`}
          </p>
        </div>
        <button onClick={() => setEditMode(e => !e)}
          className={`flex items-center space-x-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all border ${
            editMode
              ? 'bg-accent-purple text-white border-accent-purple'
              : 'border-border-slate text-text-muted hover:border-accent-purple/50 hover:text-text-white'
          }`}>
          <LayoutDashboard className="h-4 w-4" />
          <span>{editMode ? 'Done' : 'Customize'}</span>
        </button>
      </div>

      {/* Edit mode: widget visibility panel */}
      <AnimatePresence>
        {editMode && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-surface-dark border border-accent-purple/30 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">Widget Visibility</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allWidgets.map(w => {
                const def  = WIDGET_DEFS.find(d => d.id === w.id);
                const Icon = def?.icon || Activity;
                return (
                  <button key={w.id} onClick={() => toggleVisible(w.id)}
                    className={`flex items-center space-x-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                      w.visible
                        ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/30'
                        : 'border-border-slate text-text-muted/50'
                    }`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{def?.label}</span>
                    {w.visible ? <Eye className="h-3 w-3 ml-auto shrink-0" /> : <EyeOff className="h-3 w-3 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widgets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AnimatePresence>
          {visibleWidgets.map(w => (
            <WidgetCard
              key={w.id}
              widget={w}
              goals={goals}
              user={user}
              unlockedKeys={unlockedKeys}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggingId === w.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {visibleWidgets.length === 0 && (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-12 text-center space-y-3">
          <LayoutDashboard className="h-12 w-12 text-text-muted/20 mx-auto" />
          <p className="text-sm text-text-muted">All widgets hidden.</p>
          <button onClick={() => setEditMode(true)} className="inline-flex items-center space-x-2 bg-accent-purple text-white text-xs font-bold px-4 py-2 rounded-xl">
            <Eye className="h-3.5 w-3.5" /><span>Show Widgets</span>
          </button>
        </div>
      )}
    </div>
  );
}
