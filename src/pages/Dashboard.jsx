import React, { useState } from 'react';
import { useGoalStore } from '../store/goalStore.js';
import { useAuthStore } from '../store/authStore.js';
import { Activity, Flame, Droplets, Bed, Footprints, FlameKindling, Scale, Plus, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const playSynthBeep = (freq = 800, type = 'sine', duration = 0.08) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

const playSuccessChime = () => {
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playSynthBeep(freq, 'triangle', 0.15);
    }, index * 120);
  });
};

function CircularProgressRing({ value, max, colorClass, size = 64, strokeWidth = 6 }) {
  const percentage = Math.min(Math.round((value / (max || 1)) * 100), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-border-slate/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`progress-ring-circle ${colorClass}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-[10px] font-mono font-bold text-text-white">
        {percentage}%
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { logValue, goals } = useGoalStore();
  const { user, updateProfile } = useAuthStore();
  
  const [weight, setWeight] = useState(user?.weight || 70);
  const [height, setHeight] = useState(user?.height || 175);
  const [age, setAge] = useState(user?.age || 25);
  const [gender, setGender] = useState(user?.gender || 'other');
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || 'sedentary');
  
  const [customSteps, setCustomSteps] = useState('');
  const [customSleep, setCustomSleep] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [customProt, setCustomProt] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const findGoal = (cat) => goals.find(g => g.category === cat && g.dateKey === todayStr) || { currentValue: 0, targetValue: 1 };
  
  const waterGoal = findGoal('water');
  const stepsGoal = findGoal('steps');
  const sleepGoal = findGoal('sleep');
  const nutritionGoal = findGoal('nutrition');
  const proteinGoal = findGoal('protein');

  const handleLogClick = async (category, type, value, prevGoal) => {
    playSynthBeep(880, 'sine', 0.08);
    const newTotal = prevGoal.currentValue + value;
    await logValue(category, type, value);
    if (newTotal >= prevGoal.targetValue && prevGoal.currentValue < prevGoal.targetValue) {
      setTimeout(() => {
        playSuccessChime();
      }, 300);
    }
  };

  const handleUpdateHealth = async (e) => {
    e.preventDefault();
    playSynthBeep(600, 'sine', 0.1);
    await updateProfile({
      weight: Number(weight),
      height: Number(height),
      age: Number(age),
      gender,
      activityLevel
    });
  };

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  const getBmiStatus = (val) => {
    if (val < 18.5) return 'Underweight';
    if (val < 25) return 'Normal';
    if (val < 30) return 'Overweight';
    return 'Obese';
  };

  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);

  const getGridGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return { text: 'Good morning! Ready to build great habits?', code: 'Morning', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    if (hr >= 12 && hr < 17) return { text: 'Good afternoon! Keep up the momentum.', code: 'Afternoon', color: 'text-accent-purple', bg: 'bg-accent-purple/10' };
    if (hr >= 17 && hr < 22) return { text: 'Good evening! How did your day go?', code: 'Evening', color: 'text-success-emerald', bg: 'bg-success-emerald/10' };
    return { text: 'Late night check-in. Rest up!', code: 'Night', color: 'text-indigo-400', bg: 'bg-indigo-400/10' };
  };

  const greeting = getGridGreeting();

  return (
    <div className="space-y-8 pb-12 relative">
      <div className={`p-4 rounded-xl border border-border-slate/60 flex items-center justify-between backdrop-blur-md ${greeting.bg} relative z-10`}>
        <div className="flex items-center space-x-3">
          <Cpu className={`h-5 w-5 ${greeting.color} animate-pulse`} />
          <div>
            <span className="text-[10px] text-text-muted uppercase block tracking-widest">Today's Motivation</span>
            <span className="text-sm font-bold text-text-white">{greeting.text}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-text-muted uppercase block tracking-widest">Time of Day</span>
          <span className={`text-xs font-bold ${greeting.color}`}>{greeting.code}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-outfit text-text-white">
            My Dashboard
          </h1>
          <p className="text-sm text-text-muted">
            Welcome back, <span className="text-accent-purple font-bold">{user?.username || 'Friend'}</span>! Here's how you're doing today.
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-surface-dark/80 border border-border-slate px-5 py-2.5 rounded-xl self-start">
          <Activity className="h-5 w-5 text-accent-purple animate-pulse" />
          <div className="font-outfit">
            <div className="text-[9px] uppercase font-bold text-text-muted tracking-widest">Current Streak</div>
            <div className="text-lg font-bold text-text-white">{user?.streak || 1} Days</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <motion.div whileHover={{ y: -2 }} className="bg-surface-dark/80 border border-border-slate/85 rounded-xl p-5 relative overflow-hidden backdrop-blur-md flex items-center justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-accent-purple/10 border border-accent-purple/20 rounded-lg text-accent-purple inline-block">
              <Footprints className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xl font-black text-text-white font-outfit">{stepsGoal.currentValue.toLocaleString()}</div>
              <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Target: {(stepsGoal.targetValue || 10000).toLocaleString()}</div>
            </div>
          </div>
          <CircularProgressRing value={stepsGoal.currentValue} max={stepsGoal.targetValue || 10000} colorClass="text-accent-purple" />
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-surface-dark/80 border border-border-slate/85 rounded-xl p-5 relative overflow-hidden backdrop-blur-md flex items-center justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 inline-block">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xl font-black text-text-white font-outfit">{waterGoal.currentValue} ml</div>
              <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Target: {waterGoal.targetValue || 2500} ml</div>
            </div>
          </div>
          <CircularProgressRing value={waterGoal.currentValue} max={waterGoal.targetValue || 2500} colorClass="text-blue-400" />
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-surface-dark/80 border border-border-slate/85 rounded-xl p-5 relative overflow-hidden backdrop-blur-md flex items-center justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 inline-block">
              <Bed className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xl font-black text-text-white font-outfit">{sleepGoal.currentValue} hrs</div>
              <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Target: {sleepGoal.targetValue || 8} hrs</div>
            </div>
          </div>
          <CircularProgressRing value={sleepGoal.currentValue} max={sleepGoal.targetValue || 8} colorClass="text-indigo-400" />
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-surface-dark/80 border border-border-slate/85 rounded-xl p-5 relative overflow-hidden backdrop-blur-md flex items-center justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 inline-block">
              <Flame className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xl font-black text-text-white font-outfit">{nutritionGoal.currentValue} kcal</div>
              <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Target: {nutritionGoal.targetValue || 2000} kcal</div>
            </div>
          </div>
          <CircularProgressRing value={nutritionGoal.currentValue} max={nutritionGoal.targetValue || 2000} colorClass="text-emerald-400" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-text-white flex items-center space-x-2 font-outfit">
              <FlameKindling className="h-5 w-5 text-accent-purple" />
              <span>Log Today's Activity</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
              <div className="bg-background-dark border border-border-slate rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Hydration Logs</span>
                <div className="flex gap-2">
                  <button onClick={() => handleLogClick('water', 'daily', 250, waterGoal)} className="flex-1 bg-border-slate hover:bg-accent-purple text-text-white text-xs font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer">
                    <Plus className="h-3.5 w-3.5" /> <span>250 ml</span>
                  </button>
                  <button onClick={() => handleLogClick('water', 'daily', 500, waterGoal)} className="flex-1 bg-border-slate hover:bg-accent-purple text-text-white text-xs font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer">
                    <Plus className="h-3.5 w-3.5" /> <span>500 ml</span>
                  </button>
                </div>
              </div>

              <div className="bg-background-dark border border-border-slate rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Steps Logger</span>
                <div className="flex gap-2">
                  <input type="number" placeholder="e.g. 3000" value={customSteps} onChange={(e) => setCustomSteps(e.target.value)} className="flex-1 bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple" />
                  <button onClick={() => { if (!customSteps) return; handleLogClick('steps', 'daily', Number(customSteps), stepsGoal); setCustomSteps(''); }} className="bg-accent-purple hover:bg-accent-hover text-text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all cursor-pointer">Log</button>
                </div>
              </div>

              <div className="bg-background-dark border border-border-slate rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sleep Hours</span>
                <div className="flex gap-2">
                  <input type="number" step="0.5" placeholder="Hours (e.g. 7.5)" value={customSleep} onChange={(e) => setCustomSleep(e.target.value)} className="flex-1 bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple" />
                  <button onClick={() => { if (!customSleep) return; handleLogClick('sleep', 'daily', Number(customSleep), sleepGoal); setCustomSleep(''); }} className="bg-accent-purple hover:bg-accent-hover text-text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all cursor-pointer">Log</button>
                </div>
              </div>

              <div className="bg-background-dark border border-border-slate rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nutrition & Macros</span>
                <div className="flex gap-2">
                  <input type="number" placeholder="kcal" value={customCal} onChange={(e) => setCustomCal(e.target.value)} className="w-1/2 bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple" />
                  <input type="number" placeholder="Protein (g)" value={customProt} onChange={(e) => setCustomProt(e.target.value)} className="w-1/2 bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple" />
                </div>
                <button onClick={() => { if (customCal) { handleLogClick('nutrition', 'daily', Number(customCal), nutritionGoal); setCustomCal(''); } if (customProt) { handleLogClick('protein', 'daily', Number(customProt), proteinGoal); setCustomProt(''); } }} className="w-full bg-accent-purple hover:bg-accent-hover text-text-white text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer">Log Nutrition Input</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-text-white flex items-center space-x-2 font-outfit">
              <Scale className="h-5 w-5 text-accent-purple" />
              <span>Body Stats Calculator</span>
            </h2>

            <form onSubmit={handleUpdateHealth} className="space-y-4 font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Weight (kg)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Height (cm)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Age (yrs)</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Activity</label>
                  <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="w-full bg-background-dark border border-border-slate rounded-lg px-3 py-2 text-xs text-text-white focus:outline-none">
                    <option value="sedentary">Sedentary</option>
                    <option value="lightly_active">Light Active</option>
                    <option value="moderately_active">Moderate Active</option>
                    <option value="very_active">Very Active</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-border-slate hover:bg-accent-purple text-text-white text-xs font-semibold py-2.5 rounded-lg transition-all cursor-pointer">
                Update My Stats
              </button>
            </form>

            <div className="pt-4 border-t border-border-slate/40 space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Body Mass Index (BMI)</span>
                <span className="font-semibold text-text-white">{isNaN(bmi) ? '0.0' : bmi.toFixed(1)} ({getBmiStatus(bmi)})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Basal Metabolic Rate (BMR)</span>
                <span className="font-semibold text-text-white">{isNaN(bmr) ? 0 : Math.round(bmr)} kcal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
