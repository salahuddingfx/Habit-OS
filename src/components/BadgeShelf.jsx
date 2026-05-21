import React from 'react';
import {
  Target, Flame, Award, Crown, Star, Droplets,
  Sunrise, Moon, Zap, ClipboardList, TrendingUp,
  Swords, Smile, Scale, Trophy
} from 'lucide-react';
import { BADGE_DEFINITIONS } from '../store/badgeStore.js';

const ICON_MAP = {
  Target, Flame, Award, Crown, Star, Droplets,
  Sunrise, Moon, Zap, ClipboardList, TrendingUp,
  Swords, Smile, Scale, Trophy
};

export default function BadgeShelf({ unlockedKeys = new Set(), compact = false }) {
  return (
    <div className={`flex flex-wrap gap-3 ${compact ? '' : ''}`}>
      {BADGE_DEFINITIONS.map(badge => {
        const Icon    = ICON_MAP[badge.iconKey] || Trophy;
        const earned  = unlockedKeys.has(badge.key);
        return (
          <div key={badge.key} className="group relative flex flex-col items-center">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all
                ${earned
                  ? 'shadow-lg scale-100'
                  : 'opacity-30 grayscale'
                }`}
              style={earned ? {
                backgroundColor: badge.color + '20',
                borderColor:     badge.color + '60',
                boxShadow:       `0 4px 14px ${badge.color}30`
              } : {
                backgroundColor: 'transparent',
                borderColor:     'var(--color-border-slate)'
              }}
            >
              <Icon
                className="h-5 w-5"
                style={{ color: earned ? badge.color : 'var(--color-text-muted)' }}
              />
            </div>
            {!compact && (
              <span className={`mt-1.5 text-[9px] font-bold text-center max-w-[52px] leading-tight ${earned ? 'text-text-white' : 'text-text-muted/40'}`}>
                {badge.label}
              </span>
            )}

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-36 bg-surface-dark border border-border-slate/80 rounded-xl p-2.5 text-center shadow-xl z-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-[10px] font-bold text-text-white">{badge.label}</div>
              <div className="text-[9px] text-text-muted mt-0.5">{badge.desc}</div>
              {earned && <div className="text-[9px] text-success-emerald mt-1 font-bold">Unlocked!</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
