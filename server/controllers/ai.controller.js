import { generateHealthInsight, generateMealSuggestions } from '../services/ai.service.js';

export async function getHealthCoaching(req, res) {
  try {
    const userData = {
      steps: req.query.steps || 0,
      sleep: req.query.sleep || 0,
      water: req.query.water || 0,
      goalsCompleted: req.query.goalsCompleted || 0,
      age: req.user.age || 25,
      weight: req.user.weight || 70,
      height: req.user.height || 175,
      gender: req.user.gender || 'other'
    };

    const insight = await generateHealthInsight(userData);
    res.json(insight);
  } catch (err) {
    console.error('Coaching generation error:', err);
    res.status(500).json({ message: 'AI generation failed' });
  }
}

export async function getMealIdeas(req, res) {
  try {
    const userData = {
      targetCalories: req.query.targetCalories || 2000
    };

    const suggestions = await generateMealSuggestions(userData);
    res.json(suggestions);
  } catch (err) {
    console.error('Meal suggestions error:', err);
    res.status(500).json({ message: 'AI generation failed' });
  }
}
