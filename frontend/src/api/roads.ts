/**
 * Roads GeoJSON API Client
 */

import { apiClient, type ApiFetchOptions } from './client';
import type { RoadFeatureCollection } from '../types';

export async function fetchRoads(
  district?: string,
  options?: ApiFetchOptions
): Promise<RoadFeatureCollection> {
  const query = district && district !== 'all' ? `?district=${encodeURIComponent(district)}` : '';
  return apiClient<RoadFeatureCollection>(`/roads${query}`, options);
}
