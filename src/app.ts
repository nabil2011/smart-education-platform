import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { setupSwagger } from './config/swagger';
import { db } from './services/database.service';
import authRoutes from './routes/auth.routes';
import protectedRoutes from './routes/protected.routes';
import contentRoutes from './routes/content.routes';
import assessmentRoutes from './routes/assessment.routes';
import assignmentRoutes from './routes/assignments';
import gamificationRoutes from './routes/gamification';
import notificationRoutes from './routes/notification.routes';
import schoolRoutes from './routes/school.routes';
import classRoutes from './routes/class.routes';
import recoveryPlanRoutes from './routes/recovery-plan.routes';
import enhancementPlanRoutes from './routes/enhancement-plan.routes';
import diagnosticTestRoutes from './routes/diagnostic-test.routes';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
app.use(rateLimiter);

// Logging
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/protected', protectedRoutes);
app.use('/api/v1', contentRoutes);
app.use('/api/v1', assessmentRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/recovery-plans', recoveryPlanRoutes);
app.use('/api/v1/enhancement-plans', enhancementPlanRoutes);
app.use('/api/v1/diagnostic-tests', diagnosticTestRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the API server and database
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     stats:
 *                       type: object
 */
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await db.healthCheck();
    const dbStats = dbHealthy ? await db.getStats() : null;
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        stats: dbStats
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'error'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: API information endpoint
 *     description: Returns basic information about the API and available endpoints
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: منصة الداعم التعليمي الذكي - API v1.0
 *                 status:
 *                   type: string
 *                   example: active
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: /health
 *                     auth:
 *                       type: string
 *                       example: /api/v1/auth
 *                     users:
 *                       type: string
 *                       example: /api/v1/users
 */
// API info endpoint
app.get('/api/v1', (req, res) => {
  res.json({ 
    message: 'منصة الداعم التعليمي الذكي - API v1.0',
    status: 'active',
    endpoints: {
      health: '/health',
      'api-docs': '/api-docs',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      content: '/api/v1/content',
      assessments: '/api/v1/assessments',
      assignments: '/api/v1/assignments',
      gamification: '/api/v1/gamification',
      notifications: '/api/v1/notifications',
      schools: '/api/v1/schools',
      classes: '/api/v1/classes',
      'recovery-plans': '/api/v1/recovery-plans',
      'enhancement-plans': '/api/v1/enhancement-plans',
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;