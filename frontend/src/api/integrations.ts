/**
 * Integrations & System Health API Client
 */

import { apiClient, type ApiFetchOptions } from './client';

export interface ProviderHealth {
  name: string;
  configured: boolean;
  status: 'DEMO' | 'NOT_CONFIGURED' | 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'ERROR';
  isLive: boolean;
  lastSuccessfulFetch: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  dataAgeMinutes: number | null;
  message: string;
  checkedAt?: string;
  latencyMs?: number | null;
  sourceType?: 'LIVE_CHECK' | 'DATABASE_CHECK' | 'CONFIGURATION' | 'DEMO' | 'NOT_CONFIGURED';
  details?: Record<string, unknown>;
}

export interface SystemHealthPayload {
  status: string;
  serverTime: string;
  uptimeSeconds: number;
  environment: string;
  dataMode: string;
  providers: ProviderHealth[];
}

export async function fetchIntegrationHealth(
  options?: ApiFetchOptions
): Promise<{ success: boolean; data: SystemHealthPayload }> {
  return apiClient<{ success: boolean; data: SystemHealthPayload }>(
    '/integrations/health',
    options
  );
}

export async function testImdIntegration(
  options?: ApiFetchOptions
): Promise<{ success: boolean; status: string; message: string; timestamp: string }> {
  return apiClient<{ success: boolean; status: string; message: string; timestamp: string }>(
    '/integrations/imd/test',
    {
      ...options,
      method: 'POST'
    }
  );
}

export interface DiagnosticResult {
  success: boolean;
  attemptedAt: string;
  result: {
    status: string;
    latencyMs: number | null;
    validation: string;
    error?: string | null;
    modelLoaded?: boolean;
    modelVersion?: string;
    modelMode?: string;
  };
}

export async function runIntegrationDiagnostic(kind: 'mongodb' | 'open-meteo' | 'ml', options?: ApiFetchOptions): Promise<DiagnosticResult> {
  return apiClient<DiagnosticResult>(`/telemetry/test/${kind}`, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
  });
}
