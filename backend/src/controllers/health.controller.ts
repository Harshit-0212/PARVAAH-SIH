import type { Request, Response } from 'express';
import { env } from '../config/env.js';

export class HealthController {
  getHealth(_req: Request, res: Response): void {
    res.status(200).json({
      ok: true,
      service: 'PARVAAH Disaster Early Warning REST API',
      environment: env.NODE_ENV,
      dataMode: env.DATA_MODE,
      serverTime: new Date().toISOString(),
      apiVersion: 'v1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      statusBanner: env.DATA_MODE === 'research'
        ? 'THIRD-PARTY WEATHER DATA — Research/demo use; not an IMD warning.'
        : env.DATA_MODE === 'live'
        ? 'OFFICIAL IMD WEATHER DATA — Check source and validity time.'
        : 'DEMO MODE — Simulated data. Not an official IMD warning or evacuation order.'
    });
  }
}

export const healthController = new HealthController();
