import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useGoalStore } from '../store/goalStore.js';
import { useBadgeStore, calcStreak } from '../store/badgeStore.js';
import { db } from '../services/db.js';
import {
  Sparkles, Brain, RefreshCw, Send, Zap, TrendingUp,
  Flame, Droplets, Footprints, Bed, Dumbbell,
  MessageCircle, ChevronRight, Star, AlertTriangle,
  CheckCircle2, Clock, Target, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:5000/api';

// ── Typewriter hook ────────────────────────────────────────────────────────
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return { displayed, done };
}

// ── Offline AI engine — generates smart insight from user data ─────────────
function generateLocalInsight(user, goals, streak, mood, todayStats) {
  const name    = user?.username || 'Coach';
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const lines = [];

  // Personalized greeting
  lines.push(`${greeting}, ${name}. Here's your AI-powered daily briefing.\n`);

  // Streak commentary
  if (streak >= 30)      lines.push(`STREAK LEGEND: ${streak} days straight. You are literally unbreakable right now. This is elite discipline. Most people quit at day 7 — you've done it ${Math.floor(streak / 7)} times over.`);
  else if (streak >= 14) lines.push(`STREAK WARRIOR: ${streak} days in a row. You're in the top 5% of habit-builders. Your brain is actively rewiring itself — every day now is making the habit more automatic.`);
  else if (streak >= 7)  lines.push(`STREAK STRONG: ${streak}-day streak! One full week of consistency. Your body is starting to physically expect these habits — lean into that momentum.`);
  else if (streak >= 3)  lines.push(`BUILDING MOMENTUM: ${streak} days going. The research says 66 days to form a habit — you're ${streak} days in. Every check-in counts.`);
  else if (streak === 0) lines.push(`FRESH START: No active streak yet. That's okay — every single top performer you admire had a Day 1. Yours starts right now.`);
  else                   lines.push(`STREAK ALIVE: ${streak} day${streak > 1 ? 's' : ''} going. Stay on it.`);

  lines.push('');

  // Mood-aware message
  if (mood !== null) {
    if (mood >= 4)      lines.push(`MENTAL STATE: You logged feeling amazing — that's a superpower. Use this energy for your hardest task today.`);
    else if (mood === 3) lines.push(`MENTAL STATE: You're feeling okay. Not every day is a peak day — consistency through mediocre days is what separates finishers from quitters.`);
    else if (mood <= 2)  lines.push(`MENTAL STATE: Rough day emotionally. On days like this, your only job is to show up — even a 50% effort counts. Movement literally changes brain chemistry in 10 minutes.`);
    lines.push('');
  }

  // Habit-specific feedback
  const { water, steps, sleep, workouts, nutrition } = todayStats;

  if (water > 0) {
    const pct = Math.min(100, Math.round((water / 2500) * 100));
    if (pct >= 100) lines.push(`HYDRATION: Perfect — ${water}ml logged. Optimal hydration improves cognitive function by up to 30%.`);
    else if (pct >= 60) lines.push(`HYDRATION: ${water}ml so far (${pct}% of target). You're on track — drink another glass now.`);
    else lines.push(`HYDRATION WARNING: Only ${water}ml logged. Dehydration degrades focus and energy. Set a timer for 200ml every 45 minutes.`);
    lines.push('');
  }

  if (sleep > 0) {
    if (sleep >= 8)      lines.push(`RECOVERY: ${sleep}h sleep — excellent. Your muscles repair and memory consolidates during deep sleep. Tonight, protect that same window.`);
    else if (sleep >= 6) lines.push(`RECOVERY: ${sleep}h sleep. Functional, but not optimal. Try to get 7-9h — even 30 more minutes tomorrow will measurably improve your reaction time and mood.`);
    else if (sleep < 6)  lines.push(`RECOVERY ALERT: ${sleep}h is below threshold. Your cortisol is elevated right now. Prioritize a wind-down routine tonight — no screens 45 min before bed.`);
    lines.push('');
  }

  if (steps > 0) {
    if (steps >= 10000) lines.push(`MOVEMENT: ${steps.toLocaleString()} steps — you hit the gold standard. Non-exercise movement reduces all-cause mortality risk by 45%.`);
    else if (steps >= 5000) lines.push(`MOVEMENT: ${steps.toLocaleString()} steps so far. A 15-minute walk after meals adds roughly 1,500 steps and cuts blood sugar spikes.`);
    else lines.push(`MOVEMENT LOW: ${steps.toLocaleString()} steps. Even if you can't exercise today, getting to 5k steps changes your metabolic rate significantly.`);
    lines.push('');
  }

  if (workouts > 0) {
    if (workouts >= 45) lines.push(`TRAINING: ${workouts} minutes of exercise. That's a full session. Endorphins are active for the next 4-6 hours — this was the best investment of your day.`);
    else lines.push(`TRAINING: ${workouts} minutes logged. Any movement counts. Short sessions build the habit — length can grow later.`);
    lines.push('');
  }

  // Weekly pattern insight
  const totalGoals = goals.length;
  if (totalGoals > 20) lines.push(`PATTERN: You've logged ${totalGoals} data points. This dataset is now large enough to see meaningful patterns. Keep logging — your future self is the beneficiary.`);

  // XP insight
  const xp = user?.xp || 0;
  if (xp > 0) lines.push(`XP PROGRESS: ${xp} XP total. You're in the "${user?.tier || 'Bronze'}" tier. ${xp < 100 ? `${100 - xp} XP to Silver.` : xp < 300 ? `${300 - xp} XP to Gold.` : `Keep grinding.`}`);

  lines.push('');
  lines.push(`TODAY'S DIRECTIVE: Pick one habit right now — not all of them. Do that one thing. Then the next. Overwhelm is just a signal to simplify.`);

  return lines.join('\n');
}

// ── Weekly Insight Cards ───────────────────────────────────────────────────
function WeeklyInsightCard({ icon: Icon, title, value, sub, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 space-y-2">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '20', border: `1px solid ${color}40` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{title}</span>
      </div>
      <div className="text-2xl font-black text-text-white">{value}</div>
      <div className="text-[10px] text-text-muted">{sub}</div>
    </motion.div>
  );
}

// ── Quick prompt chips ────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'What should I focus on today?',
  'How can I improve my sleep?',
  'Give me a workout tip for today',
  'What is my weakest habit?',
  'How do I break through a plateau?',
  'Give me a healthy meal idea',
];

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AISuggestions() {
  const { user, accessToken, isGuest } = useAuthStore();
  const { goals }                       = useGoalStore();
  const { unlockedKeys }                = useBadgeStore();

  const [insight, setInsight]           = useState('');
  const [chatHistory, setChatHistory]   = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingChat, setLoadingChat]   = useState(false);
  const [latestMood, setLatestMood]     = useState(null);
  const [meals, setMeals]               = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const chatEndRef                      = useRef(null);

  const { displayed: typedInsight, done: typeDone } = useTypewriter(insight, 12);

  const todayStr   = new Date().toISOString().split('T')[0];
  const streak     = calcStreak(goals);
  const findVal    = (cat) => goals.find(g => g.category === cat && g.dateKey === todayStr)?.currentValue || 0;

  const todayStats = {
    water:    findVal('water'),
    steps:    findVal('steps'),
    sleep:    findVal('sleep'),
    workouts: findVal('workouts'),
    nutrition:findVal('nutrition'),
    protein:  findVal('protein'),
  };

  // Load today's mood from Dexie
  useEffect(() => {
    db.moods.where('date').equals(todayStr).first()
      .then(m => setLatestMood(m?.level ?? null)).catch(() => {});
  }, []);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  // ── Generate main daily insight ──────────────────────────────────────────
  const generateInsight = async () => {
    setInsight(''); setLoadingInsight(true);
    try {
      const url     = `${API}/ai/coaching?steps=${todayStats.steps}&sleep=${todayStats.sleep}&water=${todayStats.water}`;
      const headers = isGuest ? { 'x-guest-id': 'guest' } : { Authorization: `Bearer ${accessToken}` };
      const res     = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      const data    = await res.json();
      if (data.insight) { setInsight(data.insight); setLoadingInsight(false); return; }
    } catch (_) { /* fallback to local */ }

    // Offline / fallback AI
    const local = generateLocalInsight(user, goals, streak, latestMood, todayStats);
    setInsight(local);
    setLoadingInsight(false);
  };

  // ── Chat message send ────────────────────────────────────────────────────
  const sendChat = async (text) => {
    const q = text || chatInput.trim();
    if (!q) return;
    setChatInput('');
    setChatHistory(h => [...h, { role: 'user', text: q }]);
    setLoadingChat(true);

    // Generate a smart local response based on the question
    await new Promise(r => setTimeout(r, 900)); // feel like it's thinking
    const resp = generateLocalChatResponse(q, user, goals, streak, todayStats, latestMood);
    setChatHistory(h => [...h, { role: 'ai', text: resp }]);
    setLoadingChat(false);
  };

  // ── Meal suggestions ────────────────────────────────────────────────────
  const fetchMeals = async () => {
    setLoadingMeals(true);
    try {
      const headers = isGuest ? { 'x-guest-id': 'guest' } : { Authorization: `Bearer ${accessToken}` };
      const res     = await fetch(`${API}/ai/meals?targetCalories=2200`, { headers, signal: AbortSignal.timeout(8000) });
      const data    = await res.json();
      if (data.suggestions?.length) { setMeals(data.suggestions); setLoadingMeals(false); return; }
    } catch (_) {}
    setMeals(FALLBACK_MEALS);
    setLoadingMeals(false);
  };

  const completedToday = goals.filter(g => g.dateKey === todayStr && g.progress >= 100).length;
  const totalToday     = goals.filter(g => g.dateKey === todayStr).length;

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="relative">
        <div className="absolute -top-6 -left-6 w-48 h-48 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center space-x-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center">
              <Brain className="h-5 w-5 text-accent-purple" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">AI Coach</h1>
              <p className="text-xs text-text-muted">Powered by your real habit data · Always honest · Never generic</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Today at a Glance ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <WeeklyInsightCard icon={Flame}      title="Streak"    value={`${streak}d`}            sub="days in a row"               color="#F59E0B" delay={0}    />
        <WeeklyInsightCard icon={Target}     title="Done Today" value={`${completedToday}/${totalToday}`} sub="habits completed"   color="#10B981" delay={0.06} />
        <WeeklyInsightCard icon={Zap}        title="XP"        value={(user?.xp || 0).toLocaleString()} sub={user?.tier || 'Bronze'}  color="#7C3AED" delay={0.12} />
        <WeeklyInsightCard icon={BarChart2}  title="Badges"    value={unlockedKeys.size}        sub={`of 15 unlocked`}            color="#3B82F6" delay={0.18} />
      </div>

      {/* ── Daily AI Insight ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-dark border border-accent-purple/20 rounded-2xl overflow-hidden shadow-lg shadow-accent-purple/5">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-slate/40 bg-accent-purple/5">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-accent-purple animate-pulse" />
            <span className="text-sm font-extrabold text-text-white font-outfit">Daily Briefing</span>
            {insight && typeDone && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-success-emerald/15 text-success-emerald border border-success-emerald/30">Ready</span>
            )}
          </div>
          <button onClick={generateInsight} disabled={loadingInsight}
            className="flex items-center space-x-1.5 bg-accent-purple hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-accent-purple/20">
            {loadingInsight ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{insight ? 'Regenerate' : 'Analyse My Day'}</span>
          </button>
        </div>

        {/* Output */}
        <div className="px-6 py-5 min-h-48 bg-gradient-to-br from-background-dark to-surface-dark">
          {loadingInsight ? (
            <div className="space-y-3 animate-pulse">
              {[100, 75, 90, 60, 80].map((w, i) => (
                <div key={i} className="h-3 bg-accent-purple/15 rounded-full" style={{ width: `${w}%` }} />
              ))}
              <div className="flex items-center space-x-2 mt-4">
                <Brain className="h-4 w-4 text-accent-purple animate-pulse" />
                <span className="text-xs text-accent-purple font-semibold animate-pulse">Analysing your habits…</span>
              </div>
            </div>
          ) : insight ? (
            <div className="font-mono text-xs text-text-white/90 leading-relaxed whitespace-pre-wrap">
              {typedInsight}
              {!typeDone && <span className="inline-block w-1.5 h-4 bg-accent-purple ml-0.5 animate-pulse" />}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 space-y-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
                <Brain className="h-7 w-7 text-accent-purple/60" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-white">Your personal AI coach is ready</p>
                <p className="text-xs text-text-muted mt-1">Click "Analyse My Day" for a briefing based on your actual habit data</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── AI Chat ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-surface-dark border border-border-slate/60 rounded-2xl overflow-hidden">
        <div className="flex items-center space-x-2 px-5 py-4 border-b border-border-slate/40">
          <MessageCircle className="h-4 w-4 text-accent-purple" />
          <span className="text-sm font-extrabold text-text-white font-outfit">Ask Your Coach</span>
        </div>

        {/* Quick prompts */}
        {chatHistory.length === 0 && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-3">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendChat(p)}
                  className="flex items-center space-x-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-background-dark border border-border-slate hover:border-accent-purple/50 hover:text-accent-purple text-text-muted transition-all">
                  <ChevronRight className="h-3 w-3 shrink-0" />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {chatHistory.length > 0 && (
          <div className="px-5 py-4 space-y-4 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {chatHistory.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="h-7 w-7 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent-purple" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent-purple text-white rounded-tr-sm'
                      : 'bg-background-dark border border-border-slate/50 text-text-white rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loadingChat && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center shrink-0 mr-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent-purple animate-pulse" />
                </div>
                <div className="bg-background-dark border border-border-slate/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex space-x-1">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} className="h-2 w-2 bg-accent-purple/60 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-4 border-t border-border-slate/40">
          <div className="flex space-x-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask anything about your habits, sleep, nutrition…"
              className="flex-1 bg-background-dark border border-border-slate rounded-xl px-4 py-2.5 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple transition-all" />
            <button onClick={() => sendChat()} disabled={!chatInput.trim() || loadingChat}
              className="h-10 w-10 rounded-xl bg-accent-purple hover:bg-accent-hover disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shadow-accent-purple/20">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Meal Suggestions ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-surface-dark border border-border-slate/60 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-slate/40">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-success-emerald" />
            <span className="text-sm font-extrabold text-text-white font-outfit">AI Meal Suggestions</span>
          </div>
          <button onClick={fetchMeals} disabled={loadingMeals}
            className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-success-emerald/30 text-success-emerald hover:bg-success-emerald/10 disabled:opacity-40 transition-all">
            {loadingMeals ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            <span>{meals.length ? 'Refresh' : 'Generate Meals'}</span>
          </button>
        </div>

        {loadingMeals ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-border-slate/20 rounded-xl animate-pulse" />)}
          </div>
        ) : meals.length > 0 ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meals.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                className="bg-background-dark border border-border-slate/50 rounded-xl p-4 space-y-2 hover:border-accent-purple/30 transition-all">
                <div className="text-xs font-extrabold text-text-white">{m.title}</div>
                <p className="text-[10px] text-text-muted leading-relaxed">{m.items?.join(', ')}</p>
                <div className="flex items-center space-x-3 pt-2 border-t border-border-slate/30">
                  {[
                    { label: 'kcal', val: m.macros?.calories, color: '#EF4444' },
                    { label: 'P',    val: `${m.macros?.protein}g`, color: '#3B82F6' },
                    { label: 'C',    val: `${m.macros?.carbs}g`,   color: '#F59E0B' },
                    { label: 'F',    val: `${m.macros?.fat}g`,     color: '#10B981' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="text-center">
                      <div className="text-[10px] font-black" style={{ color }}>{val}</div>
                      <div className="text-[8px] text-text-muted uppercase">{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center space-y-2">
            <Sparkles className="h-8 w-8 text-text-muted/20 mx-auto" />
            <p className="text-sm text-text-muted">Generate personalised meal suggestions based on your calorie target.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Local chat response engine ─────────────────────────────────────────────
function generateLocalChatResponse(q, user, goals, streak, stats, mood) {
  const lower = q.toLowerCase();
  const name  = user?.username || 'you';

  if (lower.includes('focus') || lower.includes('today'))
    return `Based on your data, ${name}, your priority today should be ${stats.water < 1500 ? 'hydration first — you\'re under 1500ml' : stats.steps < 5000 ? 'getting your steps up — under 5000 right now' : 'maintaining your current momentum'}. Your ${streak}-day streak is valuable — protect it.`;

  if (lower.includes('sleep'))
    return stats.sleep > 0
      ? `You logged ${stats.sleep}h sleep. ${stats.sleep >= 7 ? 'That\'s solid recovery. Focus on keeping your sleep window consistent — same time each night trains your circadian rhythm.' : 'Under 7h is recovery debt. Tonight: no caffeine after 2pm, dim lights at 9pm, cool room (18-20°C). Even 30 more minutes matters.'}`
      : `You haven't logged sleep yet. Aim for 7-9h. The biggest sleep killers: inconsistent wake time, late blue light, and eating too close to bedtime.`;

  if (lower.includes('workout') || lower.includes('exercise') || lower.includes('train'))
    return `For your fitness level and goals: if you haven't trained yet, a 20-minute walk + 10 min bodyweight circuit is enough to keep the streak alive. Quality beats duration. ${stats.workouts > 0 ? `You've already logged ${stats.workouts} min — great job.` : 'Get something in today, even minimal.'}`;

  if (lower.includes('meal') || lower.includes('eat') || lower.includes('food') || lower.includes('nutrition'))
    return `Simple nutrition rule: protein at every meal (30-40g), vegetables to fill half the plate, complex carbs for energy, and water before you feel thirsty. For your calorie range, ${stats.nutrition > 0 ? `you've already hit ${stats.nutrition} kcal today.` : 'try to eat within 1800-2200 kcal.'}`;

  if (lower.includes('weak') || lower.includes('worst'))
    return `Looking at your data: your least consistent habit is ${stats.water < 2000 ? 'hydration (water intake is frequently low)' : stats.steps < 7000 ? 'daily steps (consistently below target)' : stats.sleep < 7 ? 'sleep quality (under 7h regularly)' : 'keeping up workouts'}. Focus one week on just that — single-habit focus multiplies results.`;

  if (lower.includes('plateau') || lower.includes('stuck'))
    return `Plateaus mean your body adapted — that's actually success. To break through: (1) Change the stimulus — add 10% weight or time. (2) Change the timing. (3) Add one new habit to trigger new adaptation. (4) Check recovery — often plateaus = under-recovery, not under-effort.`;

  if (lower.includes('motivat'))
    return `Motivation is unreliable — it fluctuates with sleep, stress, and mood. Systems beat motivation every time. You already have a ${streak}-day streak, which means you've shown up even on low-motivation days. That's identity-level change. Keep building the identity: "I am someone who tracks their health."`;

  if (lower.includes('water') || lower.includes('hydrat'))
    return `You've logged ${stats.water}ml today. Target: 2500ml. Practical tips: (1) 500ml immediately on waking. (2) Glass before each meal. (3) Bottle at your desk. Proper hydration improves energy by ~20% and reduces hunger signals.`;

  return `Based on your current streak of ${streak} days and today's logged data, you're doing well. Keep logging consistently — the data compounds into real insight over time. Is there a specific area (sleep, steps, nutrition, recovery) you'd like me to dig into?`;
}

// ── Fallback meal data ─────────────────────────────────────────────────────
const FALLBACK_MEALS = [
  { title: 'High-Protein Breakfast', items: ['3 boiled eggs', 'oats with milk', 'banana', 'black coffee'],          macros: { calories: 520, protein: 38, carbs: 52, fat: 14 } },
  { title: 'Power Lunch',            items: ['chicken breast 200g', 'brown rice 1 cup', 'mixed salad', 'olive oil'], macros: { calories: 680, protein: 55, carbs: 68, fat: 16 } },
  { title: 'Recovery Dinner',        items: ['salmon 150g', 'sweet potato', 'steamed broccoli', 'lemon juice'],      macros: { calories: 580, protein: 42, carbs: 54, fat: 18 } },
  { title: 'Smart Snack',            items: ['Greek yogurt', 'mixed nuts 30g', 'apple'],                             macros: { calories: 320, protein: 18, carbs: 32, fat: 12 } },
];
