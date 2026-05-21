import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db.js';
import {
  Apple, Search, Plus, Trash2, X,
  Flame, Beef, Wheat, Droplets, BarChart2
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function todayKey() { return new Date().toISOString().split('T')[0]; }

// Simple Open Food Facts search (free, no API key)
async function searchFood(query) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=true&page_size=8&fields=product_name,nutriments`;
    const res  = await fetch(url);
    const json = await res.json();
    return (json.products || []).map(p => ({
      name:     p.product_name || 'Unknown',
      calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
      protein:  Math.round(p.nutriments?.proteins_100g || 0),
      carbs:    Math.round(p.nutriments?.carbohydrates_100g || 0),
      fat:      Math.round(p.nutriments?.fat_100g || 0),
    })).filter(p => p.name && p.calories > 0);
  } catch { return []; }
}

const PRESET_FOODS = [
  { name: 'Boiled Egg',      calories: 78,  protein: 6,  carbs: 1,  fat: 5  },
  { name: 'White Rice (1c)', calories: 206, protein: 4,  carbs: 45, fat: 0  },
  { name: 'Chicken Breast',  calories: 165, protein: 31, carbs: 0,  fat: 4  },
  { name: 'Banana',          calories: 89,  protein: 1,  carbs: 23, fat: 0  },
  { name: 'Whole Milk (1c)', calories: 149, protein: 8,  carbs: 12, fat: 8  },
  { name: 'Brown Bread (1)', calories: 69,  protein: 4,  carbs: 12, fat: 1  },
  { name: 'Dal (1 cup)',     calories: 182, protein: 13, carbs: 30, fat: 1  },
  { name: 'Oats (1/2c)',     calories: 150, protein: 5,  carbs: 27, fat: 3  },
];

const MACRO_COLORS = { calories:'#EF4444', protein:'#3B82F6', carbs:'#F59E0B', fat:'#10B981' };

export default function FoodTracker() {
  const [todayLogs, setTodayLogs] = useState([]);
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [manual, setManual]       = useState({ name:'', calories:'', protein:'', carbs:'', fat:'', grams:'100' });
  const [mode, setMode]           = useState('search'); // 'search' | 'manual' | 'presets'
  const debounceRef = useRef(null);

  const load = async () => {
    const today = todayKey();
    setTodayLogs(await db.foodLogs.where('date').equals(today).toArray());
  };
  useEffect(() => { load(); }, []);

  const doSearch = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const r = await searchFood(q);
    setResults(r); setSearching(false);
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(e.target.value), 600);
  };

  const addFood = async (food) => {
    await db.foodLogs.add({ ...food, date: todayKey(), loggedAt: Date.now() });
    load(); setShowAdd(false); setResults([]); setQuery('');
  };

  const addManual = async () => {
    if (!manual.name.trim()) return;
    const grams = parseFloat(manual.grams) || 100;
    const factor = grams / 100;
    await db.foodLogs.add({
      name:     manual.name.trim(),
      calories: Math.round((parseFloat(manual.calories) || 0) * factor),
      protein:  Math.round((parseFloat(manual.protein)  || 0) * factor),
      carbs:    Math.round((parseFloat(manual.carbs)    || 0) * factor),
      fat:      Math.round((parseFloat(manual.fat)      || 0) * factor),
      date:     todayKey(),
      loggedAt: Date.now(),
    });
    load(); setShowAdd(false);
    setManual({ name:'', calories:'', protein:'', carbs:'', fat:'', grams:'100' });
  };

  const del = async (id) => { await db.foodLogs.delete(id); load(); };

  const totals = todayLogs.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein:  acc.protein  + (f.protein  || 0),
    carbs:    acc.carbs    + (f.carbs    || 0),
    fat:      acc.fat      + (f.fat      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const pieData = [
    { name: 'Protein',  value: totals.protein * 4, color: MACRO_COLORS.protein },
    { name: 'Carbs',    value: totals.carbs   * 4, color: MACRO_COLORS.carbs   },
    { name: 'Fat',      value: totals.fat     * 9, color: MACRO_COLORS.fat     },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Food Tracker</h1>
          <p className="text-sm text-text-muted mt-1">Log meals, search foods, and track your daily macros.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center space-x-2 bg-accent-purple hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent-purple/20 shrink-0">
          <Plus className="h-4 w-4" /><span>Add Food</span>
        </button>
      </div>

      {/* Macro summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pie */}
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 flex flex-col items-center">
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} dataKey="value" strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} kcal`, '']} contentStyle={{ borderRadius: 10, fontSize: 11, background: 'var(--color-surface-dark)', border: '1px solid var(--color-border-slate)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center space-x-3 mt-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[9px] text-text-muted">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <Apple className="h-8 w-8 text-text-muted/20" />
            </div>
          )}
        </div>

        {/* Macro numbers */}
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 space-y-2">
          {[
            { label: 'Calories', val: totals.calories, unit: 'kcal', color: MACRO_COLORS.calories, Icon: Flame  },
            { label: 'Protein',  val: totals.protein,  unit: 'g',    color: MACRO_COLORS.protein,  Icon: Beef   },
            { label: 'Carbs',    val: totals.carbs,    unit: 'g',    color: MACRO_COLORS.carbs,    Icon: Wheat  },
            { label: 'Fat',      val: totals.fat,      unit: 'g',    color: MACRO_COLORS.fat,      Icon: Droplets},
          ].map(({ label, val, unit, color, Icon }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-text-muted">
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                <span>{label}</span>
              </div>
              <span className="text-xs font-extrabold text-text-white">{val}{unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's log */}
      {todayLogs.length === 0 ? (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-10 text-center space-y-3">
          <Apple className="h-10 w-10 text-text-muted/20 mx-auto" />
          <p className="text-sm text-text-muted">No food logged today.</p>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center space-x-2 bg-accent-purple text-white text-xs font-bold px-4 py-2 rounded-xl">
            <Plus className="h-3.5 w-3.5" /><span>Log Your First Meal</span>
          </button>
        </div>
      ) : (
        <div className="bg-surface-dark border border-border-slate/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-slate/40">
            <h2 className="text-sm font-extrabold text-text-white">Today's Log</h2>
          </div>
          <div className="divide-y divide-border-slate/30 max-h-80 overflow-y-auto">
            {todayLogs.map(f => (
              <div key={f.id} className="flex items-center justify-between px-5 py-3 group">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-text-white truncate">{f.name}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    {f.calories}kcal · {f.protein}g P · {f.carbs}g C · {f.fat}g F
                  </div>
                </div>
                <button onClick={() => del(f.id)} className="p-1.5 text-text-muted/0 group-hover:text-text-muted hover:text-error-red transition-all rounded-lg shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add food drawer */}
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
                  <h2 className="text-lg font-extrabold text-text-white font-outfit">Add Food</h2>
                  <button onClick={() => setShowAdd(false)} className="p-2 text-text-muted hover:text-text-white hover:bg-border-slate/30 rounded-xl"><X className="h-5 w-5" /></button>
                </div>

                {/* Mode tabs */}
                <div className="flex space-x-1.5 bg-background-dark p-1 rounded-xl">
                  {[['search','Search'],['presets','Presets'],['manual','Manual']].map(([m, label]) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === m ? 'bg-accent-purple text-white' : 'text-text-muted hover:text-text-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                {mode === 'search' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input value={query} onChange={handleQueryChange} placeholder="Search food database…"
                        className="w-full bg-background-dark border border-border-slate rounded-xl pl-9 pr-4 py-3 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple" />
                    </div>
                    {searching && <div className="text-xs text-text-muted text-center py-4">Searching…</div>}
                    {results.map((r, i) => (
                      <button key={i} onClick={() => addFood(r)}
                        className="w-full flex items-center justify-between p-3 bg-background-dark border border-border-slate rounded-xl hover:border-accent-purple/50 transition-all text-left">
                        <div>
                          <div className="text-xs font-bold text-text-white">{r.name}</div>
                          <div className="text-[10px] text-text-muted">{r.calories}kcal · {r.protein}g P · {r.carbs}g C · {r.fat}g F <span className="text-text-muted/40">per 100g</span></div>
                        </div>
                        <Plus className="h-4 w-4 text-accent-purple shrink-0" />
                      </button>
                    ))}
                    {!searching && query && results.length === 0 && (
                      <p className="text-xs text-text-muted text-center py-4">No results. Try a different search term or use manual entry.</p>
                    )}
                  </div>
                )}

                {/* Presets */}
                {mode === 'presets' && (
                  <div className="space-y-2">
                    {PRESET_FOODS.map((f, i) => (
                      <button key={i} onClick={() => addFood(f)}
                        className="w-full flex items-center justify-between p-3 bg-background-dark border border-border-slate rounded-xl hover:border-accent-purple/50 transition-all text-left">
                        <div>
                          <div className="text-xs font-bold text-text-white">{f.name}</div>
                          <div className="text-[10px] text-text-muted">{f.calories}kcal · {f.protein}g P · {f.carbs}g C · {f.fat}g F</div>
                        </div>
                        <Plus className="h-4 w-4 text-accent-purple shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Manual */}
                {mode === 'manual' && (
                  <div className="space-y-3">
                    <input value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} placeholder="Food name"
                      className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple" />
                    <div className="grid grid-cols-2 gap-3">
                      {[['calories','Calories (kcal)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)'],['grams','Serving size (g)']].map(([k, label]) => (
                        <div key={k}>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted block mb-1">{label}</label>
                          <input type="number" value={manual[k]} onChange={e => setManual(p => ({ ...p, [k]: e.target.value }))}
                            className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple" />
                        </div>
                      ))}
                    </div>
                    <button onClick={addManual} disabled={!manual.name.trim()}
                      className="w-full bg-accent-purple hover:bg-accent-hover disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                      Add Food
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
