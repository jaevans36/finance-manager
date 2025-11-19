import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { httpLogger } from './middleware/httpLogger';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import passwordResetRoutes from './routes/passwordReset';
import emailVerificationRoutes from './routes/emailVerification';
import sessionsRoutes from './routes/sessions';
import activityLogsRoutes from './routes/activityLogs';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/password-reset', passwordResetRoutes);
app.use('/api/v1/email-verification', emailVerificationRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/activity-logs', activityLogsRoutes);

// Error handling
app.use(errorHandler);

// Export app for testing
export default app;

// Start server (only when not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
}
