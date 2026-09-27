import { Router } from 'express';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { isDatabaseConnected } from '../config/db.js';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response): void => {
  const requestId = (req as any).id || 'unknown';
  const now = new Date().toISOString();

  const hasMongoUri = Boolean(env.MONGODB_URI);
  let dbStatus: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED';

  if (!hasMongoUri) {
    dbStatus = 'NOT_CONFIGURED';
  } else if (isDatabaseConnected()) {
    dbStatus = 'CONNECTED';
  } else {
    dbStatus = 'DISCONNECTED';
  }

  // If database is NOT_CONFIGURED or DISCONNECTED, still return 200 (health check always answers).
  // A 503 is appropriate only for operational endpoints that require DB, not the health check itself.
  res.status(200).json({
    ok: true,
    success: true,
    service: 'PARVAAH API',
    version: 'v1',
    server: {
      status: 'UP',
      time: now,
      uptimeSeconds: Math.round(process.uptime()),
      environment: env.NODE_ENV
    },
    database: {
      status: dbStatus,
      checkedAt: now
    },
    dataMode: env.DATA_MODE,
    statusBanner:
      env.DATA_MODE === 'research'
        ? 'THIRD-PARTY WEATHER DATA — Research/demo use; not an IMD warning.'
        : env.DATA_MODE === 'live'
        ? 'OFFICIAL IMD WEATHER DATA — Check source and validity time.'
        : 'DEMO MODE — Simulated data. Not an official IMD warning or evacuation order.',
    requestId
  });
});
