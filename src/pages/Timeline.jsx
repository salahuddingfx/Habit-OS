import React, { useEffect, useState } from 'react';
import { db } from '../services/db.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { Clock, Info, CheckSquare, RefreshCw, Sparkles, Award } from 'lucide-react';

export default function Timeline() {
  // Use Dexie live query to auto-refresh feed logs when items modify
  const activities = useLiveQuery(() => db.activities.orderBy('id').reverse().toArray()) || [];

  const getIcon = (type) => {
    switch (type) {
      case 'completed': return <CheckSquare className="h-4 w-4 text-success-emerald" />;
      case 'synced': return <RefreshCw className="h-4 w-4 text-blue-400" />;
      case 'ai': return <Sparkles className="h-4 w-4 text-accent-purple" />;
      case 'xp': return <Award className="h-4 w-4 text-yellow-400" />;
      default: return <Info className="h-4 w-4 text-text-muted" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Activity Log</h1>
        <p className="text-sm text-text-muted">Unified trace logs recording local changes, sync status, and XP rewards.</p>
      </div>

      <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 relative overflow-hidden">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-xs text-text-muted">
            No events registered in this local node. Begin logging habits on your dashboard.
          </div>
        ) : (
          <div className="relative border-l border-border-slate/50 ml-4 pl-8 space-y-8 py-2">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                
                {/* Connector Dot */}
                <div className="absolute -left-[45px] top-1.5 p-1.5 bg-background-dark border border-border-slate rounded-full group-hover:border-accent-purple transition-colors">
                  {getIcon(act.type)}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-text-white">{act.title}</h3>
                    <p className="text-xs text-text-muted">{act.description}</p>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    {act.xpEarned > 0 && (
                      <span className="text-[10px] font-bold text-success-emerald bg-success-emerald/10 border border-success-emerald/20 px-2 py-0.5 rounded flex items-center space-x-0.5">
                        <span>+{act.xpEarned} XP</span>
                      </span>
                    )}

                    <span className="text-[10px] font-bold text-text-muted/60 uppercase flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(act.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>

                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      act.synced === 1 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {act.synced === 1 ? 'Synced' : 'Local'}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
