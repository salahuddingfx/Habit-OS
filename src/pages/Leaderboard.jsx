import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { Trophy, Shield, MapPin, Award, Flame } from 'lucide-react';

export default function Leaderboard() {
  const { user, accessToken, isGuest } = useAuthStore();
  const [filter, setFilter] = useState('global'); // global, regional
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);

  // Mock list used when offline or in guest sandbox mode
  const mockBoard = [
    { rank: 1, username: 'QuantumCoder', xp: 1250, streak: 14, tier: 'Titan', region: 'Global' },
    { rank: 2, username: 'Lovelace', xp: 850, streak: 8, tier: 'Platinum', region: 'Europe' },
    { rank: 3, username: 'AuraWalker', xp: 540, streak: 5, tier: 'Gold', region: 'North America' },
    { rank: 4, username: 'Zenith', xp: 320, streak: 4, tier: 'Gold', region: 'Global' },
    { rank: 5, username: 'ApexHustler', xp: 180, streak: 2, tier: 'Silver', region: 'Asia' },
    { rank: 6, username: 'NomadFit', xp: 90, streak: 1, tier: 'Bronze', region: 'Global' }
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (isGuest || !accessToken) {
        // Fallback mock board in Sandbox Guest mode
        const myData = {
          rank: 5,
          username: user?.username || 'Guest Operator',
          xp: user?.xp || 15,
          streak: user?.streak || 1,
          tier: user?.tier || 'Bronze',
          region: user?.region || 'Global'
        };
        const updatedList = [...mockBoard];
        if (!updatedList.some(item => item.username === myData.username)) {
          updatedList.push(myData);
        }
        
        // Sort and re-rank
        updatedList.sort((a, b) => b.xp - a.xp);
        const rankedList = updatedList.map((item, idx) => ({ ...item, rank: idx + 1 }));
        setLeaderboard(rankedList);
        setUserRank(rankedList.find(item => item.username === myData.username));
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/leaderboard?filter=${filter}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (res.ok) {
          setLeaderboard(data.leaderboard);
          setUserRank(data.userRank);
        } else {
          throw new Error('Leaderboard fetch failed');
        }
      } catch (err) {
        console.error(err);
        // Fallback to offline mock board
        setLeaderboard(mockBoard);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filter, user?.xp, isGuest]);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Titan': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'Platinum': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'Gold': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'Silver': return 'text-gray-300 border-gray-500/30 bg-gray-500/10';
      default: return 'text-amber-600 border-amber-600/30 bg-amber-600/10';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Operator Ranks</h1>
          <p className="text-sm text-text-muted">Synchronized nodes ranking performance, streaks, and network XP tiers.</p>
        </div>

        {/* Filters */}
        <div className="flex bg-surface-dark border border-border-slate rounded-lg p-1 self-start">
          <button
            onClick={() => setFilter('global')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md tracking-wider transition-colors ${
              filter === 'global' ? 'bg-accent-purple text-text-white' : 'text-text-muted hover:text-text-white'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setFilter('regional')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md tracking-wider transition-colors ${
              filter === 'regional' ? 'bg-accent-purple text-text-white' : 'text-text-muted hover:text-text-white'
            }`}
          >
            Regional
          </button>
        </div>
      </div>

      {/* Ranks list */}
      <div className="bg-surface-dark border border-border-slate rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-border-slate/40 flex justify-between items-center bg-background-dark/30">
          <span className="text-xs uppercase font-bold text-text-muted tracking-widest flex items-center space-x-1.5">
            <Trophy className="h-4 w-4 text-accent-purple" />
            <span>Leaderboard Nodes</span>
          </span>
          {userRank && (
            <span className="text-xs text-text-muted font-medium">
              Your Rank: <strong className="text-accent-purple">#{userRank.rank}</strong>
            </span>
          )}
        </div>

        <div className="divide-y divide-border-slate/40">
          {leaderboard.map((row) => {
            const isMe = row.username === user?.username;
            return (
              <div
                key={row.username}
                className={`px-6 py-4.5 flex items-center justify-between transition-colors ${
                  isMe ? 'bg-accent-purple/5' : 'hover:bg-background-dark/10'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank Badge */}
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    row.rank === 1 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
                    row.rank === 2 ? 'bg-gray-300/10 text-gray-300 border border-gray-300/30' :
                    row.rank === 3 ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30' :
                    'text-text-muted border border-border-slate/40'
                  }`}>
                    {row.rank}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${isMe ? 'text-accent-purple' : 'text-text-white'}`}>
                        {row.username}
                      </span>
                      {isMe && <span className="text-[9px] uppercase font-bold bg-accent-purple/20 text-accent-purple px-1.5 py-0.5 rounded">You</span>}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-[10px] text-text-muted/70 mt-0.5">
                      <span className="flex items-center space-x-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{row.region || 'Global'}</span>
                      </span>
                      <span className="flex items-center space-x-0.5">
                        <Flame className="h-3 w-3 text-orange-400" />
                        <span>{row.streak || 1} day streak</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Tier Label */}
                  <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${getTierColor(row.tier)}`}>
                    {row.tier}
                  </span>
                  
                  {/* XP */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-text-white">{row.xp}</div>
                    <div className="text-[9px] uppercase font-bold text-text-muted/50 tracking-wider">XP</div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
