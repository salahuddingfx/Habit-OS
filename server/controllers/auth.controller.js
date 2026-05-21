import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getDb } from '../utils/db.js';
import { calculateTier } from '../services/leaderboard.service.js';

const JWT_SECRET     = process.env.JWT_SECRET     || 'health-habit-os-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'health-habit-os-refresh-key';

function generateTokens(userId, username) {
  const accessToken  = jwt.sign({ userId, username }, JWT_SECRET,     { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, username }, REFRESH_SECRET, { expiresIn: '7d'  });
  return { accessToken, refreshToken };
}

// Safe user object to return — never expose password / secretKey
function safeUser(u) {
  return {
    id:            u._id || u.id,
    username:      u.username,
    fullName:      u.fullName      || '',
    email:         u.email         || '',
    xp:            u.xp            || 0,
    streak:        u.streak        || 0,
    tier:          u.tier          || 'Bronze',
    region:        u.region        || 'Global',
    height:        u.height        || 175,
    weight:        u.weight        || 70,
    age:           u.age           || 25,
    gender:        u.gender        || 'other',
    activityLevel: u.activityLevel || 'sedentary',
    role:          u.role          || 'user',
    hasSecretKey:  Boolean(u.secretKey),
  };
}

// ── SIGNUP ────────────────────────────────────────────────────────────────
export async function signup(req, res) {
  try {
    const { username, password, fullName, email, secretKey, region, role } = req.body;
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

    const hashedPassword  = await bcrypt.hash(password, 10);
    const hashedSecretKey = secretKey ? await bcrypt.hash(secretKey.toLowerCase().trim(), 10) : '';

    let newUser = null;

    if (db) {
      newUser = db.insertOne('users', {
        username,
        fullName:      fullName || '',
        email:         email?.toLowerCase().trim() || '',
        password:      hashedPassword,
        secretKey:     hashedSecretKey,
        xp:            0,
        streak:        0,
        tier:          'Bronze',
        region:        region || 'Global',
        height:        175,
        weight:        70,
        age:           25,
        gender:        'other',
        activityLevel: 'sedentary',
        role:          role || 'user',
      });
    } else {
      const user = new User({
        username,
        fullName:  fullName || '',
        email:     email?.toLowerCase().trim() || '',
        password:  hashedPassword,
        secretKey: hashedSecretKey,
        region:    region || 'Global',
        role:      role   || 'user',
      });
      newUser = await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(newUser._id || newUser.id, newUser.username);
    res.status(201).json({ message: 'Signup successful', accessToken, refreshToken, user: safeUser(newUser) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ── LOGIN ─────────────────────────────────────────────────────────────────
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

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user._id || user.id, user.username);
    res.json({ message: 'Login successful', accessToken, refreshToken, user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ── UPDATE PROFILE ────────────────────────────────────────────────────────
export async function updateProfile(req, res) {
  try {
    const { fullName, email, height, weight, age, gender, activityLevel, region } = req.body;
    const userId = req.user._id || req.user.id;

    const db = getDb();
    let updatedUser = null;

    const updates = {
      ...(fullName      !== undefined && { fullName: fullName.trim() }),
      ...(email         !== undefined && { email: email.toLowerCase().trim() }),
      ...(height        !== undefined && { height: Number(height) }),
      ...(weight        !== undefined && { weight: Number(weight) }),
      ...(age           !== undefined && { age:    Number(age)    }),
      ...(gender        !== undefined && { gender }),
      ...(activityLevel !== undefined && { activityLevel }),
      ...(region        !== undefined && { region }),
    };

    if (db) {
      updatedUser = db.updateOne('users', { _id: userId }, updates);
    } else {
      updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password -secretKey');
    }

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated successfully', user: safeUser(updatedUser) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ── SET / CHANGE SECRET KEY ───────────────────────────────────────────────
export async function setSecretKey(req, res) {
  try {
    const { secretKey, currentPassword } = req.body;
    const userId = req.user._id || req.user.id;
    if (!secretKey) return res.status(400).json({ message: 'Secret key is required' });

    const db = getDb();
    let user = db ? db.findOne('users', { _id: userId }) : await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify current password before changing secret key
    if (currentPassword) {
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(secretKey.toLowerCase().trim(), 10);
    if (db) {
      db.updateOne('users', { _id: userId }, { secretKey: hashed });
    } else {
      await User.findByIdAndUpdate(userId, { secretKey: hashed });
    }

    res.json({ message: 'Secret key updated successfully' });
  } catch (err) {
    console.error('Set secret key error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ── RECOVER PASSWORD (using secret key) ───────────────────────────────────
export async function recoverPassword(req, res) {
  try {
    const { username, secretKey, newPassword } = req.body;
    if (!username || !secretKey || !newPassword) {
      return res.status(400).json({ message: 'Username, secret key, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const db = getDb();
    let user = db ? db.findOne('users', { username }) : await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Username not found' });
    if (!user.secretKey) return res.status(400).json({ message: 'No secret key set for this account' });

    const keyMatch = await bcrypt.compare(secretKey.toLowerCase().trim(), user.secretKey);
    if (!keyMatch) return res.status(400).json({ message: 'Incorrect secret key' });

    const hashedNew = await bcrypt.hash(newPassword, 10);

    if (db) {
      db.updateOne('users', { username }, { password: hashedNew });
    } else {
      await User.findOneAndUpdate({ username }, { password: hashedNew });
    }

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Recover password error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ── ADD XP ────────────────────────────────────────────────────────────────
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
        updatedUser = db.updateOne('users', { _id: userId }, { xp: newXp, tier: calculateTier(newXp) });
      }
    } else {
      const u = await User.findById(userId);
      if (u) {
        u.xp += Number(xpAmount);
        u.tier = calculateTier(u.xp);
        updatedUser = await u.save();
      }
    }

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `XP awarded: +${xpAmount}`, xp: updatedUser.xp, tier: updatedUser.tier });
  } catch (err) {
    console.error('Add XP error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
