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
  Users, Bell, LayoutDashboard, Menu, X
} from 'lucide-react';

export default function App() {
  const { user, isGuest, isOffline, logout } = useAuthStore();
  const { initializeListener, isOnline, syncOfflineData, pendingCount } = useSyncStore();
  const { loadLocalGoals, goals } = useGoalStore();
  const { activeBanner, toggleExpandBanner, dismissBanner } = useNotificationStore();
  const { loadBadges, checkAndUnlock, unlockedKeys } = useBadgeStore();
  const { lang, switchLang, t } = useLang();

  const [booting, setBooting] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    // read saved preference; default = light
    return localStorage.getItem('theme') || 'light';
  });

  // Dropdown states for Top Navigation layout
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply theme class on mount and whenever theme changes
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Modern boot sequence progress calculation over 2.0 seconds
  useEffect(() => {
    let start = null;
    const duration = 2000;
    let frameId;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const currentProgress = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(currentProgress);

      if (elapsed < duration) {
        frameId = requestAnimationFrame(animate);
      } else {
        setBooting(false);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const getBootMessage = () => {
    if (progress >= 85) return 'Realtime Services Online...';
    if (progress >= 65) return 'Syncing AI Systems...';
    if (progress >= 45) return 'Connecting Local Database...';
    if (progress >= 25) return 'Loading Habit Engine...';
    return 'Initializing Health Core...';
  };

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

  // ── Premium Glassmorphic Intro Loader ───────────────────────────────────
  if (booting) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Ambient neon gradient blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-purple/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-success-emerald/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />

        <div className="w-full max-w-md bg-surface-dark/60 border border-border-slate/80 rounded-2xl p-8 shadow-2xl relative backdrop-blur-xl z-10 text-center space-y-6">
          {/* Top subtle line */}
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-accent-purple to-transparent opacity-80" />

          {/* Logo container */}
          <div className="relative inline-flex items-center justify-center p-5 bg-accent-purple/10 border border-accent-purple/20 rounded-2xl text-accent-purple mb-1">
            <Shield className="h-10 w-10 animate-pulse" />
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-accent-purple animate-bounce" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight font-outfit bg-clip-text text-transparent bg-gradient-to-r from-text-white via-text-white to-accent-purple">
              Health &amp; Habit OS
            </h1>
            <p className="text-xs text-text-muted uppercase tracking-widest font-semibold">
              Your Personal Wellness Dashboard
            </p>
          </div>

          {/* Log Message */}
          <div className="h-5 text-xs font-bold text-accent-purple tracking-wide">
            {getBootMessage()}
          </div>

          {/* Progress Bar & percentage */}
          <div className="space-y-2.5 pt-2">
            <div className="flex justify-between text-[10px] font-extrabold text-text-muted uppercase tracking-wider px-1">
              <span>Systems Initialization</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-border-slate/20 h-2 rounded-full overflow-hidden p-[1px]">
              <div
                className="bg-gradient-to-r from-accent-purple to-purple-500 h-full rounded-full transition-all duration-75 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
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

  const primaryNavIds = ['dashboard', 'goals', 'plans', 'challenges', 'food'];
  const primaryNavItems = navItems.filter(item => primaryNavIds.includes(item.id));
  const secondaryNavItems = navItems.filter(item => !primaryNavIds.includes(item.id) && !['profile', 'developer', 'admin'].includes(item.id));
  const profileNavItems = navItems.filter(item => ['profile', 'developer', 'admin'].includes(item.id));

  // ── Main Layout ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background-dark text-text-white transition-colors duration-300">

      {/* ══════════════════════════════════════════════════════════════════
          TOP STATUS & NAVIGATION BAR — sticky, unified layout
      ══════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 bg-surface-dark/95 border-b border-border-slate/60 backdrop-blur-xl shadow-lg shadow-black/5">
        {/* Left Side: Brand & Primary Tabs */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => { setActivePage('dashboard'); setMobileMenuOpen(false); }}>
            <div className="p-1.5 bg-accent-purple/10 border border-accent-purple/20 rounded-lg text-accent-purple flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight font-outfit text-text-white">Health &amp; Habit OS</span>
          </div>

          {/* Desktop Core Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setMoreMenuOpen(false);
                    setProfileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/20'
                      : 'text-text-muted hover:text-text-white hover:bg-border-slate/20 border-transparent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Desktop "More" Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setMoreMenuOpen(!moreMenuOpen);
                  setProfileMenuOpen(false);
                }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  secondaryNavItems.some(i => i.id === activePage)
                    ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/20'
                    : 'text-text-muted hover:text-text-white hover:bg-border-slate/20 border-transparent'
                }`}
              >
                <span>{t('more')}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop "More" Dropdown Menu */}
              {moreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                  <div className="absolute left-0 mt-2 w-56 rounded-xl bg-surface-dark border border-border-slate/60 shadow-xl p-2 z-50 animate-[fade-in_0.15s_ease-out] text-left">
                    {secondaryNavItems.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activePage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActivePage(item.id);
                            setMoreMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-accent-purple/15 text-accent-purple'
                              : 'text-text-muted hover:text-text-white hover:bg-border-slate/20'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* Right Side Controls & Profile Dropdown */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Online status indicator */}
          <div className="flex items-center space-x-1.5 bg-border-slate/10 border border-border-slate/20 rounded-full px-2.5 py-1 text-[10px] text-text-muted font-semibold">
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-success-emerald animate-pulse' : 'bg-error-red'}`} />
            <span className="hidden sm:block">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sync indicator */}
          {pendingCount > 0 && (
            <button onClick={syncOfflineData} className="text-accent-purple flex items-center space-x-1 text-[10px] font-bold bg-accent-purple/10 border border-accent-purple/20 px-2 py-1 rounded-full animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{pendingCount}</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => switchLang(lang === 'en' ? 'bn' : 'en')}
            className="p-2 text-text-muted hover:text-accent-purple transition-colors rounded-xl hover:bg-accent-purple/10 text-[10px] font-extrabold tracking-tight flex items-center space-x-0.5"
            title={lang === 'en' ? 'Switch to Bangla' : 'Switch to English'}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline ml-0.5">{lang === 'en' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="p-2 text-text-muted hover:text-text-white transition-colors rounded-xl hover:bg-border-slate/20">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Profile Dropdown Trigger (Desktop) */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setMoreMenuOpen(false);
              }}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                profileMenuOpen || ['profile', 'developer', 'admin'].includes(activePage)
                  ? 'bg-accent-purple/10 border-accent-purple/30 text-text-white'
                  : 'border-border-slate/50 hover:bg-border-slate/20 hover:border-border-slate text-text-white'
              }`}
            >
              <div className="h-6 w-6 rounded-lg bg-accent-purple/20 flex items-center justify-center text-accent-purple font-black text-xs font-outfit">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold hidden sm:block truncate max-w-[80px]">{user.username}</span>
              <ChevronDown className={`h-3 w-3 text-text-muted transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-dark border border-border-slate/60 shadow-xl p-2 z-50 animate-[fade-in_0.15s_ease-out] text-left">
                  {/* User Tier Details */}
                  <div className="px-3 py-2 border-b border-border-slate/30 mb-1.5">
                    <div className="text-xs font-bold text-text-white truncate">{user.username}</div>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-[9px] font-bold text-accent-purple uppercase tracking-wider bg-accent-purple/10 px-1.5 py-0.5 rounded border border-accent-purple/20">
                        {user.tier || 'Bronze'}
                      </span>
                      {isGuest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Guest</span>}
                      {isOffline && !isGuest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">Offline</span>}
                    </div>
                  </div>

                  {profileNavItems.map((item) => {
                    const Icon = item.icon;
                    const isSelected = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActivePage(item.id);
                          setProfileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-accent-purple/15 text-accent-purple'
                            : 'text-text-muted hover:text-text-white hover:bg-border-slate/20'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  <div className="border-t border-border-slate/30 my-1.5" />

                  <button
                    onClick={() => {
                      logout();
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-error-red hover:bg-error-red/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-muted hover:text-text-white transition-colors rounded-xl bg-border-slate/10 hover:bg-border-slate/20"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── MOBILE NAV DRAWER — overlay drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 flex">
          {/* Blur backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer content */}
          <div className="relative w-80 max-w-[85vw] bg-surface-dark border-r border-border-slate/60 h-full flex flex-col z-50 p-5 shadow-2xl animate-[slide-in_0.2s_ease-out] overflow-y-auto pb-10 text-left">
            {/* User card header */}
            <div className="flex items-center space-x-3 pb-5 border-b border-border-slate/40 mb-4">
              <div className="h-10 w-10 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple font-black text-sm font-outfit">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-text-white truncate">{user.username}</div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[9px] font-bold text-accent-purple uppercase tracking-wider bg-accent-purple/10 px-1.5 py-0.5 rounded border border-accent-purple/20">
                    {user.tier || 'Bronze'}
                  </span>
                  {isGuest && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Guest</span>}
                  {isOffline && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">Offline</span>}
                </div>
              </div>
            </div>

            {/* Menu groups */}
            <div className="flex-1 space-y-6">
              {/* Group 1: Core */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60 px-3">Core</div>
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25'
                          : 'text-text-muted hover:text-text-white hover:bg-border-slate/20'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Group 2: Features */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60 px-3">Features</div>
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25'
                          : 'text-text-muted hover:text-text-white hover:bg-border-slate/20'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Group 3: Account */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60 px-3">Account</div>
                {profileNavItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25'
                          : 'text-text-muted hover:text-text-white hover:bg-border-slate/20'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout button at bottom of mobile drawer */}
            <div className="mt-6 pt-4 border-t border-border-slate/40">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-error-red/10 border border-error-red/30 hover:bg-error-red text-error-red hover:text-white font-bold text-sm rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="pt-16 min-h-screen flex flex-col bg-background-dark">

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8 pb-16">
          {renderActivePage()}

          {/* ── FOOTER ── */}
          <footer className="mt-16 border-t border-border-slate/40 pt-10 pb-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
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
