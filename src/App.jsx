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
import IntroLoader     from './components/IntroLoader.jsx';
import Navbar          from './components/Navbar.jsx';
import MobileNav       from './components/MobileNav.jsx';

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
  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    // read saved preference; default = light
    return localStorage.getItem('theme') || 'light';
  });

  // Dropdown state for Top Navigation drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply theme class on mount and whenever theme changes
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  // Keyboard navigation shortcuts (Alt + 1-5)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
        return;
      }

      if (e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const shortcutMap = {
          '1': 'dashboard',
          '2': 'goals',
          '3': 'plans',
          '4': 'challenges',
          '5': 'food'
        };
        const page = shortcutMap[e.key];
        if (page) {
          setActivePage(page);
          const pageNames = {
            'dashboard': t('home') || 'Home',
            'goals': t('habits') || 'Habits',
            'plans': t('plans') || 'Plans',
            'challenges': t('challenges') || 'Challenges',
            'food': t('food') || 'Food'
          };
          toast.info(`Switched to ${pageNames[page]}`, { duration: 1500 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActivePage, t]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // ── Intro Loader ──────────────────────────────────────────────────────
  if (booting) {
    return <IntroLoader onComplete={() => setBooting(false)} />;
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

  const primaryNavIds = ['dashboard', 'goals', 'plans', 'challenges', 'food'];
  const primaryNavItems = navItems.filter(item => primaryNavIds.includes(item.id));
  const secondaryNavItems = navItems.filter(item => !primaryNavIds.includes(item.id) && !['profile', 'developer', 'admin'].includes(item.id));
  const profileNavItems = navItems.filter(item => ['profile', 'developer', 'admin'].includes(item.id));

  // ── Main Layout ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background-dark text-text-white transition-colors duration-300">

      <Navbar
        user={user}
        isOnline={isOnline}
        pendingCount={pendingCount}
        syncOfflineData={syncOfflineData}
        lang={lang}
        switchLang={switchLang}
        theme={theme}
        toggleTheme={toggleTheme}
        logout={logout}
        activePage={activePage}
        setActivePage={setActivePage}
        t={t}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        primaryNavItems={primaryNavItems}
        secondaryNavItems={secondaryNavItems}
        profileNavItems={profileNavItems}
      />

      <MobileNav
        user={user}
        isGuest={isGuest}
        isOffline={isOffline}
        activePage={activePage}
        setActivePage={setActivePage}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        primaryNavItems={primaryNavItems}
        secondaryNavItems={secondaryNavItems}
        profileNavItems={profileNavItems}
        logout={logout}
      />

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
