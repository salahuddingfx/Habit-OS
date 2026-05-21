import { create } from 'zustand';

const API_URL = 'http://localhost:5000/api';

// ── Tier helper ────────────────────────────────────────────────────────────
function calcTier(xp) {
  if (xp < 100)  return 'Bronze';
  if (xp < 300)  return 'Silver';
  if (xp < 600)  return 'Gold';
  if (xp < 1000) return 'Platinum';
  return 'Titan';
}

// ── Offline-safe fetch ─────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 6000); // 6s timeout
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export const useAuthStore = create((set, get) => ({
  user:        JSON.parse(localStorage.getItem('user'))        || null,
  accessToken: localStorage.getItem('accessToken')             || null,
  isGuest:     JSON.parse(localStorage.getItem('isGuest'))     || false,
  isOffline:   false,
  error:       null,
  loading:     false,

  // ── Guest mode ───────────────────────────────────────────────────────────
  setGuestMode: () => {
    const guestUser = {
      id:            'guest_' + Math.random().toString(36).substring(2, 9),
      username:      'Guest Coach',
      xp:            15,
      streak:        1,
      tier:          'Bronze',
      region:        'Global',
      height:        175,
      weight:        70,
      age:           25,
      gender:        'other',
      activityLevel: 'sedentary',
    };
    localStorage.setItem('user',    JSON.stringify(guestUser));
    localStorage.setItem('isGuest', 'true');
    localStorage.removeItem('accessToken');
    set({ user: guestUser, isGuest: true, accessToken: null, error: null, isOffline: false });
  },

  // ── Login ────────────────────────────────────────────────────────────────
  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res  = await apiFetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('user',        JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('isGuest',     'false');
      set({ user: data.user, accessToken: data.accessToken, isGuest: false, loading: false, isOffline: false });
      return true;
    } catch (err) {
      // Network error / timeout — try offline login with cached credentials
      if (err.name === 'AbortError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        const cached = JSON.parse(localStorage.getItem('user'));
        if (cached && cached.username === username) {
          set({ user: cached, isGuest: false, isOffline: true, loading: false, error: null,
            accessToken: localStorage.getItem('accessToken') });
          return true;
        }
        set({ error: 'Server unreachable. No cached account found for offline login.', loading: false });
      } else {
        set({ error: err.message, loading: false });
      }
      return false;
    }
  },

  // ── Signup ───────────────────────────────────────────────────────────────
  signup: async (username, password, options = {}) => {
    let region = 'Global';
    let role = 'user';
    let fullName = '';
    let email = '';
    let secretKey = '';
    if (typeof options === 'string') {
      region = options;
    } else if (options) {
      region = options.region || 'Global';
      role = options.role || 'user';
      fullName = options.fullName || '';
      email = options.email || '';
      secretKey = options.secretKey || '';
    }

    set({ loading: true, error: null });
    try {
      const res  = await apiFetch(`${API_URL}/auth/signup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password, fullName, email, secretKey, region, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('user',        JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('isGuest',     'false');
      set({ user: data.user, accessToken: data.accessToken, isGuest: false, loading: false });
      return true;
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        set({ error: 'Cannot reach the server. Please check your connection and try again.', loading: false });
      } else {
        set({ error: err.message, loading: false });
      }
      return false;
    }
  },

  // ── Update profile ───────────────────────────────────────────────────────
  updateProfile: async (profileData) => {
    const { isGuest, isOffline, accessToken, user } = get();

    // Always update locally first
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });

    if (isGuest || isOffline) return true;

    try {
      const res  = await apiFetch(`${API_URL}/auth/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user });
    } catch (_) { /* saved locally at least */ }
    return true;
  },

  // ── Add XP ───────────────────────────────────────────────────────────────
  addXP: async (xpAmount) => {
    const { isGuest, isOffline, accessToken, user } = get();
    if (!user) return;

    const newXp      = (user.xp || 0) + xpAmount;
    const updatedUser = { ...user, xp: newXp, tier: calcTier(newXp) };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });

    if (isGuest || isOffline) return;

    try {
      const res  = await apiFetch(`${API_URL}/auth/xp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ xpAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        const synced = { ...user, xp: data.xp, tier: data.tier };
        localStorage.setItem('user', JSON.stringify(synced));
        set({ user: synced });
      }
    } catch (_) { /* XP already updated locally */ }
  },

  // ── Logout ───────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('isGuest');
    set({ user: null, accessToken: null, isGuest: false, isOffline: false, error: null });
  },
}));
