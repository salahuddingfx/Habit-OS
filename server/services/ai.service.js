import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API if key is available
const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini AI service configured.');
  } catch (err) {
    console.error('❌ Failed to initialize Gemini AI Client:', err.message);
  }
} else {
  console.warn('⚠️ No GEMINI_API_KEY found. AI features will run on local mock service.');
}

const mockTips = [
  "Consistency is key. You're maintaining a great streak - keep it going today!",
  "Try adding 500 steps to your morning routine. A quick walk increases fat oxidation and clears mental fog.",
  "Your water intake is slightly low today. Keep a bottle at your desk and aim for 250ml every hour.",
  "A 10-minute stretching routine before bed can increase deep sleep duration by up to 15%.",
  "Ensure you hit 1.6g of protein per kg of bodyweight to maximize muscle repair after workouts."
];

const mockMeals = [
  {
    title: "High Protein Muscle Fuel",
    items: ["Grilled chicken breast (200g)", "Quinoa (1 cup)", "Steamed broccoli", "Olive oil dressing"],
    macros: { calories: 550, protein: 48, carbs: 45, fat: 12 }
  },
  {
    title: "Recovery Power Bowl",
    items: ["Smoked salmon (150g)", "Sweet potato mash", "Spinach & avocado salad"],
    macros: { calories: 600, protein: 35, carbs: 50, fat: 22 }
  },
  {
    title: "Lean & Green Salad",
    items: ["Tofu cubes (grilled, 180g)", "Mixed salad leaves", "Cucumber & pumpkin seeds", "Hummus dressing"],
    macros: { calories: 420, protein: 26, carbs: 30, fat: 18 }
  }
];

export async function generateHealthInsight(userData) {
  if (!aiClient) {
    // Generate localized mock response
    const randTip = mockTips[Math.floor(Math.random() * mockTips.length)];
    const randMeal = mockMeals[Math.floor(Math.random() * mockMeals.length)];
    
    return {
      insight: `Based on your recent logs (${userData.steps || 0} steps, ${userData.sleep || 0}h sleep, ${userData.water || 0}ml water), here is your AI Recommendation:\n\n${randTip}\n\nSuggested Meal: **${randMeal.title}** (${randMeal.items.join(', ')}) with ${randMeal.macros.protein}g protein and ${randMeal.macros.calories} kcal.`,
      source: 'AI Local Engine',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are Health & Habit OS Personal Coach.
      Generate a customized, professional, ultra-minimal recovery action plan and meal recommendation.
      User Stats:
      - Current Steps: ${userData.steps || 0}
      - Current Sleep: ${userData.sleep || 0} hours
      - Current Water: ${userData.water || 0} ml
      - Goals Completed: ${userData.goalsCompleted || 0}
      - Age: ${userData.age || 25}
      - Weight: ${userData.weight || 70} kg
      - Height: ${userData.height || 175} cm

      Keep it concise, high-tech, and output in plain Markdown.
    `;
    const result = await model.generateContent(prompt);
    return {
      insight: result.response.text(),
      source: 'Gemini 1.5 Flash',
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Gemini API call failed:', err.message);
    const randTip = mockTips[0];
    return {
      insight: `[Mock Connection Fallback] ${randTip}`,
      source: 'AI Fallback Engine',
      timestamp: new Date().toISOString()
    };
  }
}

export async function generateMealSuggestions(userData) {
  if (!aiClient) {
    return {
      suggestions: mockMeals,
      source: 'AI Local Engine'
    };
  }

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Generate a JSON list of 3 premium healthy meals matching user target calories: ${userData.targetCalories || 2000} kcal.
      Include a title, items array, and macros object containing calories, protein, carbs, fat.
      Output ONLY valid JSON. Format: [{"title": "Name", "items": ["item1"], "macros": {"calories": 500, "protein": 30, "carbs": 40, "fat": 10}}]
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Parse JSON safely
    const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return {
      suggestions: JSON.parse(cleanJsonText),
      source: 'Gemini 1.5 Flash'
    };
  } catch (err) {
    console.error('Meal API failed:', err.message);
    return {
      suggestions: mockMeals,
      source: 'AI Fallback Engine'
    };
  }
}
