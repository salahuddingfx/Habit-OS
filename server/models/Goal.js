import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  userId: {
    type: String, // String to allow simple fallback IDs as well
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['water', 'sleep', 'steps', 'nutrition', 'protein', 'workouts'],
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0 // percentage 0-100
  },
  xpReward: {
    type: Number,
    default: 10
  },
  streak: {
    type: Number,
    default: 0
  },
  completionTimestamp: {
    type: Date,
    default: null
  },
  dateKey: {
    type: String, // e.g., "2026-05-20" for daily, "2026-W20" for weekly
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Goal || mongoose.model('Goal', GoalSchema);
