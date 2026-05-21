import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore.js';
import { useSyncStore } from './store/syncStore.js';
import { useGoalStore } from './store/goalStore.js';
import { useNotificationStore } from './store/notificationStore.js';
import { useBadgeStore, BADGE_DEFINITIONS } from './store/badgeStore.js';
import { useLang } from './i18n/LanguageContext.jsx';
import { db } from './services/db.js';
import { Toaster, toast } from 'sonner';
import { io } from 'socket.io-client';

// Page imports
import Auth            from './pages/Auth.jsx';
import Dashboard       from './pages/Dashboard.jsx';
import Goals           from './pages/Goals.jsx';
import Timeline        from './pages/Timeline.jsx';
import Leaderboard     from './pages/Leaderboard.jsx';
import Analytics       from './pages/Analytics.jsx';
import AISuggestions   from './pages/AISuggestions.jsx';
import AdminDashboard  from './pages/AdminDashboard.jsx';
import Profile         from './pages/Profile.jsx';
import DeveloperProfile from './pages/DeveloperProfile.jsx';
import Plans           from './pages/Plans.jsx';
import ExportPage      from './pages/ExportPage.jsx';
import Challenges      from './pages/Challenges.jsx';
import MoodTracker     from './pages/MoodTracker.jsx';
import BodyStats       from './pages/BodyStats.jsx';
import FoodTracker     from './pages/FoodTracker.jsx';
import Social          from './pages/Social.jsx';
import Reminders       from './pages/Reminders.jsx';
import CustomDashboard from './pages/CustomDashboard.jsx';
import InstallBanner   from './components/InstallBanner.jsx';
import BadgeShelf      from './components/BadgeShelf.jsx';

// Icons
import {
  Terminal, Shield, Sun, Moon, Sparkles, RefreshCw,
  Activity, Target, Clock, Trophy, BarChart2, LogOut,
  ChevronDown, ChevronUp, Settings, UserCircle, Code2,
  ClipboardList, Download, Swords, Smile, Scale, Apple, Globe,
  Users, Bell, LayoutDashboard
} from 'lucide-react';

export default function App() {
  const { user, isGuest, isOffline, logout } = useAuthStore();
  const { initializeListener, isOnline, syncOfflineData, pendingCount } = useSyncStore();
  const { loadLocalGoals, goals } = useGoalStore();
  const { activeBanner, toggleExpandBanner, dismissBanner } = useNotificationStore();
  const { loadBadges, checkAndUnlock, unlockedKeys } = useBadgeStore();
  const { lang, switchLang, t } = useLang();

  const [booting, setBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);
  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    // read saved preference; default = light
    return localStorage.getItem('theme') || 'light';
  });

  // Apply theme class on mount and whenever theme changes
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // BIOS boot sequence — exactly 2.0 s
  useEffect(() => {
    const sequence = [
      { text: 'Initializing Health Core...', delay: 100 },
      { text: 'Loading Habit Engine...', delay: 500 },
      { text: 'Connecting Local Database...', delay: 900 },
      { text: 'Syncing AI Systems...', delay: 1300 },
      { text: 'Realtime Services Online...', delay: 1700 }
    ];
    sequence.forEach(({ text, delay }) => {
      setTimeout(() => setBootLogs((p) => [...p, text]), delay);
    });
    setTimeout(() => setBooting(false), 2000);
  }, []);

  // Init sync + Dexie after boot
  useEffect(() => {
    if (!booting) {
      initializeListener();
      loadLocalGoals();
      loadBadges();
    }
  }, [booting]);

  // Reload data whenever user changes (login, guest mode, offline login)
  useEffect(() => {
    if (user && !booting) {
      loadLocalGoals();
      loadBadges();
    }
  }, [user?.id]);

  // Check + unlock badges whenever goals change
  useEffect(() => {
    if (!user || !goals?.length) return;
    (async () => {
      const plans = await db.plans.toArray();
      const newly = await checkAndUnlock(goals, user, plans);
      newly.forEach(key => {
        const def = BADGE_DEFINITIONS.find(b => b.key === key);
        if (def) toast.success(`Badge Unlocked: ${def.label}`, { description: def.desc, duration: 5000 });
      });
    })();
  }, [goals?.length]);

  // Socket.io client — only connect when online + logged in (not guest, not offline)
  useEffect(() => {
    if (!booting && user && !isGuest && !isOffline) {
      let socket;
      try {
        socket = io('http://localhost:5000', { timeout: 5000, reconnectionAttempts: 3 });
        socket.on('connect', () => socket.emit('join', user.id));
        socket.on('notification', (notif) => {
          toast(notif.title, {
            description: notif.subtitle,
            action: { label: 'Dismiss', onClick: () => {} }
          });
        });
        socket.on('connect_error', () => {
          // silently ignore — server might be down
        });
      } catch (_) {}
      return () => { try { socket?.disconnect(); } catch(_) {} };
    }
  }, [booting, user?.id, isGuest, isOffline]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // ── BIOS Boot Screen ──────────────────────────────────────────────────
  if (booting) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-emerald-400 font-mono select-none">
        <div className="w-full max-w-lg space-y-5">
          <div className="flex items-center space-x-2 border-b border-border-slate/40 pb-3">
            <Terminal className="h-5 w-5 animate-pulse text-accent-purple" />
            <span className="text-xs font-bold uppercase tracking-wider text-text-white">Health &amp; Habit OS  BIOS v1.0.0</span>
          </div>
          <div className="space-y-2 min-h-36 text-xs bios-text leading-relaxed">
            {bootLogs.map((log, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="text-text-muted/40">[{idx}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-border-slate/30 h-1 rounded-full overflow-hidden">
            <div className="bg-accent-purple h-full animate-[progress_2s_linear] w-full origin-left"></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth Screen ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <Auth />
        <Toaster theme="dark" />
      </>
    );
  }

  // ── Page Router ───────────────────────────────────────────────────────
  const isAdmin = user?.role === 'admin';

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':   return <CustomDashboard setActivePage={setActivePage} />;
      case 'goals':       return <Goals />;
      case 'plans':       return <Plans />;
      case 'challenges':  return <Challenges />;
      case 'mood':        return <MoodTracker />;
      case 'body':        return <BodyStats />;
      case 'food':        return <FoodTracker />;
      case 'social':      return <Social />;
      case 'reminders':   return <Reminders />;
      case 'export':      return <ExportPage />;
      case 'timeline':    return <Timeline />;
      case 'leaderboard': return <Leaderboard />;
      case 'analytics':   return <Analytics />;
      case 'ai':          return <AISuggestions />;
      case 'profile':     return <Profile />;
      case 'developer':   return <DeveloperProfile />;
      case 'admin':       return <AdminDashboard />;
      default:            return <CustomDashboard setActivePage={setActivePage} />;
    }
  };

  const navItems = [
    { id: 'dashboard',   label: t('home'),       icon: Activity        },
    { id: 'goals',       label: t('habits'),     icon: Target          },
    { id: 'plans',       label: t('plans'),      icon: ClipboardList   },
    { id: 'challenges',  label: t('challenges'), icon: Swords          },
    { id: 'social',      label: 'Social',        icon: Users           },
    { id: 'mood',        label: t('mood'),       icon: Smile           },
    { id: 'body',        label: t('body'),       icon: Scale           },
    { id: 'food',        label: t('food'),       icon: Apple           },
    { id: 'reminders',   label: 'Reminders',     icon: Bell            },
    { id: 'timeline',    label: t('history'),    icon: Clock           },
    { id: 'leaderboard', label: t('rankings'),   icon: Trophy          },
    { id: 'analytics',   label: t('stats'),      icon: BarChart2       },
    { id: 'export',      label: t('export'),     icon: Download        },
    { id: 'ai',          label: t('ai'),         icon: Sparkles        },
    { id: 'profile',     label: t('profile'),    icon: UserCircle      },
    { id: 'developer',   label: t('dev'),        icon: Code2           },
    ...(isAdmin ? [{ id: 'admin', label: t('admin'), icon: Settings }] : [])
  ];

  // ── Main Layout ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background-dark text-text-white transition-colors duration-300">

      {/* ══════════════════════════════════════════════════════════════════
          TOP STATUS BAR — full width, sticky, both desktop + mobile
      ══════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-12 bg-surface-dark/90 border-b border-border-slate/60 backdrop-blur-xl">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-accent-purple" />
          <span className="font-extrabold text-sm tracking-tight font-outfit text-text-white">Health &amp; Habit OS</span>
          {isAdmin && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-accent-purple bg-accent-purple/10 px-1.5 py-0.5 rounded border border-accent-purple/30">
              Admin
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Online dot */}
          <div className="flex items-center space-x-1">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-success-emerald' : 'bg-error-red animate-pulse'}`} />
            <span className="text-[10px] text-text-muted hidden sm:block">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Pending sync */}
          {pendingCount > 0 && (
            <button onClick={syncOfflineData} className="text-accent-purple flex items-center space-x-1 text-[10px] font-bold">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{pendingCount} pending</span>
            </button>
          )}

          {/* User badge */}
          <div className="hidden sm:block text-right">
            <div className="text-[10px] font-bold text-text-white">{user.username}</div>
            <div className="flex items-center justify-end space-x-1 mt-0.5">
              <div className="text-[9px] font-bold text-accent-purple uppercase">{user.tier || 'Bronze'}</div>
              {isGuest && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Guest</span>}
              {isOffline && !isGuest && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">Offline</span>}
            </div>
          </div>

          {/* Language toggle */}
          <button
            onClick={() => switchLang(lang === 'en' ? 'bn' : 'en')}
            className="p-1.5 text-text-muted hover:text-accent-purple transition-colors rounded-lg hover:bg-accent-purple/10 text-[10px] font-extrabold tracking-tight flex items-center space-x-0.5"
            title={lang === 'en' ? 'Switch to Bangla' : 'Switch to English'}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">{lang === 'en' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="p-1.5 text-text-muted hover:text-text-white transition-colors rounded-lg hover:bg-border-slate/30">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Logout */}
          <button onClick={logout} title="Log out" className="p-1.5 text-text-muted hover:text-error-red transition-colors rounded-lg hover:bg-error-red/10">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          BODY — sidebar on desktop, bottom nav on mobile
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex pt-12">

        {/* ── LEFT SIDEBAR — visible only on lg+ ── */}
        <aside className="hidden lg:flex flex-col fixed left-0 top-12 bottom-0 w-56 bg-surface-dark border-r border-border-slate/60 z-40 overflow-y-auto">
          {/* User card */}
          <div className="p-4 border-b border-border-slate/40">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple font-black text-sm font-outfit">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-text-white truncate">{user.username}</div>
                <div className="text-[10px] text-accent-purple font-bold uppercase">{user.tier || 'Bronze'}</div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isSelected
                      ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25'
                      : 'text-text-muted hover:text-text-white hover:bg-border-slate/30'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span>{item.label}</span>
                  {isSelected && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-purple" />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar badges strip */}
          {unlockedKeys.size > 0 && (
            <div className="px-3 pb-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Badges ({unlockedKeys.size})</div>
              <BadgeShelf unlockedKeys={unlockedKeys} compact />
            </div>
          )}

          {/* Sidebar footer */}
          <div className="p-4 border-t border-border-slate/40 space-y-2">
            <div className="text-[9px] text-text-muted/40 uppercase tracking-widest">Health &amp; Habit OS v1.0</div>
            <div className="text-[9px] text-text-muted/30">by Salah Uddin Kader</div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 lg:ml-56 min-h-[calc(100vh-3rem)] px-4 py-6 md:px-8 md:py-8 pb-28 lg:pb-12">
          {renderActivePage()}

          {/* ── FOOTER ── */}
          <footer className="mt-16 border-t border-border-slate/40 pt-10 pb-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Brand */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-accent-purple" />
                  <span className="font-extrabold text-base text-text-white font-outfit">Health &amp; Habit OS</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  An offline-first PWA to help you build better daily, weekly, and monthly habits — powered by AI coaching and real-time sync.
                </p>
                <div className="flex items-center space-x-1.5 text-[10px] text-text-muted/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-emerald inline-block animate-pulse" />
                  <span>All systems running</span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Quick Links</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className="text-xs text-text-muted hover:text-accent-purple transition-colors text-left"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Developer */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Developer</div>
                <div className="space-y-2 text-xs text-text-muted">
                  <div className="font-semibold text-text-white">Salah Uddin Kader</div>
                  <a href="https://salahuddin.codes" target="_blank" rel="noopener noreferrer" className="block hover:text-accent-purple transition-colors">
                    salahuddin.codes
                  </a>
                  <a href="https://github.com/salahuddingfx" target="_blank" rel="noopener noreferrer" className="block hover:text-accent-purple transition-colors">
                    github.com/salahuddingfx
                  </a>
                  <button
                    onClick={() => setActivePage('developer')}
                    className="text-accent-purple text-[10px] font-bold hover:underline"
                  >
                    View Developer Profile →
                  </button>
                </div>
              </div>
            </div>

            {/* Copyright bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-border-slate/20 text-[10px] text-text-muted/40">
              <span>© {new Date().getFullYear()} Health &amp; Habit OS — Built with ❤️ by Salah Uddin Kader</span>
              <div className="flex items-center space-x-3">
                <span>v1.0.0</span>
                <span>·</span>
                <span>Open Source</span>
                <span>·</span>
                <span>PWA Ready</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BOTTOM NAV — mobile only (hidden on lg+), fixed
      ══════════════════════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-dark/95 border-t border-border-slate/70 backdrop-blur-xl shadow-2xl shadow-black/60">
        <div className="flex overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center py-2.5 px-3 min-w-[58px] space-y-0.5 transition-all relative ${
                  isSelected ? 'text-accent-purple' : 'text-text-muted hover:text-text-white'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 bg-accent-purple rounded-b-full" />
                )}
                <Icon className={`h-5 w-5 transition-transform ${isSelected ? 'scale-110' : ''}`} />
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Notification Banner ── */}
      {activeBanner && (
        <div className="fixed top-14 right-4 left-4 md:left-auto md:w-96 bg-surface-dark border border-border-slate rounded-xl shadow-2xl p-4 flex flex-col z-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-7 w-7 rounded-lg bg-accent-purple/20 flex items-center justify-center text-accent-purple font-bold text-xs">H</div>
              <div>
                <div className="text-xs font-bold text-text-white">{activeBanner.title}</div>
                <div className="text-[9px] text-text-muted/60">{activeBanner.timestamp}</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={toggleExpandBanner} className="text-text-muted hover:text-text-white p-0.5 rounded">
                {activeBanner.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button onClick={dismissBanner} className="text-text-muted hover:text-text-white p-0.5 rounded">
                <LogOut className="h-4 w-4 rotate-90" />
              </button>
            </div>
          </div>
          {activeBanner.expanded && (
            <div className="mt-3 text-[11px] text-text-muted border-t border-border-slate/40 pt-2">
              {activeBanner.subtitle}
            </div>
          )}
        </div>
      )}

      <InstallBanner />
      <Toaster position="top-right" theme={theme === 'dark' ? 'dark' : 'light'} />
    </div>
  );
}
