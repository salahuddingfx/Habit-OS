import { fetchLeaderboards } from '../services/leaderboard.service.js';

export async function getLeaderboard(req, res) {
  try {
    const filter = req.query.filter || 'global'; // global, regional, daily, weekly, monthly
    const leaderboard = await fetchLeaderboards(req.user, filter);
    
    // Paginate or limit
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedLeaderboard = leaderboard.slice(startIndex, startIndex + limit);

    // Find current user's rank
    const userRank = leaderboard.find(u => u.username === req.user.username) || null;

    res.json({
      leaderboard: paginatedLeaderboard,
      userRank,
      totalCount: leaderboard.length
    });
  } catch (err) {
    console.error('Leaderboard retrieve error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
