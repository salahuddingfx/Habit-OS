import express from 'express';
import { getAnalyticsData } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getAnalyticsData);

export default router;
export const analyticsRouter = router;
