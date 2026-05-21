import express from 'express';
import { getGoals, createOrUpdateGoal, syncOfflineMutations } from '../controllers/goal.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getGoals);
router.post('/', createOrUpdateGoal);
router.post('/sync', syncOfflineMutations);

export default router;
