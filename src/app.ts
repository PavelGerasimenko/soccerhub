import path from 'path';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/environment';
import userRoutes from './modules/users/user.routes';
import eventRoutes from './modules/events/event.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import chatRoutes from './modules/chat/chat.routes';
import hostDashboardRoutes from './modules/hostDashboard/hostDashboard.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

// Middleware
// CSP is configured to allow the bundled frontend's inline script/style.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend (public/index.html) at the site root
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1', userRoutes);
app.use('/api/v1', eventRoutes);
app.use('/api/v1', bookingRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/v1', hostDashboardRoutes);
app.use('/api/v1', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      statusCode: 404,
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
