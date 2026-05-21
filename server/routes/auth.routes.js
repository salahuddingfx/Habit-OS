import express from 'express';
import { signup, login, updateProfile, addXP } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', authMiddleware, updateProfile);
router.post('/xp', authMiddleware, addXP);

export default router;
