import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  activeBanner: null,

  showInAppBanner: (title, subtitle, type = 'info') => {
    const newBanner = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      subtitle,
      type,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      expanded: false
    };

    set({ activeBanner: newBanner });

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      const { activeBanner } = get();
      if (activeBanner && activeBanner.id === newBanner.id) {
        set({ activeBanner: null });
      }
    }, 6000);
  },

  dismissBanner: () => {
    set({ activeBanner: null });
  },

  toggleExpandBanner: () => {
    const { activeBanner } = get();
    if (activeBanner) {
      set({
        activeBanner: {
          ...activeBanner,
          expanded: !activeBanner.expanded
        }
      });
    }
  }
}));
