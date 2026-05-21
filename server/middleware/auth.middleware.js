import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getDb } from '../utils/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'health-habit-os-secret-key';

export async function authMiddleware(req, res, next) {
  try {
    // 1. Check for guest header first (to easily support guest session simulation)
    const guestId = req.headers['x-guest-id'];
    if (guestId) {
      req.user = {
        _id: guestId,
        id: guestId,
        username: 'Guest User',
        xp: 0,
        streak: 0,
        tier: 'Bronze',
        isGuest: true
      };
      return next();
    }

    // 2. Extract authorization header or cookie
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    // 3. Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 4. Retrieve user (supporting fallback db)
    const db = getDb();
    if (db) {
      const user = db.findOne('users', { _id: decoded.userId });
      if (!user) {
        // Create transient user representing the token if missing in memory
        req.user = { _id: decoded.userId, id: decoded.userId, username: decoded.username || 'User' };
      } else {
        req.user = user;
      }
    } else {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      req.user = user;
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired authorization token' });
  }
}
