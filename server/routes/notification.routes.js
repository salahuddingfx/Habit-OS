import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.post('/read', markAsRead);

export default router;
