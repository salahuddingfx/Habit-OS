import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['created', 'updated', 'completed', 'synced', 'xp', 'ai'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
