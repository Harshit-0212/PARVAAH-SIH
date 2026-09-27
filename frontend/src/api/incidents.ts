/**
 * Incidents API Client
 */

import { apiClient, type ApiFetchOptions } from './client';
import type { Incident, ApiResponse } from '../types';

export async function fetchIncidents(
  district?: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<Incident[]>> {
  const query = district && district !== 'all' ? `?district=${encodeURIComponent(district)}` : '';
  return apiClient<ApiResponse<Incident[]>>(`/incidents${query}`, options);
}

export async function fetchIncidentById(
  id: string,
  options?: ApiFetchOptions
): Promise<{ success: boolean; data: Incident }> {
  return apiClient<{ success: boolean; data: Incident }>(`/incidents/${encodeURIComponent(id)}`, options);
}

export async function fetchIncidentTimeline(
  id: string,
  options?: ApiFetchOptions
): Promise<{ success: boolean; incidentId: string; count: number; data: any[] }> {
  return apiClient<{ success: boolean; incidentId: string; count: number; data: any[] }>(
    `/incidents/${encodeURIComponent(id)}/timeline`,
    options
  );
}
