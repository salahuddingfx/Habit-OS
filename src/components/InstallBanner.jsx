import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (e) => {
      // Prevent chrome/android default prompt
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
      
      // Post Sonner notification offering install
      toast('Installable App Available', {
        description: 'Add Health & Habit OS to your home screen for offline access.',
        action: {
          label: 'Install',
          onClick: () => triggerInstall(e)
        }
      });
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const triggerInstall = async (promptObj = deferredPrompt) => {
    if (!promptObj) return;
    
    promptObj.prompt();
    const { outcome } = await promptObj.userChoice;
    console.log(`[PWA Install] User choice outcome: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-surface-dark border border-border-slate p-4 rounded-xl shadow-2xl flex items-center justify-between z-50 animate-slide-up">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-accent-purple/10 rounded-lg text-accent-purple">
          <Download className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-text-white">Install Health & Habit OS</div>
          <div className="text-[10px] text-text-muted">Launch full screen & run offline</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => triggerInstall()}
          className="bg-accent-purple hover:bg-accent-hover text-text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="text-text-muted hover:text-text-white p-1 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
