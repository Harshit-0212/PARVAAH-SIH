/**
 * Relief Shelters API Client
 */

import { apiClient, type ApiFetchOptions } from './client';
import type { ShelterRecord, ApiResponse } from '../types';

export async function fetchShelters(
  district?: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<ShelterRecord[]>> {
  const query = district && district !== 'all' ? `?district=${encodeURIComponent(district)}` : '';
  return apiClient<ApiResponse<ShelterRecord[]>>(`/shelters${query}`, options);
}
