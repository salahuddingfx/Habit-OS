import User from '../models/User.js';
import { getDb } from '../utils/db.js';

// Calculate user tier based on XP
export function calculateTier(xp) {
  if (xp < 100) return 'Bronze';
  if (xp < 300) return 'Silver';
  if (xp < 600) return 'Gold';
  if (xp < 1000) return 'Platinum';
  return 'Titan';
}

const mockCompetitors = [
  { username: 'QuantumCoder', xp: 1250, streak: 14, tier: 'Titan', region: 'Global' },
  { username: 'Lovelace', xp: 850, streak: 8, tier: 'Platinum', region: 'Europe' },
  { username: 'AuraWalker', xp: 540, streak: 5, tier: 'Gold', region: 'North America' },
  { username: 'Zenith', xp: 320, streak: 4, tier: 'Gold', region: 'Global' },
  { username: 'ApexHustler', xp: 180, streak: 2, tier: 'Silver', region: 'Asia' },
  { username: 'NomadFit', xp: 90, streak: 1, tier: 'Bronze', region: 'Global' },
  { username: 'HelixStep', xp: 45, streak: 0, tier: 'Bronze', region: 'Europe' }
];

export async function fetchLeaderboards(currentUser, filter = 'global') {
  let dbUsers = [];
  const db = getDb();
  
  if (db) {
    dbUsers = db.find('users').map(u => ({
      username: u.username,
      xp: u.xp,
      streak: u.streak,
      tier: u.tier,
      region: u.region
    }));
  } else {
    try {
      const users = await User.find({}).select('username xp streak tier region');
      dbUsers = users.map(u => ({
        username: u.username,
        xp: u.xp,
        streak: u.streak,
        tier: u.tier,
        region: u.region
      }));
    } catch (err) {
      console.error('Failed to query users from MongoDB:', err);
    }
  }

  // Combine real users and mock competitors to populate list
  let combined = [...dbUsers];
  
  // If the current user isn't in combined list (e.g. guest), inject them
  if (currentUser && !combined.some(u => u.username === currentUser.username)) {
    combined.push({
      username: currentUser.username,
      xp: currentUser.xp || 0,
      streak: currentUser.streak || 0,
      tier: currentUser.tier || 'Bronze',
      region: currentUser.region || 'Global'
    });
  }

  // Add mock competitors to make leaderboard active
  mockCompetitors.forEach(mock => {
    if (!combined.some(u => u.username === mock.username)) {
      combined.push(mock);
    }
  });

  // Filter based on scope
  let filtered = combined;
  if (filter === 'regional' && currentUser) {
    filtered = combined.filter(u => u.region === currentUser.region);
  }

  // Sort by XP descending
  filtered.sort((a, b) => b.xp - a.xp);

  // Map ranks
  return filtered.map((user, idx) => ({
    rank: idx + 1,
    ...user,
    tier: calculateTier(user.xp) // dynamically recalculate
  }));
}
