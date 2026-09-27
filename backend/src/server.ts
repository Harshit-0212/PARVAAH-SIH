import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase } from './config/db.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, async () => {
  logger.info(`========================================================`);
  logger.info(`🚀 PARVAAH High-Reliability Backend API v1`);
  logger.info(`📡 Server Listening on Port: ${PORT}`);
  logger.info(`🌐 Base API URL: http://localhost:${PORT}/api/v1`);
  logger.info(`🛡️ Environment: ${env.NODE_ENV} | Data Mode: ${env.DATA_MODE.toUpperCase()}`);
  logger.info(`⚡ Live Provider Safeguards Active: DEMO data strictly identified`);
  logger.info(`========================================================`);

  // Connect to MongoDB if configured, with graceful fallback
  await connectDatabase();
});

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Gracefully terminating disaster monitoring server...`);
  server.close(() => {
    logger.info('HTTP server closed cleanly. Process exiting.');
    process.exit(0);
  });

  // Force shutdown after 10s if connections linger
  setTimeout(() => {
    logger.warn('Forcing immediate shutdown due to pending connections timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
