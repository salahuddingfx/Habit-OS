import React, { useState, useEffect } from 'react';
import { db } from '../services/db.js';
import { useGoalStore, getDateKey } from '../store/goalStore.js';
import {
  Plus, Trash2, CheckCircle2, PlayCircle, Edit3,
  Droplets, Footprints, Bed, Flame, Dumbbell, Egg,
  ChevronDown, ChevronUp, X, Sparkles, ClipboardList,
  Calendar, Tag, Palette, TrendingUp, Save,
  Target, BookOpen, Brain, Coffee, Music, Pen,
  Star, Heart, Sun, Zap, Award, Leaf, Timer,
  Smartphone, Camera, Bike, Wind, Apple, Pill,
  MapPin, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Built-in habits with Lucide icons ──────────────────────────────────────
const BUILTIN = {
  water:     { label: 'Water',    unit: 'ml',    Icon: Droplets, color: '#3B82F6', defaultTarget: 2500  },
  sleep:     { label: 'Sleep',    unit: 'hrs',   Icon: Bed,      color: '#6366F1', defaultTarget: 8     },
  steps:     { label: 'Steps',    unit: 'steps', Icon: Footprints,color:'#7C3AED', defaultTarget: 10000 },
  nutrition: { label: 'Calories', unit: 'kcal',  Icon: Flame,    color: '#10B981', defaultTarget: 2000  },
  protein:   { label: 'Protein',  unit: 'g',     Icon: Egg,      color: '#F59E0B', defaultTarget: 140   },
  workouts:  { label: 'Exercise', unit: 'min',   Icon: Dumbbell, color: '#EF4444', defaultTarget: 45    },
};

// ── Icons available for custom habits ─────────────────────────────────────
const CUSTOM_ICON_MAP = {
  Target, BookOpen, Brain, Coffee, Music, Pen, Star,
  Heart, Sun, Zap, Award, Leaf, Timer, Smartphone,
  Camera, Bike, Wind, Apple, Pill, MapPin, Sparkles, Dumbbell
};
const CUSTOM_ICON_KEYS = Object.keys(CUSTOM_ICON_MAP);

// ── Plan accent colours ────────────────────────────────────────────────────
const PLAN_COLORS   = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4','#8B5CF6'];
const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

// ── Resolve icon + meta for any habit ─────────────────────────────────────
function getHabitMeta(h) {
  if (!h.isCustom) {
    const b = BUILTIN[h.category];
    return b ? { Icon: b.Icon, label: b.label, unit: b.unit, color: b.color } : { Icon: Target, label: h.category, unit: '', color: '#7C3AED' };
  }
  const Icon = CUSTOM_ICON_MAP[h.iconKey] || Target;
  return { Icon, label: h.label, unit: h.unit, color: '#7C3AED' };
}

// ── Habit chip ────────────────────────────────────────────────────────────
function HabitChip({ habit, onRemove }) {
  const { Icon, label, unit, color } = getHabitMeta(habit);
  return (
    <div className="flex items-center space-x-2 bg-background-dark/60 border border-border-slate/60 rounded-xl px-3 py-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span className="text-text-white font-semibold">{label}</span>
      <span className="text-text-muted">{habit.target} {unit}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-text-muted/50 hover:text-error-red transition-colors ml-1">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div className="w-full h-1.5 bg-border-slate/40 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────
function PlanCard({ plan, onActivate, onDelete, onEdit, todayLogs, onLogProgress }) {
  const [expanded, setExpanded] = useState(false);
  const [progressInputs, setProgressInputs] = useState({});
  const habits = plan.habits || [];

  const handleLog = async (habit, key) => {
    const val = Number(progressInputs[key] || 0);
    if (!val) return;
    await onLogProgress(plan, { ...habit, category: key }, val);
    setProgressInputs(p => ({ ...p, [key]: '' }));
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="bg-surface-dark border border-border-slate/60 rounded-2xl overflow-hidden shadow-sm"
      style={{ borderLeftColor: plan.color, borderLeftWidth: 3 }}>

      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="text-base font-extrabold text-text-white font-outfit">{plan.name}</h3>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
              style={{ color: plan.color, borderColor: plan.color+'44', backgroundColor: plan.color+'15' }}>
              {PERIOD_LABELS[plan.period] || plan.period}
            </span>
            {plan.active && (
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-success-emerald/15 text-success-emerald border border-success-emerald/30">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">{habits.length} habit{habits.length !== 1 ? 's' : ''} · {new Date(plan.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          <button onClick={() => onEdit(plan)} className="p-2 text-text-muted hover:text-text-white hover:bg-border-slate/30 rounded-xl transition-all"><Edit3 className="h-4 w-4" /></button>
          <button onClick={() => onDelete(plan.id)} className="p-2 text-text-muted hover:text-error-red hover:bg-error-red/10 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></button>
          <button onClick={() => setExpanded(!expanded)} className="p-2 text-text-muted hover:text-text-white hover:bg-border-slate/30 rounded-xl transition-all">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Chips preview (collapsed) */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div key="exp" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="overflow-hidden">
            <div className="px-5 pb-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" /><span>Today's Progress</span>
              </div>
              {habits.map((h, i) => {
                const key = h.isCustom ? h.category : h.category;
                const { Icon, label, unit, color } = getHabitMeta(h);
                const logged = todayLogs[key] || 0;
                const pct = Math.min(100, h.target > 0 ? Math.round((logged / h.target) * 100) : 0);
                const activeColor = pct >= 100 ? '#10B981' : plan.color;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                        <span className="text-text-white font-semibold">{label}</span>
                        <span className="text-text-muted">{logged}/{h.target} {unit}</span>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: activeColor }}>{pct}%</span>
                    </div>
                    <ProgressBar value={logged} max={h.target} color={activeColor} />
                    <div className="flex space-x-2">
                      <input type="number" min="0" value={progressInputs[key] || ''}
                        onChange={e => setProgressInputs(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={`Add ${unit}…`}
                        onKeyDown={e => e.key === 'Enter' && handleLog(h, key)}
                        className="flex-1 bg-background-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple" />
                      <button onClick={() => handleLog(h, key)}
                        className="px-3 py-1.5 bg-accent-purple/15 hover:bg-accent-purple text-accent-purple hover:text-white text-xs font-bold rounded-lg transition-all border border-accent-purple/30">
                        <Save className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {habits.slice(0, 3).map((h, i) => <HabitChip key={i} habit={h} />)}
            {habits.length > 3 && (
              <button onClick={() => setExpanded(true)} className="text-[10px] text-text-muted hover:text-accent-purple transition-colors px-2 py-1 border border-border-slate/40 rounded-lg">
                +{habits.length - 3} more
              </button>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Activate */}
      <div className="px-5 pb-5">
        <button onClick={() => onActivate(plan)}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold transition-all border"
          style={{ backgroundColor: plan.color+'18', color: plan.color, borderColor: plan.color+'40' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = plan.color; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = plan.color+'18'; e.currentTarget.style.color = plan.color; }}>
          <PlayCircle className="h-4 w-4" />
          <span>{plan.active ? 'Re-apply Plan' : 'Start This Plan'}</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Plan Templates ────────────────────────────────────────────────────────
const TEMPLATES = [
  { name: 'Weight Loss',    color: '#EF4444', period: 'monthly', habits: [
    { category: 'steps',     target: 10000 }, { category: 'workouts', target: 45   },
    { category: 'nutrition', target: 1800  }, { category: 'water',    target: 3000 }
  ]},
  { name: 'Muscle Gain',   color: '#F59E0B', period: 'weekly',  habits: [
    { category: 'workouts', target: 60 }, { category: 'protein', target: 180 },
    { category: 'water',    target: 3500 }, { category: 'sleep',  target: 8  }
  ]},
  { name: 'Better Sleep',  color: '#6366F1', period: 'daily',   habits: [
    { category: 'sleep', target: 8 }, { category: 'steps', target: 8000 }, { category: 'water', target: 2000 }
  ]},
  { name: 'Study Routine', color: '#3B82F6', period: 'daily',   habits: [
    { category: 'water', target: 2000 },
    { category: 'custom_reading',       label: 'Reading',      unit: 'pages', iconKey: 'BookOpen', target: 50,  isCustom: true },
    { category: 'custom_focus_study',   label: 'Focus Study',  unit: 'min',   iconKey: 'Brain',   target: 120, isCustom: true }
  ]},
  { name: 'Hydration Reset', color: '#06B6D4', period: 'daily', habits: [
    { category: 'water', target: 3500 }, { category: 'steps', target: 6000 }
  ]},
  { name: 'Mental Wellness', color: '#8B5CF6', period: 'daily', habits: [
    { category: 'sleep', target: 7 },
    { category: 'custom_meditation', label: 'Meditation', unit: 'min', iconKey: 'Sparkles', target: 20, isCustom: true },
    { category: 'custom_journaling', label: 'Journaling', unit: 'min', iconKey: 'Pen',      target: 15, isCustom: true }
  ]},
  { name: "Runner's Plan", color: '#10B981', period: 'weekly',  habits: [
    { category: 'steps',    target: 50000 }, { category: 'workouts', target: 90 }, { category: 'water', target: 3000 }
  ]},
  { name: 'Clean Eating',  color: '#EC4899', period: 'monthly', habits: [
    { category: 'nutrition', target: 2000 }, { category: 'protein', target: 140 }, { category: 'water', target: 2500 }
  ]},
];

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', period: 'monthly', color: PLAN_COLORS[0], habits: [] };

export default function Plans() {
  const { logValue, goals } = useGoalStore();
  const [tab, setTab]         = useState('mine'); // 'mine' | 'templates'
  const [plans, setPlans]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [activatedPlan, setActivatedPlan] = useState(null);

  // Builtin habit add state
  const [habitMode, setHabitMode]   = useState('builtin');
  const [newCategory, setNewCategory] = useState('water');
  const [newTarget, setNewTarget]   = useState('');

  // Custom habit add state
  const [customLabel, setCustomLabel]   = useState('');
  const [customUnit, setCustomUnit]     = useState('');
  const [customIconKey, setCustomIconKey] = useState('Target');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [formError, setFormError] = useState('');

  const loadPlans = async () => setPlans((await db.plans.toArray()).reverse());
  useEffect(() => { loadPlans(); }, []);

  const todayKey  = getDateKey(new Date());
  const todayLogs = {};
  goals.filter(g => g.dateKey === todayKey).forEach(g => { todayLogs[g.category] = g.currentValue || 0; });

  const resetHabitInputs = () => {
    setHabitMode('builtin'); setNewCategory('water'); setNewTarget('');
    setCustomLabel(''); setCustomUnit(''); setCustomIconKey('Target');
    setShowIconPicker(false); setFormError('');
  };

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); resetHabitInputs(); setShowForm(true); };
  const openEdit   = (plan) => { setEditId(plan.id); setForm({ name: plan.name, period: plan.period, color: plan.color, habits: [...plan.habits] }); resetHabitInputs(); setShowForm(true); };

  const addHabitToForm = () => {
    setFormError('');
    if (habitMode === 'builtin') {
      const target  = Number(newTarget) || BUILTIN[newCategory].defaultTarget;
      const updated = [...form.habits];
      const idx     = updated.findIndex(h => !h.isCustom && h.category === newCategory);
      if (idx >= 0) updated[idx] = { category: newCategory, target };
      else updated.push({ category: newCategory, target });
      setForm(f => ({ ...f, habits: updated }));
      setNewTarget('');
    } else {
      if (!customLabel.trim()) { setFormError('Please enter a habit name.'); return; }
      if (!customUnit.trim())  { setFormError('Please enter a unit (e.g. min, pages).'); return; }
      const target  = Number(newTarget) || 1;
      const slugKey = 'custom_' + customLabel.trim().toLowerCase().replace(/\s+/g, '_');
      const habit   = { category: slugKey, label: customLabel.trim(), unit: customUnit.trim(), iconKey: customIconKey, target, isCustom: true };
      const updated = [...form.habits];
      const idx     = updated.findIndex(h => h.isCustom && h.category === slugKey);
      if (idx >= 0) updated[idx] = habit; else updated.push(habit);
      setForm(f => ({ ...f, habits: updated }));
      setCustomLabel(''); setCustomUnit(''); setNewTarget(''); setCustomIconKey('Target');
    }
  };

  const savePlan = async () => {
    if (!form.name.trim() || form.habits.length === 0) return;
    const data = {
      name: form.name.trim(), period: form.period, color: form.color, habits: form.habits,
      active:    editId ? (plans.find(p => p.id === editId)?.active || false) : false,
      createdAt: editId ? (plans.find(p => p.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    if (editId) await db.plans.update(editId, data);
    else await db.plans.add(data);
    setShowForm(false); setEditId(null); loadPlans();
  };

  const deletePlan = async (id) => { await db.plans.delete(id); loadPlans(); };

  const activatePlan = async (plan) => {
    for (const habit of plan.habits) await logValue(habit.category, plan.period, 0, habit.target);
    await db.plans.update(plan.id, { active: true });
    setActivatedPlan(plan.name); loadPlans();
    setTimeout(() => setActivatedPlan(null), 3500);
  };

  const logProgress = async (plan, habit, value) => {
    await logValue(habit.category, plan.period, value, habit.target);
    loadPlans();
  };

  return (
    <div className="space-y-6 pb-16">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">My Plans</h1>
          <p className="text-sm text-text-muted mt-1">Build custom habit plans, log daily progress, and stay on target.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center space-x-2 bg-accent-purple hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent-purple/20 shrink-0">
          <Plus className="h-4 w-4" /><span>New Plan</span>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex space-x-1 bg-surface-dark border border-border-slate/60 p-1 rounded-xl w-fit">
        {[['mine','My Plans'],['templates','Templates']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t ? 'bg-accent-purple text-white shadow' : 'text-text-muted hover:text-text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {activatedPlan && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="flex items-center space-x-3 bg-success-emerald/10 border border-success-emerald/30 rounded-2xl px-5 py-3 text-sm text-success-emerald">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span><strong>"{activatedPlan}"</strong> is now active — expand a card to log today's progress!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TEMPLATES TAB ── */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl, i) => (
            <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
              className="bg-surface-dark border border-border-slate/60 rounded-2xl overflow-hidden shadow-sm"
              style={{ borderLeftColor: tpl.color, borderLeftWidth: 3 }}>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-text-white font-outfit text-sm">{tpl.name}</h3>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mt-1 inline-block"
                      style={{ color: tpl.color, borderColor: tpl.color+'44', backgroundColor: tpl.color+'15' }}>
                      {PERIOD_LABELS[tpl.period]}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted">{tpl.habits.length} habits</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.habits.map((h, j) => {
                    const meta = getHabitMeta(h);
                    return (
                      <span key={j} className="flex items-center space-x-1 text-[9px] font-semibold px-2 py-0.5 rounded-lg bg-background-dark/60 border border-border-slate/40 text-text-muted">
                        <meta.Icon className="h-2.5 w-2.5" style={{ color: meta.color }} />
                        <span>{meta.label}</span>
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    setForm({ name: tpl.name, period: tpl.period, color: tpl.color, habits: tpl.habits });
                    setEditId(null); resetHabitInputs(); setShowForm(true); setTab('mine');
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all border"
                  style={{ color: tpl.color, borderColor: tpl.color+'40', backgroundColor: tpl.color+'10' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = tpl.color; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = tpl.color+'10'; e.currentTarget.style.color = tpl.color; }}
                >
                  <Plus className="h-3.5 w-3.5" /><span>Use This Template</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── MY PLANS TAB ── */}
      {tab === 'mine' && (
        <>
          {/* Empty state */}
          {plans.length === 0 ? (
            <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-12 text-center space-y-4">
              <ClipboardList className="h-12 w-12 text-text-muted/20 mx-auto" />
              <div className="text-sm text-text-muted">No plans yet.</div>
              <div className="text-xs text-text-muted/50">Create your own or pick a template to get started!</div>
              <div className="flex items-center justify-center space-x-3 mt-2">
                <button onClick={openCreate}
                  className="inline-flex items-center space-x-2 bg-accent-purple hover:bg-accent-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
                  <Plus className="h-3.5 w-3.5" /><span>Create Plan</span>
                </button>
                <button onClick={() => setTab('templates')}
                  className="inline-flex items-center space-x-2 border border-accent-purple/40 text-accent-purple text-xs font-bold px-4 py-2 rounded-xl hover:bg-accent-purple/10 transition-all">
                  <Sparkles className="h-3.5 w-3.5" /><span>Browse Templates</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AnimatePresence>
                {plans.map(plan => (
                  <PlanCard key={plan.id} plan={plan} todayLogs={todayLogs}
                    onActivate={activatePlan} onDelete={deletePlan}
                    onEdit={openEdit} onLogProgress={logProgress} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* ══ DRAWER ══ */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />

            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', damping:28, stiffness:280 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-surface-dark border-l border-border-slate/60 z-50 overflow-y-auto shadow-2xl">

              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-surface-dark pb-3 border-b border-border-slate/30 z-10">
                  <h2 className="text-lg font-extrabold text-text-white font-outfit">{editId ? 'Edit Plan' : 'Create New Plan'}</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 text-text-muted hover:text-text-white hover:bg-border-slate/30 rounded-xl transition-all">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center space-x-1"><Tag className="h-3 w-3" /><span>Plan Name</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder='e.g. "My Fitness Month"'
                    className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple transition-all" />
                </div>

                {/* Period */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center space-x-1"><Calendar className="h-3 w-3" /><span>Period</span></label>
                  <div className="flex space-x-2">
                    {Object.entries(PERIOD_LABELS).map(([val, label]) => (
                      <button key={val} onClick={() => setForm(f => ({ ...f, period: val }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${form.period === val ? 'bg-accent-purple text-white border-accent-purple' : 'border-border-slate text-text-muted hover:border-accent-purple/50'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colour */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center space-x-1"><Palette className="h-3 w-3" /><span>Plan Colour</span></label>
                  <div className="flex flex-wrap gap-2">
                    {PLAN_COLORS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                        className="h-7 w-7 rounded-full border-2 transition-all"
                        style={{ backgroundColor: c, borderColor: form.color === c ? '#fff' : 'transparent', transform: form.color === c ? 'scale(1.25)' : 'scale(1)' }} />
                    ))}
                  </div>
                </div>

                {/* ── Add habits ── */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center space-x-1">
                    <Sparkles className="h-3 w-3" /><span>Habits in this Plan</span>
                  </label>

                  {/* Current chips */}
                  <div className="flex flex-wrap gap-2 min-h-[36px]">
                    {form.habits.length === 0 && <span className="text-xs text-text-muted/40 italic">No habits added yet</span>}
                    {form.habits.map((h, i) => (
                      <HabitChip key={i} habit={h} onRemove={() => setForm(f => ({ ...f, habits: f.habits.filter((_, idx) => idx !== i) }))} />
                    ))}
                  </div>

                  {/* Mode toggle */}
                  <div className="flex space-x-2">
                    {[['builtin','Preset Habits'],['custom','Custom Habit']].map(([m, label]) => (
                      <button key={m} onClick={() => { setHabitMode(m); setFormError(''); }}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${habitMode === m ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/40' : 'border-border-slate text-text-muted'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Input area */}
                  <div className="bg-background-dark/60 border border-border-slate/50 rounded-xl p-4 space-y-3">
                    {habitMode === 'builtin' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-text-muted/60 block mb-1">Habit</label>
                          <select value={newCategory} onChange={e => { setNewCategory(e.target.value); setNewTarget(''); }}
                            className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none focus:border-accent-purple">
                            {Object.entries(BUILTIN).map(([k, h]) => <option key={k} value={k}>{h.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-text-muted/60 block mb-1">Target ({BUILTIN[newCategory]?.unit})</label>
                          <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)}
                            placeholder={String(BUILTIN[newCategory]?.defaultTarget)}
                            onKeyDown={e => e.key === 'Enter' && addHabitToForm()}
                            className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none focus:border-accent-purple" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Icon picker */}
                        <div>
                          <label className="text-[9px] text-text-muted/60 block mb-1">Icon</label>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => setShowIconPicker(!showIconPicker)}
                              className="h-9 w-9 bg-background-dark border border-border-slate rounded-lg flex items-center justify-center hover:border-accent-purple transition-all">
                              {React.createElement(CUSTOM_ICON_MAP[customIconKey] || Target, { className: 'h-4 w-4 text-accent-purple' })}
                            </button>
                            <span className="text-[10px] text-text-muted">Click to choose an icon</span>
                          </div>
                          {showIconPicker && (
                            <div className="mt-2 p-2 bg-background-dark border border-border-slate rounded-xl grid grid-cols-8 gap-1">
                              {CUSTOM_ICON_KEYS.map(key => {
                                const Ic = CUSTOM_ICON_MAP[key];
                                return (
                                  <button key={key} title={key}
                                    onClick={() => { setCustomIconKey(key); setShowIconPicker(false); }}
                                    className={`p-1.5 rounded-lg hover:bg-accent-purple/15 transition-all flex items-center justify-center ${customIconKey === key ? 'bg-accent-purple/20 text-accent-purple' : 'text-text-muted'}`}>
                                    <Ic className="h-4 w-4" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-text-muted/60 block mb-1">Habit Name</label>
                            <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                              placeholder='e.g. "Meditation"'
                              className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none focus:border-accent-purple" />
                          </div>
                          <div>
                            <label className="text-[9px] text-text-muted/60 block mb-1">Unit</label>
                            <input value={customUnit} onChange={e => setCustomUnit(e.target.value)}
                              placeholder='e.g. "min", "pages"'
                              className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none focus:border-accent-purple" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-text-muted/60 block mb-1">Target</label>
                          <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="e.g. 20"
                            onKeyDown={e => e.key === 'Enter' && addHabitToForm()}
                            className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none focus:border-accent-purple" />
                        </div>
                        {formError && (
                          <div className="flex items-center space-x-1.5 text-error-red text-[11px]">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{formError}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={addHabitToForm}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 bg-border-slate/30 hover:bg-accent-purple/15 hover:text-accent-purple text-text-muted text-xs font-bold rounded-lg transition-all border border-border-slate/50 hover:border-accent-purple/40">
                      <Plus className="h-3.5 w-3.5" />
                      <span>{habitMode === 'builtin' ? `Add ${BUILTIN[newCategory]?.label}` : 'Add Custom Habit'}</span>
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {form.name && form.habits.length > 0 && (
                  <div className="p-4 rounded-xl border space-y-2"
                    style={{ borderColor: form.color+'40', backgroundColor: form.color+'10' }}>
                    <div className="text-xs font-bold" style={{ color: form.color }}>Preview</div>
                    <div className="font-extrabold text-text-white text-sm">{form.name}</div>
                    <div className="text-[10px] text-text-muted">{PERIOD_LABELS[form.period]} · {form.habits.length} habit{form.habits.length !== 1 ? 's' : ''}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.habits.map((h, i) => {
                        const { Icon, label, unit } = getHabitMeta(h);
                        return (
                          <span key={i} className="flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-background-dark/60 text-text-muted">
                            <Icon className="h-3 w-3" /><span>{label} · {h.target}{unit}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 sticky bottom-0 bg-surface-dark pt-4 pb-2 border-t border-border-slate/30">
                  <button onClick={savePlan}
                    disabled={!form.name.trim() || form.habits.length === 0}
                    className="flex-1 bg-accent-purple hover:bg-accent-hover disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm py-3 rounded-xl transition-all">
                    {editId ? 'Save Changes' : 'Create Plan'}
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="px-5 py-3 bg-border-slate/20 hover:bg-border-slate/40 text-text-muted hover:text-text-white text-sm font-bold rounded-xl transition-all">
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
