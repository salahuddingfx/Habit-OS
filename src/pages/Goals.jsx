import React, { useState } from 'react';
import { useGoalStore, getDateKey } from '../store/goalStore.js';
import { useAuthStore } from '../store/authStore.js';
import { db } from '../services/db.js';
import {
  Plus, Target, CheckCircle2, Award, Circle, Clock,
  Droplets, Footprints, Bed, Flame, Dumbbell, Egg,
  ChevronRight, SkipForward, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Icons and colours per habit type
const HABIT_META = {
  water:     { label: 'Water',    unit: 'ml',    icon: Droplets,   color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30'    },
  sleep:     { label: 'Sleep',    unit: 'hrs',   icon: Bed,        color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30'  },
  steps:     { label: 'Steps',    unit: 'steps', icon: Footprints, color: 'text-accent-purple', bg: 'bg-accent-purple/10', border: 'border-accent-purple/30' },
  nutrition: { label: 'Calories', unit: 'kcal',  icon: Flame,      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  protein:   { label: 'Protein',  unit: 'g',     icon: Egg,        color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30'  },
  workouts:  { label: 'Exercise', unit: 'min',   icon: Dumbbell,   color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30'    }
};

// Status label and style
const STATUS = {
  done:        { label: 'Done',        color: 'text-success-emerald', bg: 'bg-success-emerald/10', border: 'border-success-emerald/40' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400',      bg: 'bg-yellow-400/10',      border: 'border-yellow-400/40'      },
  skipped:     { label: 'Skipped',     color: 'text-text-muted',      bg: 'bg-border-slate/30',    border: 'border-border-slate/50'    },
  not_started: { label: 'Not Started', color: 'text-text-muted/50',   bg: 'transparent',           border: 'border-border-slate/30'    }
};

function getStatus(goal) {
  if (goal.progress >= 100) return 'done';
  if (goal.progress > 0) return 'in_progress';
  if (goal.skipped) return 'skipped';
  return 'not_started';
}

function HabitCard({ goal, onLog, onSkip, onReset }) {
  const [logInput, setLogInput] = useState('');
  const [expanded, setExpanded] = useState(false);

  const meta = HABIT_META[goal.category] || HABIT_META.water;
  const Icon = meta.icon;
  const status = getStatus(goal);
  const statusInfo = STATUS[status];

  const handleLog = () => {
    const val = Number(logInput);
    if (!val || val <= 0) return;
    onLog(goal.category, goal.type, val);
    setLogInput('');
    setExpanded(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface-dark rounded-2xl border ${statusInfo.border} p-5 space-y-4 transition-all`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.color} border ${meta.border}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-text-white">{meta.label}</div>
            <div className="text-[10px] text-text-muted mt-0.5">
              {goal.currentValue} / {goal.targetValue} {meta.unit}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border`}>
          {status === 'done'        && <CheckCircle2 className="h-3 w-3" />}
          {status === 'in_progress' && <Clock className="h-3 w-3" />}
          {status === 'skipped'     && <SkipForward className="h-3 w-3" />}
          {status === 'not_started' && <Circle className="h-3 w-3" />}
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-border-slate/20 h-2 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${meta.color.replace('text-', 'bg-')}`}
          initial={{ width: 0 }}
          animate={{ width: `${goal.progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-muted">
        <span>{goal.progress}% complete</span>
        {goal.xpReward && <span className="flex items-center space-x-1 text-accent-purple"><Award className="h-3 w-3" /><span>+{goal.xpReward} XP on finish</span></span>}
      </div>

      {/* Action buttons */}
      {status !== 'done' && status !== 'skipped' && (
        <div className="flex space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 bg-accent-purple hover:bg-accent-hover text-white text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center space-x-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Progress</span>
          </button>
          <button
            onClick={() => onSkip(goal)}
            className="px-3 py-2 bg-border-slate/30 hover:bg-border-slate/60 text-text-muted hover:text-text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1"
            title="Mark as skipped"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {status === 'skipped' && (
        <button
          onClick={() => onReset(goal)}
          className="w-full bg-border-slate/20 hover:bg-border-slate/40 text-text-muted hover:text-text-white text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center space-x-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Undo Skip</span>
        </button>
      )}

      {/* Expand log input */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex space-x-2"
          >
            <input
              type="number"
              placeholder={`Amount in ${meta.unit}`}
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLog()}
              className="flex-1 bg-background-dark border border-border-slate rounded-xl px-3 py-2 text-xs text-text-white focus:outline-none focus:border-accent-purple"
              autoFocus
            />
            <button
              onClick={handleLog}
              className="px-4 py-2 bg-success-emerald/80 hover:bg-success-emerald text-white text-xs font-bold rounded-xl transition-all"
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Goals() {
  const { goals, logValue } = useGoalStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('daily');
  const [category, setCategory] = useState('water');
  const [targetValue, setTargetValue] = useState('');
  const [habitName, setHabitName] = useState('');

  const dateKey = getDateKey(activeTab);
  const filteredGoals = goals.filter(g => g.type === activeTab && g.dateKey === dateKey);

  const categories = Object.entries(HABIT_META).map(([id, m]) => ({
    id,
    label: m.label,
    unit: m.unit
  }));

  const defaultTargets = { water: 2500, sleep: 8, steps: 10000, nutrition: 2000, protein: 140, workouts: 45 };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!targetValue) return;
    logValue(category, activeTab, 0, Number(targetValue));
    setTargetValue('');
    setHabitName('');
  };

  const handleSkip = async (goal) => {
    const { loadLocalGoals } = useGoalStore.getState();
    await db.goals.put({ ...goal, skipped: true });
    await loadLocalGoals();
  };

  const handleReset = async (goal) => {
    const { loadLocalGoals } = useGoalStore.getState();
    await db.goals.put({ ...goal, skipped: false });
    await loadLocalGoals();
  };

  // Summary stats
  const doneCount = filteredGoals.filter(g => g.progress >= 100).length;
  const inProgressCount = filteredGoals.filter(g => g.progress > 0 && g.progress < 100).length;
  const skippedCount = filteredGoals.filter(g => g.skipped && g.progress === 0).length;

  const tabLabels = { daily: 'Today', weekly: 'This Week', monthly: 'This Month' };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">My Habits</h1>
        <p className="text-sm text-text-muted mt-1">Set daily, weekly, or monthly goals and track your progress.</p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-surface-dark rounded-2xl p-1 border border-border-slate/60">
        {['daily', 'weekly', 'monthly'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20'
                : 'text-text-muted hover:text-text-white'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Summary strip */}
      {filteredGoals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-success-emerald/10 border border-success-emerald/30 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-success-emerald">{doneCount}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">Done</div>
          </div>
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-yellow-400">{inProgressCount}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">In Progress</div>
          </div>
          <div className="bg-border-slate/20 border border-border-slate/40 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-text-muted">{skippedCount}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">Skipped</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Habit list */}
        <div className="lg:col-span-2 space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-10 text-center space-y-3">
              <Target className="h-10 w-10 text-text-muted/20 mx-auto" />
              <div className="text-sm text-text-muted">No habits set for {tabLabels[activeTab].toLowerCase()}.</div>
              <div className="text-xs text-text-muted/50">Use the form to add your first habit.</div>
            </div>
          ) : (
            <AnimatePresence>
              {filteredGoals.map(goal => (
                <HabitCard
                  key={goal.id}
                  goal={goal}
                  onLog={logValue}
                  onSkip={handleSkip}
                  onReset={handleReset}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Create habit form */}
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-6 space-y-5 h-fit">
          <h2 className="text-sm font-bold text-text-white font-outfit">Add a New Habit</h2>
          <p className="text-xs text-text-muted">Choose what you want to track and set your target amount.</p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Habit Type</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setTargetValue(defaultTargets[e.target.value] || '');
                }}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-xs text-text-white focus:outline-none focus:border-accent-purple transition-all"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                My Target ({HABIT_META[category]?.unit})
              </label>
              <input
                type="number"
                placeholder={`e.g. ${defaultTargets[category]}`}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-xs text-text-white focus:outline-none focus:border-accent-purple transition-all"
                required
              />
            </div>

            <div className="p-3 bg-accent-purple/5 border border-accent-purple/20 rounded-xl text-[10px] text-text-muted space-y-1">
              <div className="font-bold text-accent-purple">Plan: {tabLabels[activeTab]}</div>
              <div>Tracking: <span className="text-text-white">{HABIT_META[category]?.label}</span></div>
              <div>Goal: <span className="text-text-white">{targetValue || '—'} {HABIT_META[category]?.unit}</span></div>
            </div>

            <button
              type="submit"
              className="w-full bg-accent-purple hover:bg-accent-hover text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-accent-purple/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Habit</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
