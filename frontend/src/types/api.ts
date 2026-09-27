/**
 * Standardized API Response & Filter Types
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  dataFreshness?: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
  source?: string;
  isDemo?: boolean;
  isLive?: boolean;
  error?: string;
  timestamp?: string;
}

export interface ApiQueryOptions {
  district?: string;
  signal?: AbortSignal;
  maxRetries?: number;
  timeoutMs?: number;
}
