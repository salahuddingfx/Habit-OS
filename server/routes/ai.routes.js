import express from 'express';
import { getHealthCoaching, getMealIdeas } from '../controllers/ai.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/coaching', getHealthCoaching);
router.get('/meals', getMealIdeas);

export default router;
