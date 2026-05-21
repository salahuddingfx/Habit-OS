import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true
  },
  fullName: {
    type:    String,
    default: ''
  },
  email: {
    type:    String,
    default: '',
    trim:    true,
    lowercase: true
  },
  password: {
    type:     String,
    required: true
  },
  // Secret key for password recovery (stored hashed)
  secretKey: {
    type: String,
    default: ''
  },
  xp: {
    type:    Number,
    default: 0
  },
  streak: {
    type:    Number,
    default: 0
  },
  tier: {
    type:    String,
    enum:    ['Bronze', 'Silver', 'Gold', 'Platinum', 'Titan'],
    default: 'Bronze'
  },
  region: {
    type:    String,
    default: 'Global'
  },
  height: {
    type:    Number,
    default: 175
  },
  weight: {
    type:    Number,
    default: 70
  },
  gender: {
    type:    String,
    enum:    ['male', 'female', 'other'],
    default: 'other'
  },
  age: {
    type:    Number,
    default: 25
  },
  activityLevel: {
    type:    String,
    enum:    ['sedentary', 'lightly_active', 'moderately_active', 'very_active'],
    default: 'sedentary'
  },
  role: {
    type:    String,
    enum:    ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
