import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getDb } from '../utils/db.js';
import { calculateTier } from '../services/leaderboard.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'health-habit-os-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'health-habit-os-refresh-key';

function generateTokens(userId, username) {
  const accessToken = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, username }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function signup(req, res) {
  try {
    const { username, password, region, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const db = getDb();
    let existingUser = null;

    if (db) {
      existingUser = db.findOne('users', { username });
    } else {
      existingUser = await User.findOne({ username });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser = null;

    if (db) {
      newUser = db.insertOne('users', {
        username,
        password: hashedPassword,
        xp: 0,
        streak: 0,
        tier: 'Bronze',
        region: region || 'Global',
        height: 175,
        weight: 70,
        age: 25,
        gender: 'other',
        activityLevel: 'sedentary',
        role: role || 'user'
      });
    } else {
      const user = new User({
        username,
        password: hashedPassword,
        region: region || 'Global',
        role: role || 'user'
      });
      newUser = await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(newUser._id, newUser.username);

    res.status(201).json({
      message: 'Signup successful',
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        xp: newUser.xp,
        streak: newUser.streak,
        tier: newUser.tier,
        region: newUser.region,
        role: newUser.role || 'user'
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const db = getDb();
    let user = null;

    if (db) {
      user = db.findOne('users', { username });
    } else {
      user = await User.findOne({ username });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.username);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        xp: user.xp,
        streak: user.streak,
        tier: user.tier,
        region: user.region,
        height: user.height,
        weight: user.weight,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateProfile(req, res) {
  try {
    const { height, weight, age, gender, activityLevel, region } = req.body;
    const userId = req.user._id || req.user.id;
    
    const db = getDb();
    let updatedUser = null;

    if (db) {
      updatedUser = db.updateOne('users', { _id: userId }, {
        height: Number(height),
        weight: Number(weight),
        age: Number(age),
        gender,
        activityLevel,
        region
      });
    } else {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { height, weight, age, gender, activityLevel, region },
        { new: true }
      ).select('-password');
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function addXP(req, res) {
  try {
    const { xpAmount } = req.body;
    const userId = req.user._id || req.user.id;
    
    const db = getDb();
    let updatedUser = null;

    if (db) {
      const u = db.findOne('users', { _id: userId });
      if (u) {
        const newXp = (u.xp || 0) + Number(xpAmount);
        updatedUser = db.updateOne('users', { _id: userId }, {
          xp: newXp,
          tier: calculateTier(newXp)
        });
      }
    } else {
      const u = await User.findById(userId);
      if (u) {
        u.xp += Number(xpAmount);
        u.tier = calculateTier(u.xp);
        updatedUser = await u.save();
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `XP awarded: +${xpAmount}`,
      xp: updatedUser.xp,
      tier: updatedUser.tier
    });
  } catch (err) {
    console.error('Add XP error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
