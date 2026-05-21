import express from 'express';
import { getUsers, updateUser, deleteUser, getSystemStats, broadcast, getLogs, seedDatabase } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.get('/stats', getSystemStats);
router.post('/broadcast', broadcast);
router.get('/logs', getLogs);
router.post('/seed', seedDatabase);

export default router;
