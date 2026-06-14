import React, { useState, useEffect } from 'react';
import { Shield, Sparkles } from 'lucide-react';

export default function IntroLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);

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
        onComplete();
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  const getBootMessage = () => {
    if (progress >= 85) return 'Realtime Services Online...';
    if (progress >= 65) return 'Syncing AI Systems...';
    if (progress >= 45) return 'Connecting Local Database...';
    if (progress >= 25) return 'Loading Habit Engine...';
    return 'Initializing Health Core...';
  };

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
