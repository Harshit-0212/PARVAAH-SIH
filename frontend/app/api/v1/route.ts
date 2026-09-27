import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/health', description: 'Server and database readiness status' },
  { method: 'GET', path: '/api/v1/integrations/health', description: 'Integration providers health' },
  { method: 'POST', path: '/api/v1/integrations/imd/test', description: 'Test IMD connection status' },
  { method: 'GET', path: '/api/v1/incidents', description: 'List incidents' },
  { method: 'GET', path: '/api/v1/incidents/:id', description: 'Fetch incident by ID' },
  { method: 'GET', path: '/api/v1/incidents/:id/timeline', description: 'Incident timeline' },
  { method: 'GET', path: '/api/v1/weather', description: 'Latest normalized weather data' },
  { method: 'GET', path: '/api/v1/weather/forecast', description: 'Multi-day weather forecast' },
  { method: 'GET', path: '/api/v1/risk-zones', description: 'GeoJSON risk zones' },
  { method: 'GET', path: '/api/v1/risk-zones/:id', description: 'Risk zone details by ID' },
  { method: 'POST', path: '/api/v1/risk/calculate', description: 'Landslide risk calculation' },
  { method: 'GET', path: '/api/v1/roads', description: 'Road accessibility status' },
  { method: 'GET', path: '/api/v1/shelters', description: 'Evacuation shelters inventory' },
  { method: 'GET', path: '/api/v1/shelters/:id', description: 'Shelter details by ID' },
  { method: 'GET', path: '/api/v1/sensors', description: 'Geotechnical sensor telemetry' },
  { method: 'POST', path: '/api/v1/reports', description: 'Create citizen or field report' },
  { method: 'GET', path: '/api/v1/reports', description: 'List reports for officer/admin views' },
  { method: 'GET', path: '/api/v1/action-guides/:hazardType', description: 'Citizen safety SOP guide' }
];

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const dataMode = process.env.VITE_DATA_MODE || process.env.DATA_MODE || 'demo';

  return NextResponse.json(
    {
      success: true,
      service: 'PARVAAH API',
      version: 'v1',
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString(),
      dataMode,
      documentation: {
        health: '/api/v1/health',
        integrationHealth: '/api/v1/integrations/health'
      },
      endpoints: ENDPOINTS,
      requestId
    },
    {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store'
      }
    }
  );
}
