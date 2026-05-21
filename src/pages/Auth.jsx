import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import {
  Shield, Sparkles, UserCheck, Eye, EyeOff,
  Lock, User, MapPin, WifiOff, Wifi, AlertCircle, CheckCircle2
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function Auth() {
  const { login, signup, setGuestMode, error, loading } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username,   setUsername]   = useState('');
  const [password,   setPassword]   = useState('');
  const [region,     setRegion]     = useState('Global');
  const [role,       setRole]       = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [serverOnline, setServerOnline] = useState(null); // null=checking, true, false

  // Check server health on mount
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(4000) });
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    };
    check();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    if (isRegister) {
      await signup(username, password, region, role);
    } else {
      await login(username, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-accent-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-success-emerald/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface-dark/60 border border-border-slate/80 rounded-2xl p-8 shadow-2xl relative backdrop-blur-xl z-10">
        {/* Top accent line */}
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-accent-purple to-transparent opacity-80" />

        {/* Brand */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-accent-purple/10 border border-accent-purple/20 rounded-xl text-accent-purple mb-2 animate-pulse">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit bg-clip-text text-transparent bg-gradient-to-r from-text-white via-text-white to-accent-purple">
            Health &amp; Habit OS
          </h1>
          <p className="text-xs text-text-muted uppercase tracking-wider">Your personal health &amp; habit tracker</p>
        </div>

        {/* Server status */}
        <div className={`mb-5 flex items-center space-x-2 text-xs px-3 py-2 rounded-xl border ${
          serverOnline === null ? 'border-border-slate/40 text-text-muted bg-border-slate/10' :
          serverOnline          ? 'border-success-emerald/30 text-success-emerald bg-success-emerald/10' :
                                  'border-orange-500/30 text-orange-400 bg-orange-500/10'
        }`}>
          {serverOnline === null && <><Wifi className="h-3.5 w-3.5 animate-pulse" /><span>Checking server…</span></>}
          {serverOnline === true  && <><CheckCircle2 className="h-3.5 w-3.5" /><span>Server online — full sync enabled</span></>}
          {serverOnline === false && <><WifiOff className="h-3.5 w-3.5" /><span>Server offline — you can still login with cached data or continue as Guest</span></>}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 bg-error-red/10 border border-error-red/30 rounded-xl flex items-start space-x-2 text-xs text-error-red">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted tracking-wider uppercase flex items-center space-x-1">
              <User className="h-3 w-3 text-accent-purple" /><span>Username</span>
            </label>
            <input
              type="text" placeholder="e.g. operator_x"
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-background-dark/80 border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/30 focus:outline-none focus:border-accent-purple transition-all"
              required autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted tracking-wider uppercase flex items-center space-x-1">
              <Lock className="h-3 w-3 text-accent-purple" /><span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-background-dark/80 border border-border-slate rounded-xl pl-4 pr-11 py-3 text-sm text-text-white placeholder:text-text-muted/30 focus:outline-none focus:border-accent-purple transition-all"
                required autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-text-muted/60 hover:text-text-white transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Register extras */}
          {isRegister && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted tracking-wider uppercase flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-accent-purple" /><span>Region</span>
                </label>
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full bg-background-dark/80 border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white focus:outline-none focus:border-accent-purple transition-all">
                  <option value="Global">Global</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="Middle East">Middle East</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input type="checkbox" id="admin-toggle" checked={role === 'admin'}
                  onChange={e => setRole(e.target.checked ? 'admin' : 'user')}
                  className="rounded border-border-slate bg-background-dark text-accent-purple h-4 w-4 cursor-pointer" />
                <label htmlFor="admin-toggle" className="text-xs text-text-muted hover:text-text-white transition-colors cursor-pointer select-none">
                  Initialize as System Administrator
                </label>
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-accent-purple hover:bg-accent-hover text-white font-medium text-sm rounded-xl py-3 shadow-lg shadow-accent-purple/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center space-x-2">
            <UserCheck className="h-4 w-4" />
            <span>{loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-6 flex flex-col space-y-3 text-center font-outfit">
          <button onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-text-muted hover:text-accent-purple transition-colors font-medium">
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border-slate/40" />
            <span className="flex-shrink mx-4 text-[10px] text-text-muted/40 uppercase tracking-widest font-mono">Or</span>
            <div className="flex-grow border-t border-border-slate/40" />
          </div>

          <button onClick={setGuestMode}
            className="w-full bg-transparent border border-border-slate/80 hover:bg-border-slate/20 text-text-white font-medium text-xs rounded-xl py-2.5 transition-all flex items-center justify-center space-x-2">
            <Sparkles className="h-3.5 w-3.5 text-accent-purple animate-pulse" />
            <span>Continue as Guest</span>
          </button>

          {serverOnline === false && (
            <p className="text-[10px] text-text-muted/50 leading-relaxed">
              Make sure the backend server is running: <code className="text-accent-purple">cd server &amp;&amp; npm start</code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
