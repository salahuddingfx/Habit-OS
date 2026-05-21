import express from 'express';
import {
  signup, login, updateProfile, addXP,
  setSecretKey, recoverPassword
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup',           signup);
router.post('/login',            login);
router.put('/profile',           authMiddleware, updateProfile);
router.post('/xp',               authMiddleware, addXP);
router.post('/set-secret-key',   authMiddleware, setSecretKey);
router.post('/recover-password', recoverPassword);   // public — no auth needed

export default router;
