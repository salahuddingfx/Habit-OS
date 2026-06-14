import React from 'react';
import { LogOut } from 'lucide-react';

export default function MobileNav({
  user,
  isGuest,
  isOffline,
  activePage,
  setActivePage,
  mobileMenuOpen,
  setMobileMenuOpen,
  primaryNavItems,
  secondaryNavItems,
  profileNavItems,
  logout
}) {
  if (!mobileMenuOpen) return null;

  return (
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
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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
            className="w-full flex items-center justify-center space-x-2 py-3 bg-error-red/10 border border-error-red/30 hover:bg-error-red text-error-red hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
