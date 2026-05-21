import { create } from 'zustand';
import { db } from '../services/db.js';
import { useAuthStore } from './authStore.js';

const API_URL = 'http://localhost:5000/api';

export const useSyncStore = create((set, get) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingCount: 0,

  initializeListener: () => {
    const updateOnlineStatus = () => {
      set({ isOnline: navigator.onLine });
      if (navigator.onLine) {
        get().syncOfflineData();
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial count
    get().updatePendingCount();

    // Poll count periodically
    setInterval(() => {
      get().updatePendingCount();
    }, 5000);
  },

  updatePendingCount: async () => {
    try {
      const count = await db.syncQueue.count();
      set({ pendingCount: count });
    } catch (err) {
      console.error('Failed to count pending sync mutations:', err);
    }
  },

  syncOfflineData: async () => {
    const { isOnline, isSyncing } = get();
    if (!isOnline || isSyncing) return;

    const auth = useAuthStore.getState();
    if (auth.isGuest || !auth.accessToken) {
      // Guest mode does not upload to backend
      return;
    }

    set({ isSyncing: true });
    
    try {
      const queueItems = await db.syncQueue.toArray();
      if (queueItems.length === 0) {
        set({ isSyncing: false });
        return;
      }

      console.log(`[Sync Engine] Uploading ${queueItems.length} mutations to cloud...`);
      
      const res = await fetch(`${API_URL}/goals/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.accessToken}`
        },
        body: JSON.stringify({ mutations: queueItems })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sync failed');
      
      // Process successful sync results
      const results = data.syncResults || [];
      for (const item of results) {
        if (item.status === 'synced') {
          // If syncing a goal, update local record with the backend DB ID if needed
          // Then remove this queue item
        }
      }

      // Clear synced records from the queue
      const idsToRemove = queueItems.map(item => item.id);
      await db.syncQueue.bulkDelete(idsToRemove);
      
      // Award any XP earned from synced items
      if (data.xpEarned > 0) {
        auth.addXP(data.xpEarned);
      }

      console.log('✅ Sync process completed successfully.');
    } catch (err) {
      console.error('❌ Sync failed:', err.message);
    } finally {
      set({ isSyncing: false });
      get().updatePendingCount();
    }
  }
}));
