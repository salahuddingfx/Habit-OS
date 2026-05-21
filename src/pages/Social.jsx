import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import {
  Users, UserPlus, Search, Heart, Flame, Trophy,
  ThumbsUp, Zap, MessageCircle, X, UserCheck,
  Activity, Award, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:5000/api';

// Reaction options
const REACTIONS = [
  { icon: ThumbsUp, label: 'Nice!',    color: '#3B82F6', key: 'nice'    },
  { icon: Flame,    label: 'Fire!',    color: '#EF4444', key: 'fire'    },
  { icon: Heart,    label: 'Love it',  color: '#EC4899', key: 'love'    },
  { icon: Zap,      label: 'Amazing',  color: '#F59E0B', key: 'amazing' },
  { icon: Trophy,   label: 'Winner',   color: '#7C3AED', key: 'winner'  },
];

function Avatar({ username, size = 9 }) {
  return (
    <div className={`h-${size} w-${size} rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple font-black text-sm font-outfit shrink-0`}>
      {(username || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function ActivityCard({ activity, onReact }) {
  const [showReactions, setShowReactions] = useState(false);
  const totalReactions = Object.values(activity.reactions || {}).reduce((a, b) => a + b, 0);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <Avatar username={activity.username} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-white">{activity.username}</div>
          <div className="text-xs text-text-muted">{activity.description}</div>
        </div>
        <div className="text-[10px] text-text-muted/60 shrink-0">{activity.timeAgo}</div>
      </div>

      {/* XP gained chip */}
      {activity.xp > 0 && (
        <div className="flex items-center space-x-1.5 bg-accent-purple/10 border border-accent-purple/20 rounded-xl px-3 py-1.5 w-fit">
          <Zap className="h-3 w-3 text-accent-purple" />
          <span className="text-[10px] font-bold text-accent-purple">+{activity.xp} XP</span>
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center space-x-2">
        <button onClick={() => setShowReactions(!showReactions)}
          className="flex items-center space-x-1.5 text-[10px] font-bold text-text-muted hover:text-accent-purple transition-colors px-2.5 py-1.5 rounded-xl border border-border-slate/40 hover:border-accent-purple/40">
          <Heart className="h-3.5 w-3.5" />
          <span>React {totalReactions > 0 ? `(${totalReactions})` : ''}</span>
        </button>

        {/* Show existing reactions */}
        {Object.entries(activity.reactions || {}).filter(([, v]) => v > 0).map(([key, count]) => {
          const r = REACTIONS.find(x => x.key === key);
          if (!r) return null;
          const Icon = r.icon;
          return (
            <span key={key} className="flex items-center space-x-0.5 text-[10px] font-bold px-2 py-1 rounded-xl border"
              style={{ color: r.color, borderColor: r.color + '40', backgroundColor: r.color + '15' }}>
              <Icon className="h-3 w-3" /><span>{count}</span>
            </span>
          );
        })}
      </div>

      {/* Reaction picker */}
      <AnimatePresence>
        {showReactions && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2">
            {REACTIONS.map(r => {
              const Icon = r.icon;
              return (
                <button key={r.key} onClick={() => { onReact(activity.id, r.key); setShowReactions(false); }}
                  className="flex items-center space-x-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all hover:scale-105"
                  style={{ color: r.color, borderColor: r.color + '40', backgroundColor: r.color + '10' }}>
                  <Icon className="h-3.5 w-3.5" /><span>{r.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Social() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('feed'); // 'feed' | 'friends' | 'search'
  const [friends, setFriends]     = useState([]);
  const [feed, setFeed]           = useState([]);
  const [searchQ, setSearchQ]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading]     = useState(false);

  const token = () => localStorage.getItem('authToken');

  // Generate demo feed from friends (client-side since no social server routes yet)
  const buildDemoFeed = (friendsList) => {
    const actions = [
      'completed their Water goal — 2500ml logged',
      'hit a 7-day streak on Steps!',
      'finished a 30-day challenge',
      'unlocked the "Week Warrior" badge',
      'logged Exercise for 45 minutes',
      'crushed their Protein goal — 150g',
    ];
    return friendsList.map((f, i) => ({
      id:          f._id || f.id || i,
      username:    f.username,
      description: actions[i % actions.length],
      xp:          Math.floor(Math.random() * 50) + 10,
      timeAgo:     ['2m ago', '15m ago', '1h ago', '3h ago', 'Yesterday'][i % 5],
      reactions:   {}
    }));
  };

  const loadFriends = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/friends`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const data = await res.json();
        const list = data.friends || data || [];
        setFriends(list);
        setFeed(buildDemoFeed(list));
      }
    } catch {
      // Server not available — show empty state
    }
    setLoading(false);
  };

  useEffect(() => { loadFriends(); }, []);

  const searchUsers = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res  = await fetch(`${API}/users/search?q=${encodeURIComponent(searchQ)}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || data || []);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const addFriend = async (userId) => {
    try {
      await fetch(`${API}/friends/add`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body:    JSON.stringify({ targetUserId: userId })
      });
      loadFriends();
    } catch { /* noop */ }
  };

  const removeFriend = async (userId) => {
    try {
      await fetch(`${API}/friends/remove`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body:    JSON.stringify({ targetUserId: userId })
      });
      loadFriends();
    } catch { /* noop */ }
  };

  const reactToActivity = (actId, reactionKey) => {
    setFeed(prev => prev.map(a => a.id === actId
      ? { ...a, reactions: { ...a.reactions, [reactionKey]: (a.reactions[reactionKey] || 0) + 1 } }
      : a
    ));
  };

  const TABS = [
    { id: 'feed',    label: 'Activity Feed' },
    { id: 'friends', label: `Friends (${friends.length})` },
    { id: 'search',  label: 'Find People' },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Social</h1>
        <p className="text-sm text-text-muted mt-1">See what your friends are achieving and cheer them on.</p>
      </div>

      {/* Tab bar */}
      <div className="flex space-x-1 bg-surface-dark border border-border-slate/60 p-1 rounded-xl overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${tab === t.id ? 'bg-accent-purple text-white shadow' : 'text-text-muted hover:text-text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ACTIVITY FEED ── */}
      {tab === 'feed' && (
        <div className="space-y-4">
          {feed.length === 0 ? (
            <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-12 text-center space-y-3">
              <Users className="h-12 w-12 text-text-muted/20 mx-auto" />
              <p className="text-sm text-text-muted">No activity yet.</p>
              <p className="text-xs text-text-muted/60">Add friends to see their habit updates here.</p>
              <button onClick={() => setTab('search')}
                className="inline-flex items-center space-x-2 bg-accent-purple text-white text-xs font-bold px-4 py-2 rounded-xl">
                <Search className="h-3.5 w-3.5" /><span>Find Friends</span>
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {feed.map(activity => (
                <ActivityCard key={activity.id} activity={activity} onReact={reactToActivity} />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* ── FRIENDS LIST ── */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="bg-surface-dark border border-border-slate/60 rounded-2xl p-12 text-center space-y-3">
              <UserPlus className="h-12 w-12 text-text-muted/20 mx-auto" />
              <p className="text-sm text-text-muted">No friends yet.</p>
              <button onClick={() => setTab('search')}
                className="inline-flex items-center space-x-2 bg-accent-purple text-white text-xs font-bold px-4 py-2 rounded-xl">
                <Search className="h-3.5 w-3.5" /><span>Find People</span>
              </button>
            </div>
          ) : (
            friends.map((f, i) => (
              <motion.div key={f._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 flex items-center space-x-3">
                <Avatar username={f.username} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-text-white">{f.username}</div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] text-accent-purple font-bold">{f.tier || 'Bronze'}</span>
                    <span className="text-[10px] text-text-muted">·</span>
                    <span className="text-[10px] text-text-muted flex items-center space-x-1">
                      <Zap className="h-2.5 w-2.5" /><span>{f.xp || 0} XP</span>
                    </span>
                  </div>
                </div>
                <button onClick={() => removeFriend(f._id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border-slate text-text-muted hover:border-error-red/50 hover:text-error-red hover:bg-error-red/10 text-xs font-bold transition-all">
                  <UserCheck className="h-3.5 w-3.5" /><span>Friends</span>
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ── SEARCH ── */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUsers()}
                placeholder="Search by username…"
                className="w-full bg-background-dark border border-border-slate rounded-xl pl-9 pr-4 py-3 text-sm text-text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-purple" />
            </div>
            <button onClick={searchUsers}
              className="bg-accent-purple hover:bg-accent-hover text-white font-bold px-4 rounded-xl transition-all">
              {searching ? '…' : <Search className="h-4 w-4" />}
            </button>
          </div>

          {searchResults.length === 0 && searchQ && !searching && (
            <div className="text-center py-8 text-sm text-text-muted">No users found for "{searchQ}"</div>
          )}

          <div className="space-y-3">
            {searchResults.map((u, i) => {
              const isFriend = friends.some(f => (f._id || f.id) === (u._id || u.id));
              const isSelf   = u.username === user?.username;
              return (
                <motion.div key={u._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 flex items-center space-x-3">
                  <Avatar username={u.username} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-white">{u.username}</div>
                    <div className="text-[10px] text-text-muted">{u.tier || 'Bronze'} · {u.xp || 0} XP</div>
                  </div>
                  {!isSelf && (
                    <button onClick={() => isFriend ? removeFriend(u._id) : addFriend(u._id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isFriend
                          ? 'border-border-slate text-text-muted hover:border-error-red/50 hover:text-error-red'
                          : 'bg-accent-purple text-white border-accent-purple hover:bg-accent-hover'
                      }`}>
                      {isFriend ? <><UserCheck className="h-3.5 w-3.5" /><span>Friends</span></> : <><UserPlus className="h-3.5 w-3.5" /><span>Add Friend</span></>}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
