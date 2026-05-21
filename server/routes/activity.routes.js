import express from 'express';
import { getActivityLogs, logActivity } from '../controllers/activity.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getActivityLogs);
router.post('/', logActivity);

export default router;
