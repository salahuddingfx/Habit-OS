import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useAdminStore } from '../store/adminStore.js';
import {
  Users, Trash2, Edit3, CheckCircle, XCircle, Terminal,
  Database, Wifi, Activity, Bell, RefreshCw, Cpu, Shield,
  AlertTriangle, BarChart2, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = 'text-accent-purple', bg = 'bg-accent-purple/10', badge }) {
  return (
    <div className="bg-surface-dark/80 border border-border-slate/80 rounded-xl p-5 flex items-center space-x-4 hover-glowing-card">
      <div className={`p-3 rounded-xl ${bg} ${color} border border-current/20`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] uppercase font-bold tracking-wider text-text-muted font-mono">{label}</div>
        <div className="text-xl font-black text-text-white font-outfit truncate">{value ?? '—'}</div>
      </div>
      {badge && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-success-emerald bg-success-emerald/10 border border-success-emerald/30 px-2 py-0.5 rounded">
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Log Row ───────────────────────────────────────────────────────────────
function LogRow({ log }) {
  const statusColor = log.status >= 500
    ? 'text-error-red'
    : log.status >= 400
      ? 'text-yellow-400'
      : 'text-success-emerald';

  return (
    <div className="flex items-center space-x-3 text-[10px] font-mono py-1.5 border-b border-border-slate/20 last:border-0">
      <span className="text-text-muted/50 shrink-0 w-20 truncate">{log.timestamp?.slice(11, 19) || '--'}</span>
      <span className={`font-bold w-10 shrink-0 ${log.method === 'GET' ? 'text-blue-400' : log.method === 'POST' ? 'text-emerald-400' : 'text-yellow-400'}`}>{log.method}</span>
      <span className="flex-1 text-text-muted/80 truncate">{log.path}</span>
      <span className={`font-bold shrink-0 ${statusColor}`}>{log.status}</span>
      <span className="text-text-muted/50 shrink-0">{log.duration}</span>
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────
function UserRow({ user, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    xp: user.xp || 0,
    streak: user.streak || 0,
    role: user.role || 'user',
    region: user.region || 'Global',
    username: user.username || ''
  });

  const handleSave = async () => {
    const ok = await onSave(user._id || user.id, form);
    if (ok) setEditing(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-background-dark/60 border border-border-slate/60 rounded-xl p-4 space-y-3 hover-glowing-card"
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center font-bold text-accent-purple text-sm font-outfit">
              {(user.username || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-text-white font-outfit">{user.username || 'Unknown'}</div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-text-muted">
                {user.role === 'admin' ? (
                  <span className="text-accent-purple">Admin</span>
                ) : 'User'}
                {' · '}
                <span className="text-success-emerald">{user.tier || 'Bronze'}</span>
                {' · '}
                {user.region || 'Global'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditing(!editing)}
              className="p-1.5 text-text-muted hover:text-accent-purple transition-colors rounded-lg hover:bg-accent-purple/10"
              title="Edit user"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(user._id || user.id)}
              className="p-1.5 text-text-muted hover:text-error-red transition-colors rounded-lg hover:bg-error-red/10"
              title="Delete user"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex space-x-4 text-[10px] font-mono text-text-muted/70">
          <span>XP: <span className="text-text-white font-bold">{user.xp || 0}</span></span>
          <span>Streak: <span className="text-text-white font-bold">{user.streak || 0}d</span></span>
        </div>

        {/* Inline Edit Form */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-3 border-t border-border-slate/40"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple font-mono"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">XP</label>
                <input
                  type="number"
                  value={form.xp}
                  onChange={(e) => setForm({ ...form, xp: e.target.value })}
                  className="w-full bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Streak</label>
                <input
                  type="number"
                  value={form.streak}
                  onChange={(e) => setForm({ ...form, streak: e.target.value })}
                  className="w-full bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Region</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full bg-surface-dark border border-border-slate rounded-lg px-3 py-1.5 text-xs text-text-white focus:outline-none focus:border-accent-purple font-mono"
                >
                  <option value="Global">Global</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-accent-purple hover:bg-accent-hover text-text-white text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center space-x-1"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center justify-center px-3 py-2 bg-border-slate/30 hover:bg-border-slate/60 text-text-muted hover:text-text-white text-xs font-semibold rounded-lg transition-all"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── AdminDashboard Page ───────────────────────────────────────────────────
export default function AdminDashboard() {
  const { accessToken } = useAuthStore();
  const {
    users, stats, logs,
    fetchUsers, updateUser, deleteUser,
    fetchStats, fetchLogs,
    sendBroadcast, seedDatabase,
    loading, error
  } = useAdminStore();

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastSubtitle, setBroadcastSubtitle] = useState('');
  const [broadcastType, setBroadcastType] = useState('info');
  const [broadcastStatus, setBroadcastStatus] = useState(null);

  const [seedStatus, setSeedStatus] = useState(null);
  const [logsRefreshing, setLogsRefreshing] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchUsers(accessToken);
      fetchStats(accessToken);
      fetchLogs(accessToken);
    }
  }, [accessToken]);

  const handleBroadcast = async () => {
    if (!broadcastTitle || !broadcastSubtitle) return;
    const ok = await sendBroadcast(accessToken, broadcastTitle, broadcastSubtitle, broadcastType);
    if (ok) {
      setBroadcastStatus('success');
      setBroadcastTitle('');
      setBroadcastSubtitle('');
      setTimeout(() => setBroadcastStatus(null), 3000);
    } else {
      setBroadcastStatus('error');
      setTimeout(() => setBroadcastStatus(null), 3000);
    }
  };

  const handleSeed = async () => {
    const ok = await seedDatabase(accessToken);
    setSeedStatus(ok ? 'success' : 'error');
    if (ok) await fetchUsers(accessToken);
    setTimeout(() => setSeedStatus(null), 3000);
  };

  const handleRefreshLogs = async () => {
    setLogsRefreshing(true);
    await fetchLogs(accessToken);
    setLogsRefreshing(false);
  };

  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Shield className="h-5 w-5 text-accent-purple" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent-purple">Root Access</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight font-outfit text-text-white">Admin Panel</h1>
          <p className="text-sm text-text-muted">Manage users, view system health, and send announcements.</p>
        </div>

        <button
          onClick={handleSeed}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            seedStatus === 'success'
              ? 'bg-success-emerald/10 border-success-emerald/40 text-success-emerald'
              : seedStatus === 'error'
                ? 'bg-error-red/10 border-error-red/40 text-error-red'
                : 'bg-border-slate/40 border-border-slate text-text-muted hover:text-text-white hover:bg-accent-purple/10 hover:border-accent-purple/40'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>{loading && !seedStatus ? 'Seeding...' : seedStatus === 'success' ? 'Done!' : 'Add Sample Data'}</span>
        </button>
      </div>

      {/* System Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.usersCount} icon={Users} />
          <StatCard label="Active Goals" value={stats.goalsCount} icon={Activity} color="text-success-emerald" bg="bg-success-emerald/10" />
          <StatCard label="Online Now" value={stats.activeSockets} icon={Wifi} color="text-blue-400" bg="bg-blue-500/10" badge="LIVE" />
          <StatCard label="Notifications Sent" value={stats.notificationsCount} icon={Bell} color="text-yellow-400" bg="bg-yellow-400/10" />
        </div>
      )}

      {/* System Metrics */}
      {stats?.systemMetrics && (
        <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-text-white flex items-center space-x-2 font-outfit">
            <Cpu className="h-4 w-4 text-accent-purple" />
            <span>System Health</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-mono">
            {Object.entries(stats.systemMetrics).map(([key, val]) => (
              <div key={key} className="bg-background-dark rounded-xl p-3 border border-border-slate/60">
                <div className="text-[8px] text-text-muted uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-xs font-bold text-text-white">{val}</div>
              </div>
            ))}
            <div className="bg-background-dark rounded-xl p-3 border border-border-slate/60">
              <div className="text-[8px] text-text-muted uppercase tracking-widest mb-1">Database</div>
              <div className="text-xs font-bold text-text-white truncate">{stats.dbType}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Broadcast Panel */}
        <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-text-white flex items-center space-x-2 font-outfit">
            <Bell className="h-4 w-4 text-accent-purple" />
            <span>Send Announcement</span>
          </h2>

          <div className="space-y-3 font-mono">
            <div>
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. Maintenance incoming..."
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-2.5 text-xs text-text-white focus:outline-none focus:border-accent-purple transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Message</label>
              <textarea
                rows={3}
                placeholder="Notification body text..."
                value={broadcastSubtitle}
                onChange={(e) => setBroadcastSubtitle(e.target.value)}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-2.5 text-xs text-text-white focus:outline-none focus:border-accent-purple transition-all resize-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Type</label>
              <select
                value={broadcastType}
                onChange={(e) => setBroadcastType(e.target.value)}
                className="w-full bg-background-dark border border-border-slate rounded-xl px-4 py-2.5 text-xs text-text-white focus:outline-none focus:border-accent-purple"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Critical Alert</option>
              </select>
            </div>

            <button
              onClick={handleBroadcast}
              disabled={loading || !broadcastTitle || !broadcastSubtitle}
              className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                broadcastStatus === 'success'
                  ? 'bg-success-emerald/10 text-success-emerald border border-success-emerald/40'
                  : broadcastStatus === 'error'
                    ? 'bg-error-red/10 text-error-red border border-error-red/40'
                    : 'bg-accent-purple hover:bg-accent-hover text-text-white border border-accent-purple/0 shadow-lg shadow-accent-purple/20'
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              <Send className="h-4 w-4" />
              <span>
                {broadcastStatus === 'success'
                  ? 'Sent!'
                  : broadcastStatus === 'error'
                    ? 'Failed — try again'
                    : loading ? 'Sending...' : 'Send to All Users'}
              </span>
            </button>
          </div>
        </div>

        {/* Live API Logs Terminal */}
        <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-white flex items-center space-x-2 font-outfit">
              <Terminal className="h-4 w-4 text-accent-purple" />
              <span>API Request Log</span>
            </h2>
            <button
              onClick={handleRefreshLogs}
              className="text-text-muted hover:text-accent-purple transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${logsRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-background-dark rounded-xl p-4 h-64 overflow-y-auto border border-border-slate/50 font-mono">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted/40 text-xs font-mono">
                <div className="text-center space-y-1">
                  <Terminal className="h-5 w-5 mx-auto mb-2 text-text-muted/20" />
                  <div>No logs captured yet</div>
                  <div className="text-[9px]">Logs appear after requests</div>
                </div>
              </div>
            ) : (
              [...logs].reverse().map((log, idx) => <LogRow key={idx} log={log} />)
            )}
          </div>
        </div>

      </div>

      {/* User Management */}
      <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-white flex items-center space-x-2 font-outfit">
            <Users className="h-4 w-4 text-accent-purple" />
            <span>All Users</span>
            <span className="text-[9px] font-bold text-text-muted/60 bg-border-slate/40 px-2 py-0.5 rounded ml-1 font-mono">
              {users.length} total
            </span>
          </h2>
          <button
            onClick={() => fetchUsers(accessToken)}
            className="text-text-muted hover:text-accent-purple transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-error-red/10 border border-error-red/30 rounded-xl text-xs text-error-red font-mono flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && users.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-background-dark rounded-xl animate-skeleton border border-border-slate/40"></div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-text-muted/40 text-xs space-y-2">
            <Users className="h-8 w-8 mx-auto text-text-muted/20" />
            <div>No users found yet</div>
            <div className="text-[9px]">Add sample data or register users first</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => (
              <UserRow
                key={u._id || u.id}
                user={u}
                onDelete={(uid) => deleteUser(accessToken, uid)}
                onSave={(uid, form) => updateUser(accessToken, uid, form)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
