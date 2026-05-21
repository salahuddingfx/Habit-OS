import { create } from 'zustand';

export const useAdminStore = create((set, get) => ({
  users: [],
  stats: null,
  logs: [],
  loading: false,
  error: null,

  fetchUsers: async (token) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
      set({ users: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateUser: async (token, userId, updates) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user');
      
      // Update in local state
      const users = get().users.map((u) => (u._id === userId ? { ...u, ...data.user } : u));
      set({ users, loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  deleteUser: async (token, userId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete user');

      const users = get().users.filter((u) => u._id !== userId);
      set({ users, loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  fetchStats: async (token) => {
    set({ error: null });
    try {
      const res = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch stats');
      set({ stats: data });
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchLogs: async (token) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        set({ logs: data });
      }
    } catch (err) {
      console.error('Fetch logs error:', err.message);
    }
  },

  sendBroadcast: async (token, title, subtitle, type = 'info') => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('http://localhost:5000/api/admin/broadcast', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, subtitle, type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Broadcast failed');
      set({ loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  seedDatabase: async (token) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('http://localhost:5000/api/admin/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Seeding failed');
      set({ loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  }
}));
