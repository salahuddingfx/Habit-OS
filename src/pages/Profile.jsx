import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useBadgeStore } from '../store/badgeStore.js';
import BadgeShelf from '../components/BadgeShelf.jsx';
import {
  User, Save, Camera, Award, Flame, Activity,
  MapPin, Calendar, Trophy, Edit3, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const TIER_COLORS = {
  Bronze:   { color: 'text-amber-600',   bg: 'bg-amber-600/10',   border: 'border-amber-600/40'   },
  Silver:   { color: 'text-slate-300',   bg: 'bg-slate-300/10',   border: 'border-slate-300/40'   },
  Gold:     { color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/40'  },
  Platinum: { color: 'text-cyan-300',    bg: 'bg-cyan-300/10',    border: 'border-cyan-300/40'    },
  Titan:    { color: 'text-accent-purple', bg: 'bg-accent-purple/10', border: 'border-accent-purple/40' }
};

const ACTIVITY_LABELS = {
  sedentary:         'Not very active',
  lightly_active:    'Lightly active (1–3 days/week)',
  moderately_active: 'Moderately active (3–5 days/week)',
  very_active:       'Very active (6–7 days/week)'
};

export default function Profile() {
  const { user, updateProfile, loading } = useAuthStore();
  const { badges, unlockedKeys, loadBadges } = useBadgeStore();

  useEffect(() => { loadBadges(); }, []);

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    username:      user?.username      || '',
    height:        user?.height        || 175,
    weight:        user?.weight        || 70,
    age:           user?.age           || 25,
    gender:        user?.gender        || 'other',
    activityLevel: user?.activityLevel || 'sedentary',
    region:        user?.region        || 'Global'
  });

  const tier = user?.tier || 'Bronze';
  const tierStyle = TIER_COLORS[tier] || TIER_COLORS.Bronze;

  const heightM = form.height / 100;
  const bmi = (form.weight / (heightM * heightM)).toFixed(1);
  const getBMILabel = (b) => {
    if (b < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (b < 25)   return { label: 'Healthy',     color: 'text-success-emerald' };
    if (b < 30)   return { label: 'Overweight',  color: 'text-yellow-400' };
    return             { label: 'Obese',        color: 'text-error-red' };
  };
  const bmiInfo = getBMILabel(Number(bmi));

  const handleSave = async () => {
    await updateProfile({
      username:      form.username,
      height:        Number(form.height),
      weight:        Number(form.weight),
      age:           Number(form.age),
      gender:        form.gender,
      activityLevel: form.activityLevel,
      region:        form.region
    });
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const Field = ({ label, children }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">

      {/* Profile Hero Card */}
      <div className="bg-surface-dark border border-border-slate/70 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-accent-purple/20 via-transparent to-transparent"></div>

        <div className="relative flex items-end space-x-4 mb-6">
          {/* Avatar */}
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-accent-purple/20 border-2 border-accent-purple/40 flex items-center justify-center text-3xl font-black text-accent-purple font-outfit">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            {editing && (
              <button className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-accent-purple flex items-center justify-center border-2 border-background-dark">
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-text-white font-outfit truncate">
              {user?.username || 'My Profile'}
            </h1>
            <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
              {/* Tier badge */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.color} ${tierStyle.border}`}>
                {tier}
              </span>
              {user?.region && (
                <span className="flex items-center space-x-1 text-[10px] text-text-muted">
                  <MapPin className="h-3 w-3" />
                  <span>{user.region}</span>
                </span>
              )}
              {user?.role === 'admin' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/30">
                  Admin
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={loading}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              editing
                ? 'bg-success-emerald/80 hover:bg-success-emerald text-white'
                : 'bg-accent-purple hover:bg-accent-hover text-white'
            } disabled:opacity-50`}
          >
            {editing ? <Save className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
            <span>{editing ? 'Save' : 'Edit'}</span>
          </button>
        </div>

        {/* Saved confirmation */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2 text-xs text-success-emerald bg-success-emerald/10 border border-success-emerald/30 rounded-xl px-4 py-2 mb-4"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Profile saved successfully!</span>
          </motion.div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background-dark/60 rounded-xl p-3 text-center border border-border-slate/40">
            <div className="flex items-center justify-center mb-1">
              <Award className="h-4 w-4 text-accent-purple" />
            </div>
            <div className="text-lg font-black text-text-white">{user?.xp || 0}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider">Total XP</div>
          </div>
          <div className="bg-background-dark/60 rounded-xl p-3 text-center border border-border-slate/40">
            <div className="flex items-center justify-center mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-lg font-black text-text-white">{user?.streak || 0}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider">Day Streak</div>
          </div>
          <div className="bg-background-dark/60 rounded-xl p-3 text-center border border-border-slate/40">
            <div className="flex items-center justify-center mb-1">
              <Activity className="h-4 w-4 text-success-emerald" />
            </div>
            <div className={`text-lg font-black ${bmiInfo.color}`}>{isNaN(bmi) ? '—' : bmi}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider">BMI</div>
          </div>
        </div>
      </div>

      {/* Body & Health Info */}
      <div className="bg-surface-dark border border-border-slate/70 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-text-white font-outfit flex items-center space-x-2">
          <User className="h-4 w-4 text-accent-purple" />
          <span>Personal Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Your Name">
            {editing ? (
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple transition-all"
              />
            ) : (
              <div className="text-sm text-text-white py-2.5">{user?.username || '—'}</div>
            )}
          </Field>

          <Field label="Region">
            {editing ? (
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple transition-all"
              >
                <option value="Global">Global</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
                <option value="Asia">Asia</option>
              </select>
            ) : (
              <div className="text-sm text-text-white py-2.5">{user?.region || 'Global'}</div>
            )}
          </Field>

          <Field label="Age">
            {editing ? (
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple transition-all"
              />
            ) : (
              <div className="text-sm text-text-white py-2.5">{user?.age || '—'} years old</div>
            )}
          </Field>

          <Field label="Gender">
            {editing ? (
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            ) : (
              <div className="text-sm text-text-white py-2.5 capitalize">{user?.gender || '—'}</div>
            )}
          </Field>

          <Field label="Height (cm)">
            {editing ? (
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple transition-all"
              />
            ) : (
              <div className="text-sm text-text-white py-2.5">{user?.height || '—'} cm</div>
            )}
          </Field>

          <Field label="Weight (kg)">
            {editing ? (
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple transition-all"
              />
            ) : (
              <div className="text-sm text-text-white py-2.5">{user?.weight || '—'} kg</div>
            )}
          </Field>

          <Field label="Activity Level">
            {editing ? (
              <select
                value={form.activityLevel}
                onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-3 py-2.5 text-sm text-text-white focus:outline-none focus:border-accent-purple transition-all sm:col-span-2"
              >
                {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-text-white py-2.5">{ACTIVITY_LABELS[user?.activityLevel] || '—'}</div>
            )}
          </Field>
        </div>

        {editing && (
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-accent-purple hover:bg-accent-hover text-white text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-accent-purple/20"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={() => { setEditing(false); setForm({ username: user?.username || '', height: user?.height || 175, weight: user?.weight || 70, age: user?.age || 25, gender: user?.gender || 'other', activityLevel: user?.activityLevel || 'sedentary', region: user?.region || 'Global' }); }}
              className="px-5 py-3 bg-border-slate/30 hover:bg-border-slate/60 text-text-muted hover:text-text-white text-sm font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Health Summary */}
      <div className="bg-surface-dark border border-border-slate/70 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-text-white font-outfit">Health Summary</h2>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-background-dark/60 border border-border-slate/40 rounded-xl p-4 space-y-1">
            <div className="text-[10px] text-text-muted uppercase tracking-wider">BMI Score</div>
            <div className={`text-2xl font-black ${bmiInfo.color}`}>{isNaN(bmi) ? '—' : bmi}</div>
            <div className={`text-xs font-semibold ${bmiInfo.color}`}>{bmiInfo.label}</div>
          </div>
          <div className="bg-background-dark/60 border border-border-slate/40 rounded-xl p-4 space-y-1">
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Daily Calories Needed</div>
            <div className="text-2xl font-black text-text-white">
              {isNaN(form.weight) ? '—' : Math.round(10 * form.weight + 6.25 * form.height - 5 * form.age + (form.gender === 'male' ? 5 : -161))}
            </div>
            <div className="text-xs text-text-muted">kcal / day</div>
          </div>
        </div>
      </div>
      {/* My Badges */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface-dark border border-border-slate/70 rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-white font-outfit flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-accent-purple" />
            <span>My Badges</span>
          </h2>
          <span className="text-xs font-bold text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-2.5 py-0.5 rounded-full">
            {unlockedKeys.size} / {badges.length > 0 ? 15 : 15} unlocked
          </span>
        </div>

        {unlockedKeys.size === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Trophy className="h-10 w-10 text-text-muted/20 mx-auto" />
            <p className="text-xs text-text-muted">No badges yet — start logging habits to unlock your first one!</p>
          </div>
        ) : (
          <BadgeShelf unlockedKeys={unlockedKeys} />
        )}

        {unlockedKeys.size < 15 && (
          <div className="pt-2 border-t border-border-slate/30">
            <p className="text-[10px] text-text-muted/60">Keep going! Log habits daily, complete challenges, and track your body stats to unlock all 15 badges.</p>
          </div>
        )}
      </motion.div>

    </div>
  );
}
