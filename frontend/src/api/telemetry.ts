/**
 * PARVAAH Operational & ML System Telemetry API Client
 */

import { apiClient, type ApiFetchOptions } from './client';

export interface OperationalTelemetryData {
  service: string;
  timestamp: string;
  environment: string;
  activeDataMode: string;
  apiHealth: {
    status: 'UP' | 'DOWN' | 'DEGRADED';
    uptimeSeconds: number;
    serverPort: number;
  };
  database: {
    status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
    isLocalFallbackActive: boolean;
    checkedAt?: string;
    latencyMs?: number | null;
    lastError?: string | null;
    metrics: {
      totalCitizenReports: number;
      totalPredictionsLogged: number;
      totalScenarios: number;
    };
  };
  fastApiMl: {
    serviceUrl: string;
    isAvailable: boolean;
    modelLoaded: boolean;
    modelVersion: string;
    modelMode: string;
    disclaimer: string;
    lastPredictionLatencyMs: number | null;
    lastPredictionCalculatedAt: string | null;
    lastPredictionRiskLevel: string | null;
    lastHealthCheckAt?: string | null;
    healthLatencyMs?: number | null;
    lastHealthError?: string | null;
  };
  weatherProviders: {
    imd: {
      name: string;
      status: string;
      isConfigured: boolean;
      isLive: boolean;
      message: string;
    };
    openMeteo: {
      name: string;
      status: string;
      isConfigured: boolean;
      isLive: boolean;
      dataAgeMinutes?: number;
      lastSync?: string | null;
      lastAttemptAt?: string | null;
      lastError?: string | null;
      latencyMs?: number | null;
      sourceType?: string;
    };
  };
  activeScenario: {
    id: string;
    name: string;
    district: string;
    rainfall24hMm: number;
    slopeDegrees: number;
    soilMoisturePercent: number;
    expiresAt: string;
    disclaimer: string;
  } | null;
  operationalTimestamps: {
    lastWeatherSync: string | null;
    lastPrediction: string | null;
    lastCitizenReport: string | null;
    lastRiskRecalculation: string | null;
  };
  recentSafeErrors: string[];
  requestId: string;
}

export interface TelemetryResponse {
  success: boolean;
  data: OperationalTelemetryData;
}

export async function fetchOperationalTelemetry(options?: ApiFetchOptions): Promise<TelemetryResponse> {
  return apiClient<TelemetryResponse>('/telemetry', options);
}
