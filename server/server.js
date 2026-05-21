import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import local utilities and routes
import { dbConnect } from './utils/db.js';
import authRoutes from './routes/auth.routes.js';
import goalRoutes from './routes/goal.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import activityRoutes from './routes/activity.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { logRequest } from './controllers/admin.controller.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { initNotificationSocket } from './services/notification.service.js';


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all client connections
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

// Security & Logger Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP headers to run dev clients cleanly
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(logRequest);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Fallback error handler
app.use(errorMiddleware);

// Initialize notification socket link
initNotificationSocket(io);

// Socket.io main connections listener
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // User joins their specific room for targeted notifications
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 Socket ${socket.id} joined room for user: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Boot logic
async function startServer() {
  await dbConnect();
  server.listen(PORT, () => {
    console.log(`🚀 Health & Habit OS server running on port ${PORT}`);
  });
}

startServer();
