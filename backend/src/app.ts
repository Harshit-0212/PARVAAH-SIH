import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { logger } from './utils/logger.js';

import { indexRouter } from './routes/index.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { integrationsRouter } from './routes/integrations.routes.js';
import { incidentsRouter } from './routes/incidents.routes.js';
import { weatherRouter } from './routes/weather.routes.js';
import { riskRouter } from './routes/risk.routes.js';
import { roadsRouter } from './routes/roads.routes.js';
import { sheltersRouter } from './routes/shelters.routes.js';
import { sensorsRouter } from './routes/sensors.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { citizenActionsRouter } from './routes/citizen-actions.routes.js';
import { scenariosRouter } from './routes/scenarios.routes.js';
import { telemetryRouter } from './routes/telemetry.routes.js';
import { riskRoutes } from './routes/riskRoutes.js';

export const app = express();

// Disable x-powered-by header
app.disable('x-powered-by');

// CORS configuration
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept', 'x-user-role'],
  credentials: true
}));

// Body parsing with safe size limit (1MB max)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request ID tracking
app.use(requestIdMiddleware);

// Safe request logging (never leaks secrets or bodies)
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = (req as any).id;

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
      requestId,
      statusCode: res.statusCode,
      durationMs: duration
    });
  });

  next();
});

// API Routes mounted under /api/v1
const API_PREFIX = '/api/v1';

app.use(API_PREFIX, indexRouter);
app.use(API_PREFIX, healthRouter);
app.use(API_PREFIX, integrationsRouter);
app.use(API_PREFIX, incidentsRouter);
app.use(API_PREFIX, weatherRouter);
app.use(API_PREFIX, riskRouter);
app.use(API_PREFIX, roadsRouter);
app.use(API_PREFIX, sheltersRouter);
app.use(API_PREFIX, sensorsRouter);
app.use(API_PREFIX, reportsRouter);
app.use(API_PREFIX, citizenActionsRouter);
app.use(API_PREFIX, scenariosRouter);
app.use(API_PREFIX, telemetryRouter);
app.use(API_PREFIX, riskRoutes);
app.use('/api', riskRoutes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);
