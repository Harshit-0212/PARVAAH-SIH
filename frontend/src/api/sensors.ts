/**
 * Sensors Telemetry API Client
 */

import { apiClient, type ApiFetchOptions } from './client';
import type { SensorRecord, ApiResponse } from '../types';

export async function fetchSensors(
  district?: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<SensorRecord[]>> {
  const query = district && district !== 'all' ? `?district=${encodeURIComponent(district)}` : '';
  return apiClient<ApiResponse<SensorRecord[]>>(`/sensors${query}`, options);
}
