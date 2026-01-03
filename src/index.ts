import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import { db } from './services/database.service';

// Load environment variables
dotenv.config();

const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close database connection
  await db.disconnect();
  
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close database connection
  await db.disconnect();
  
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    await db.connect();
    
    // Run database health check
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    // Clean up expired sessions on startup
    await db.cleanupExpiredSessions();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 Smart Education Backend API v1.0`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;