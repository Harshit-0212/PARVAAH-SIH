import { Router } from 'express';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';

export const indexRouter = Router();

export const API_V1_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/health',
    description: 'Server and database readiness status'
  },
  {
    method: 'GET',
    path: '/api/v1/integrations/health',
    description: 'Integration providers and third-party health'
  },
  {
    method: 'POST',
    path: '/api/v1/integrations/imd/test',
    description: 'Test IMD connection and telemetry status'
  },
  {
    method: 'GET',
    path: '/api/v1/incidents',
    description: 'List incidents'
  },
  {
    method: 'GET',
    path: '/api/v1/incidents/:id',
    description: 'Fetch incident details by ID'
  },
  {
    method: 'GET',
    path: '/api/v1/incidents/:id/timeline',
    description: 'Incident escalation and response timeline'
  },
  {
    method: 'GET',
    path: '/api/v1/weather',
    description: 'Latest normalized weather data'
  },
  {
    method: 'GET',
    path: '/api/v1/weather/forecast',
    description: 'Multi-day meteorological forecast'
  },
  {
    method: 'GET',
    path: '/api/v1/risk-zones',
    description: 'GeoJSON risk zones'
  },
  {
    method: 'GET',
    path: '/api/v1/risk-zones/:id',
    description: 'Fetch risk zone details by ID'
  },
  {
    method: 'POST',
    path: '/api/v1/risk/calculate',
    description: 'Dynamic landslide risk calculation'
  },
  {
    method: 'GET',
    path: '/api/v1/roads',
    description: 'Road accessibility and corridor status'
  },
  {
    method: 'GET',
    path: '/api/v1/shelters',
    description: 'Relief and evacuation shelters inventory'
  },
  {
    method: 'GET',
    path: '/api/v1/shelters/:id',
    description: 'Relief shelter details by ID'
  },
  {
    method: 'GET',
    path: '/api/v1/sensors',
    description: 'IoT borehole and geotechnical sensor telemetry'
  },
  {
    method: 'POST',
    path: '/api/v1/reports',
    description: 'Create citizen or field report'
  },
  {
    method: 'GET',
    path: '/api/v1/reports',
    description: 'List reports for authorized officer/admin views'
  },
  {
    method: 'GET',
    path: '/api/v1/action-guides/:hazardType',
    description: 'Citizen safety and preparedness SOP action guide'
  }
];

export function handleApiRoot(req: Request, res: Response): void {
  const requestId = (req as any).id || 'unknown';
  const dataMode = env.DATA_MODE || 'demo';

  res.status(200).json({
    success: true,
    service: 'PARVAAH API',
    version: 'v1',
    environment: env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    dataMode,
    documentation: {
      health: '/api/v1/health',
      integrationHealth: '/api/v1/integrations/health'
    },
    endpoints: API_V1_ENDPOINTS,
    requestId
  });
}

// Handle both GET / and GET /api/v1 depending on mount point
indexRouter.get('/', handleApiRoot);
