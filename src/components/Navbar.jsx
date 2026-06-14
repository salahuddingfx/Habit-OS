import React, { useState } from 'react';
import { Shield, ChevronDown, RefreshCw, Globe, Sun, Moon, LogOut, Menu, X } from 'lucide-react';

export default function Navbar({
  user,
  isOnline,
  pendingCount,
  syncOfflineData,
  lang,
  switchLang,
  theme,
  toggleTheme,
  logout,
  activePage,
  setActivePage,
  t,
  mobileMenuOpen,
  setMobileMenuOpen,
  primaryNavItems,
  secondaryNavItems,
  profileNavItems
}) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Tier progress calculations
  const currentXp = user.xp || 0;
  let minXp = 0;
  let maxXp = 100;
  if (currentXp >= 1000) {
    minXp = 1000;
    maxXp = 1000;
  } else if (currentXp >= 600) {
    minXp = 600;
    maxXp = 1000;
  } else if (currentXp >= 300) {
    minXp = 300;
    maxXp = 600;
  } else if (currentXp >= 100) {
    minXp = 100;
    maxXp = 300;
  }

  const range = maxXp - minXp;
  const pct = range > 0 ? Math.min(((currentXp - minXp) / range) * 100, 100) : 100;

  // SVG parameters for avatar progress ring
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/95 border-b border-border-slate/60 backdrop-blur-xl shadow-lg shadow-black/5 h-16">
      <div className="w-full h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Left Side: Brand & Primary Tabs */}
        <div className="flex items-center space-x-6 flex-1 md:flex-initial">
          <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => { setActivePage('dashboard'); setMobileMenuOpen(false); }}>
            <div className="p-1.5 h-9 w-9 bg-accent-purple/10 border border-accent-purple/20 rounded-lg text-accent-purple flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight font-outfit text-text-white whitespace-nowrap">Health &amp; Habit OS</span>
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
                  className={`relative flex items-center justify-center space-x-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-all border cursor-pointer min-w-[95px] ${
                    isSelected
                      ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/10'
                      : 'text-text-muted hover:text-text-white hover:bg-border-slate/20 border-transparent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {isSelected && (
                    <span className="absolute bottom-[-1px] left-4 right-4 h-[2px] bg-accent-purple rounded-t-full shadow-[0_-2px_8px_rgba(124,58,237,0.8)]" />
                  )}
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
                className={`relative flex items-center justify-center space-x-1 px-3 h-10 rounded-xl text-xs font-bold transition-all border cursor-pointer min-w-[85px] ${
                  secondaryNavItems.some(i => i.id === activePage)
                    ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/20'
                    : 'text-text-muted hover:text-text-white hover:bg-border-slate/20 border-transparent'
                }`}
              >
                <span>{t('more')}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 shrink-0 ${moreMenuOpen ? 'rotate-180' : ''}`} />
                {secondaryNavItems.some(i => i.id === activePage) && (
                  <span className="absolute bottom-[-1px] left-4 right-4 h-[2px] bg-accent-purple rounded-t-full shadow-[0_-2px_8px_rgba(124,58,237,0.8)]" />
                )}
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
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-accent-purple/15 text-accent-purple'
                              : 'text-text-muted hover:text-text-white hover:bg-border-slate/20'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
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
          <div className="flex items-center justify-center space-x-1.5 bg-border-slate/10 border border-border-slate/20 rounded-full px-2.5 h-8 text-[10px] text-text-muted font-semibold">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isOnline ? 'bg-success-emerald animate-pulse' : 'bg-error-red'}`} />
            <span className="hidden sm:block whitespace-nowrap">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sync indicator */}
          {pendingCount > 0 && (
            <button onClick={syncOfflineData} className="text-accent-purple flex items-center justify-center space-x-1 text-[10px] font-bold bg-accent-purple/10 border border-accent-purple/20 px-2.5 h-8 rounded-full animate-pulse cursor-pointer shrink-0">
              <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
              <span>{pendingCount}</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => switchLang(lang === 'en' ? 'bn' : 'en')}
            className="h-10 px-2.5 text-text-muted hover:text-accent-purple transition-colors rounded-xl hover:bg-accent-purple/10 text-[10px] font-extrabold tracking-tight flex items-center justify-center cursor-pointer min-w-[50px]"
            title={lang === 'en' ? 'Switch to Bangla' : 'Switch to English'}
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline ml-1">{lang === 'en' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="h-10 w-10 flex items-center justify-center text-text-muted hover:text-text-white transition-colors rounded-xl hover:bg-border-slate/20 cursor-pointer shrink-0">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Profile Dropdown Trigger (Desktop) */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setMoreMenuOpen(false);
              }}
              className={`flex items-center space-x-2 px-2 h-10 rounded-xl border transition-all cursor-pointer shrink-0 ${
                profileMenuOpen || ['profile', 'developer', 'admin'].includes(activePage)
                  ? 'bg-accent-purple/10 border-accent-purple/30 text-text-white shadow-inner'
                  : 'border-border-slate/50 hover:bg-border-slate/20 hover:border-border-slate text-text-white'
              }`}
              title={`Tier: ${user.tier || 'Bronze'} (${currentXp} XP)`}
            >
              <div className="relative h-8 w-8 flex items-center justify-center shrink-0">
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r={radius}
                    stroke="currentColor"
                    className="text-border-slate/20 dark:text-border-slate/40"
                    strokeWidth="2"
                    fill="transparent"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r={radius}
                    stroke="currentColor"
                    className="text-accent-purple transition-all duration-500 ease-out"
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="h-6 w-6 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple font-black text-[11px] font-outfit z-10 shrink-0">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              </div>
              <span className="text-xs font-bold hidden sm:block truncate max-w-[80px]">{user.username}</span>
              <ChevronDown className={`h-3 w-3 text-text-muted transition-transform duration-200 shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
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
                      {user.isGuest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-sans">Guest</span>}
                      {user.isOffline && !user.isGuest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-sans">Offline</span>}
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
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent-purple/15 text-accent-purple'
                            : 'text-text-muted hover:text-text-white hover:bg-border-slate/20'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
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
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-error-red hover:bg-error-red/10 transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 h-10 w-10 flex items-center justify-center text-text-muted hover:text-text-white transition-colors rounded-xl bg-border-slate/10 hover:bg-border-slate/20 cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 shrink-0" /> : <Menu className="h-5 w-5 shrink-0" />}
          </button>
        </div>
      </div>
    </header>
  );
}
