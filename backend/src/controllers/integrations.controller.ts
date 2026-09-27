import type { Request, Response, NextFunction } from 'express';
import { integrationHealthService } from '../services/integration-health.service.js';
import { ImdLiveProvider } from '../providers/weather/imd-live.provider.js';

export class IntegrationsController {
  private liveImd = new ImdLiveProvider();

  async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await integrationHealthService.getAllIntegrationHealth().catch(() => ({
        status: 'DEGRADED',
        serverTime: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        dataMode: 'demo',
        providers: []
      }));
      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async testImdConnection(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.liveImd.testConnection();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const integrationsController = new IntegrationsController();
