import Goal from '../models/Goal.js';
import Activity from '../models/Activity.js';
import { getDb } from '../utils/db.js';

export async function getAnalyticsData(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();
    
    let goalsList = [];
    let activityList = [];

    if (db) {
      goalsList = db.find('goals', { userId });
      activityList = db.find('activities', { userId });
    } else {
      goalsList = await Goal.find({ userId });
      activityList = await Activity.find({ userId });
    }

    // 1. Generate contribution heatmap (date -> count of completions)
    const heatmap = {};
    goalsList.forEach(goal => {
      if (goal.completionTimestamp) {
        const dateStr = new Date(goal.completionTimestamp).toISOString().split('T')[0];
        heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
      }
    });

    const heatmapArray = Object.keys(heatmap).map(date => ({
      date,
      count: heatmap[date]
    }));

    // 2. Generate consistency trend (Weekly/Monthly success percentages)
    const weeklyPerf = [
      { name: 'Mon', score: 0 },
      { name: 'Tue', score: 0 },
      { name: 'Wed', score: 0 },
      { name: 'Thu', score: 0 },
      { name: 'Fri', score: 0 },
      { name: 'Sat', score: 0 },
      { name: 'Sun', score: 0 }
    ];

    // Simple week mapping logic
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    goalsList.forEach(goal => {
      const dayIndex = new Date(goal.createdAt).getDay();
      const dayName = dayMap[dayIndex];
      const match = weeklyPerf.find(d => d.name === dayName);
      if (match) {
        match.score += goal.progress || 0;
      }
    });

    // Average scores
    weeklyPerf.forEach(day => {
      day.score = Math.min(Math.round(day.score / (goalsList.length || 1)), 100);
    });

    // 3. Gather XP Growth logs
    let accumulatedXp = 0;
    const xpGrowth = activityList
      .filter(act => act.xpEarned > 0)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(act => {
        accumulatedXp += act.xpEarned;
        return {
          date: new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          xp: accumulatedXp
        };
      });

    // 4. BMR / BMI Calculator metadata
    const bmr = 10 * (req.user.weight || 70) + 6.25 * (req.user.height || 175) - 5 * (req.user.age || 25) + (req.user.gender === 'male' ? 5 : -161);
    const heightInMeters = (req.user.height || 175) / 100;
    const bmi = (req.user.weight || 70) / (heightInMeters * heightInMeters);

    res.json({
      heatmap: heatmapArray,
      weeklyPerformance: weeklyPerf,
      xpGrowth: xpGrowth.slice(-10), // last 10 points
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      metrics: {
        weight: req.user.weight || 70,
        height: req.user.height || 175,
        age: req.user.age || 25,
        activityLevel: req.user.activityLevel || 'sedentary'
      }
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
