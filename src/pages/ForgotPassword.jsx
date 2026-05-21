import React, { useState } from 'react';
import { Shield, ArrowLeft, KeyRound, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function ForgotPassword({ onBack }) {
  const [username, setUsername] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !secretKey.trim() || !newPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, secretKey, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Recovery failed');

      setSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => {
        onBack();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark p-6 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-accent-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-success-emerald/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface-dark/60 border border-border-slate/80 rounded-2xl p-8 shadow-2xl relative backdrop-blur-xl z-10">
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-accent-purple to-transparent opacity-80" />

        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs text-text-muted hover:text-text-white transition-colors mb-6 font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 bg-accent-purple/10 border border-accent-purple/20 rounded-xl text-accent-purple mb-1">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight font-outfit text-text-white">
            Reset Password
          </h1>
          <p className="text-xs text-text-muted">
            Enter your username and secret key to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-error-red/10 border border-error-red/30 rounded-xl flex items-start space-x-2 text-xs text-error-red">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 bg-success-emerald/10 border border-success-emerald/30 rounded-xl flex items-start space-x-2 text-xs text-success-emerald">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted tracking-widest uppercase flex items-center space-x-1">
              <User className="h-3 w-3 text-accent-purple" />
              <span>Username</span>
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. salahuddin99"
              className="w-full bg-background-dark/80 border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/30 focus:outline-none focus:border-accent-purple transition-all"
              required
            />
          </div>

          {/* Secret Key */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted tracking-widest uppercase flex items-center space-x-1">
              <KeyRound className="h-3 w-3 text-accent-purple" />
              <span>Secret Recovery Key</span>
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Your secret phrase..."
              className="w-full bg-background-dark/80 border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/30 focus:outline-none focus:border-accent-purple transition-all"
              required
            />
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted tracking-widest uppercase flex items-center space-x-1">
              <Lock className="h-3 w-3 text-accent-purple" />
              <span>New Password</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background-dark/80 border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/30 focus:outline-none focus:border-accent-purple transition-all"
              required
            />
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted tracking-widest uppercase flex items-center space-x-1">
              <Lock className="h-3 w-3 text-accent-purple" />
              <span>Confirm Password</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background-dark/80 border border-border-slate rounded-xl px-4 py-3 text-sm text-text-white placeholder:text-text-muted/30 focus:outline-none focus:border-accent-purple transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-purple hover:bg-accent-hover text-white font-bold text-sm rounded-xl py-3 shadow-lg shadow-accent-purple/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
