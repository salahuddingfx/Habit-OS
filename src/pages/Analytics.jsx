import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useGoalStore } from '../store/goalStore.js';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, BarChart2, TrendingUp, Sparkles } from 'lucide-react';

export default function Analytics() {
  const { user, accessToken, isGuest } = useAuthStore();
  const { goals } = useGoalStore();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fallback mocks
  const mockAnalytics = {
    weeklyPerformance: [
      { name: 'Mon', score: 65 },
      { name: 'Tue', score: 80 },
      { name: 'Wed', score: 45 },
      { name: 'Thu', score: 90 },
      { name: 'Fri', score: 75 },
      { name: 'Sat', score: 100 },
      { name: 'Sun', score: 85 }
    ],
    xpGrowth: [
      { date: 'May 10', xp: 50 },
      { date: 'May 12', xp: 120 },
      { date: 'May 14', xp: 190 },
      { date: 'May 16', xp: 320 },
      { date: 'May 18', xp: 450 },
      { date: 'May 20', xp: 540 }
    ],
    heatmap: []
  };

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      if (isGuest || !accessToken) {
        // Build mock heatmap matching current date bounds
        const heatmap = [];
        const now = new Date();
        for (let i = 28; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          heatmap.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 4) // 0-3 completions
          });
        }
        setAnalyticsData({ ...mockAnalytics, heatmap });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/analytics', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (res.ok) {
          setAnalyticsData(data);
        } else {
          throw new Error('Analytics failed');
        }
      } catch (err) {
        console.error(err);
        setAnalyticsData(mockAnalytics);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [accessToken, isGuest, goals]);

  // Generate color opacity matching completion cell counts
  const getCellColor = (count) => {
    if (!count) return 'bg-border-slate/10 border border-border-slate/30';
    if (count === 1) return 'bg-accent-purple/20 border border-accent-purple/30';
    if (count === 2) return 'bg-accent-purple/50 border border-accent-purple/60';
    return 'bg-accent-purple border border-accent-purple';
  };

  if (!analyticsData) return <div className="text-center py-12">Querying Node Performance...</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Node Analytics</h1>
        <p className="text-sm text-text-muted">Aggregated performance trends, consistency models, and habit execution charts.</p>
      </div>

      {/* Contribution Heatmap */}
      <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-text-white flex items-center space-x-2">
          <Calendar className="h-4.5 w-4.5 text-accent-purple" />
          <span>Operator Consistency Matrix</span>
        </h2>
        
        {/* Heatmap Grid */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {analyticsData.heatmap?.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} habits completed`}
              className={`h-7 w-7 rounded-md heatmap-cell transition-all flex items-center justify-center text-[8px] font-bold text-text-white/60 hover:text-text-white ${getCellColor(cell.count)}`}
            >
              {cell.count > 0 && cell.count}
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-3 text-[10px] text-text-muted/60 pt-2 justify-end">
          <span>Less</span>
          <div className="h-3.5 w-3.5 rounded bg-border-slate/10 border border-border-slate/30"></div>
          <div className="h-3.5 w-3.5 rounded bg-accent-purple/20 border border-accent-purple/30"></div>
          <div className="h-3.5 w-3.5 rounded bg-accent-purple/50 border border-accent-purple/60"></div>
          <div className="h-3.5 w-3.5 rounded bg-accent-purple border border-accent-purple"></div>
          <span>More</span>
        </div>
      </div>

      {/* Recharts Displays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekly performance */}
        <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-text-white flex items-center space-x-2">
            <BarChart2 className="h-4.5 w-4.5 text-accent-purple" />
            <span>Weekly Target Consistency (%)</span>
          </h2>
          <div style={{ minHeight: '256px' }} className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.weeklyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A/30" vertical={false} />
                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0A0A0A', border: '1px solid #27272A', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#FAFAFA', fontWeight: 'bold' }}
                />
                <Bar dataKey="score" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* XP Growth Chart */}
        <div className="bg-surface-dark border border-border-slate rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-text-white flex items-center space-x-2">
            <TrendingUp className="h-4.5 w-4.5 text-accent-purple" />
            <span>Accumulated Network XP</span>
          </h2>
          <div style={{ minHeight: '256px' }} className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.xpGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A/30" vertical={false} />
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0A0A0A', border: '1px solid #27272A', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#FAFAFA', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="xp" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: '#7C3AED', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
