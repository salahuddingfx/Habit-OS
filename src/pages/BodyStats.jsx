import React, { useState, useEffect } from 'react';
import { db } from '../services/db.js';
import {
  Scale, Plus, TrendingDown, TrendingUp, Minus,
  Activity, ChevronDown, ChevronUp, Trash2, X
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function todayKey() { return new Date().toISOString().split('T')[0]; }

function calcBMI(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const h = heightCm / 100;
  return (weight / (h * h)).toFixed(1);
}

function bmiCategory(bmi) {
  if (!bmi) return null;
  const v = parseFloat(bmi);
  if (v < 18.5) return { label: 'Underweight', color: '#3B82F6' };
  if (v < 25)   return { label: 'Normal',      color: '#10B981' };
  if (v < 30)   return { label: 'Overweight',  color: '#F59E0B' };
  return              { label: 'Obese',        color: '#EF4444' };
}

const STAT_FIELDS = [
  { key: 'weight',     label: 'Weight',      unit: 'kg',  placeholder: '70' },
  { key: 'heightCm',  label: 'Height',       unit: 'cm',  placeholder: '175' },
  { key: 'bodyFat',   label: 'Body Fat',     unit: '%',   placeholder: '20' },
  { key: 'muscleMass',label: 'Muscle Mass',  unit: 'kg',  placeholder: '35' },
  { key: 'waist',     label: 'Waist',        unit: 'cm',  placeholder: '80' },
  { key: 'chest',     label: 'Chest',        unit: 'cm',  placeholder: '95' },
];

const EMPTY_FORM = { weight: '', heightCm: '', bodyFat: '', muscleMass: '', waist: '', chest: '', notes: '' };

export default function BodyStats() {
  const [logs, setLogs]       = useState([]);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [metric, setMetric]   = useState('weight');

  const load = async () => setLogs((await db.bodyStats.orderBy('date').reverse().toArray()));
  useEffect(() => { load(); }, []);

  const save = async () => {
    const entry = { date: todayKey(), ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v ? parseFloat(v) : null])), notes: form.notes };
    if (isNaN(entry.weight) && !form.weight) delete entry.weight;
    const today = logs.find(l => l.date === todayKey());
    if (today) await db.bodyStats.update(today.id, entry);
    else await db.bodyStats.add(entry);
    setSaved(true); setShowForm(false); load();
    setTimeout(() => setSaved(false), 2500);
  };

  const del = async (id) => { await db.bodyStats.delete(id); load(); };

  const latest = logs[0];
  const prev   = logs[1];
  const bmi    = latest ? calcBMI(latest.weight, latest.heightCm) : null;
  const bmiCat = bmiCategory(bmi);

  const chartData = [...logs].reverse().slice(-30).map(l => ({
    date: l.date.slice(5),
    value: l[metric] ?? null
  })).filter(d => d.value !== null);

  const delta = (key) => {
    if (!latest || !prev || !latest[key] || !prev[key]) return null;
    return (latest[key] - prev[key]).toFixed(1);
  };

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Body Stats</h1>
          <p className="text-sm text-text-muted mt-1">Track your weight, measurements, and body composition over time.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-accent-purple hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent-purple/20 shrink-0">
          <Plus className="h-4 w-4" /><span>Log Today</span>
        </button>
      </div>

      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'weight', label: 'Weight', unit: 'kg' },
            { key: 'bodyFat', label: 'Body Fat', unit: '%' },
            { key: 'muscleMass', label: 'Muscle', unit: 'kg' },
            { key: 'waist', label: 'Waist', unit: 'cm' },
          ].map(({ key, label, unit }) => {
            const val = latest[key];
            const d   = delta(key);
            if (val === null || val === undefined) return null;
            return (
              <div key={key} className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 space-y-1">
                <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{label}</div>
                <div className="text-xl font-extrabold text-text-white">{val}<span className="text-xs text-text-muted font-normal ml-0.5">{unit}</span></div>
                {d !== null && (
                  <div className={`flex items-center space-x-1 text-[10px] font-bold ${parseFloat(d) < 0 ? 'text-success-emerald' : parseFloat(d) > 0 ? 'text-error-red' : 'text-text-muted'}`}>
                    {parseFloat(d) < 0 ? <TrendingDown className="h-3 w-3" /> : parseFloat(d) > 0 ? <TrendingUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    <span>{d > 0 ? '+' : ''}{d}</span>
                  </div>
                )}
              </div>
            );
          }).filter(Boolean)}
        </div>
      )}

      {/* BMI */}
      {bmi && (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-5 flex items-center space-x-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center border-2 shrink-0"
            style={{ backgroundColor: bmiCat.color + '18', borderColor: bmiCat.color + '40' }}>
            <Scale className="h-6 w-6" style={{ color: bmiCat.color }} />
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">BMI</div>
            <div className="text-2xl font-extrabold text-text-white">{bmi}</div>
            <div className="text-xs font-bold mt-0.5" style={{ color: bmiCat.color }}>{bmiCat.label}</div>
          </div>
          <div className="flex-1 ml-4">
            <div className="h-2 w-full rounded-full overflow-hidden bg-border-slate/40 relative">
              <div className="h-full absolute left-0 rounded-full" style={{ width: `${Math.min(100, ((parseFloat(bmi) - 10) / 30) * 100)}%`, backgroundColor: bmiCat.color }} />
            </div>
            <div className="flex justify-between text-[9px] text-text-muted mt-1">
              <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-extrabold text-text-white">Progress Chart</h2>
            <div className="flex flex-wrap gap-1.5">
              {STAT_FIELDS.filter(f => f.key !== 'heightCm').map(f => (
                <button key={f.key} onClick={() => setMetric(f.key)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${metric === f.key ? 'bg-accent-purple text-white border-accent-purple' : 'border-border-slate text-text-muted hover:border-accent-purple/50'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-slate)" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-dark)', border: '1px solid var(--color-border-slate)', borderRadius: 12, fontSize: 11 }} />
              <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 3 }} activeDot={{ r: 5 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {logs.length > 0 && (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-slate/40 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-text-white">Log History</h2>
            <span className="text-xs text-text-muted">{logs.length} entries</span>
          </div>
          <div className="divide-y divide-border-slate/30 max-h-72 overflow-y-auto">
            {logs.map(l => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3 group">
                <div>
                  <div className="text-xs font-bold text-text-white">{l.date}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    {[l.weight && `${l.weight}kg`, l.bodyFat && `${l.bodyFat}% fat`, l.muscleMass && `${l.muscleMass}kg muscle`].filter(Boolean).join(' · ') || 'No measurements'}
                  </div>
                </div>
                <button onClick={() => del(l.id)} className="p-1.5 text-text-muted/0 group-hover:text-text-muted hover:text-error-red transition-all rounded-lg">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-12 text-center space-y-3">
          <Scale className="h-12 w-12 text-text-muted/20 mx-auto" />
          <p className="text-sm text-text-muted">No body stats logged yet.</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center space-x-2 bg-accent-purple text-white text-xs font-bold px-4 py-2 rounded-xl">
            <Plus className="h-3.5 w-3.5" /><span>Log Your First Entry</span>
          </button>
        </div>
      )}

      {/* Log drawer */}
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
                  <h2 className="text-lg font-extrabold text-text-white font-outfit">Log Today's Stats</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 text-text-muted hover:text-text-white hover:bg-border-slate/30 rounded-xl"><X className="h-5 w-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {STAT_FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted block mb-1">{f.label} ({f.unit})</label>
                      <input type="number" step="0.1" value={form[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple" />
                    </div>
                  ))}
                </div>
                {form.weight && form.heightCm && (
                  <div className="bg-accent-purple/10 border border-accent-purple/20 rounded-xl p-3 text-sm">
                    <span className="text-text-muted">Calculated BMI: </span>
                    <span className="font-bold text-accent-purple">{calcBMI(form.weight, form.heightCm)}</span>
                    {bmiCategory(calcBMI(form.weight, form.heightCm)) && (
                      <span className="text-xs ml-2" style={{ color: bmiCategory(calcBMI(form.weight, form.heightCm)).color }}>
                        ({bmiCategory(calcBMI(form.weight, form.heightCm)).label})
                      </span>
                    )}
                  </div>
                )}
                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes (optional)..."
                  className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple resize-none" />
                <div className="flex space-x-3">
                  <button onClick={save} className="flex-1 bg-accent-purple hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition-all">Save Entry</button>
                  <button onClick={() => setShowForm(false)} className="px-5 py-3 bg-border-slate/20 hover:bg-border-slate/40 text-text-muted font-bold rounded-xl transition-all">Cancel</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
