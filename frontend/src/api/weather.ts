/**
 * Weather & Hydrology API Client
 */

import { apiClient, type ApiFetchOptions } from './client';
import type { WeatherRecord, ApiResponse } from '../types';

export async function fetchWeather(
  district?: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<WeatherRecord[]>> {
  const query = district && district !== 'all' ? `?district=${encodeURIComponent(district)}` : '';
  return apiClient<ApiResponse<WeatherRecord[]>>(`/weather${query}`, options);
}

export async function fetchWeatherForecast(
  district?: string,
  options?: ApiFetchOptions
): Promise<{ success: boolean; data: any }> {
  const query = district && district !== 'all' ? `?district=${encodeURIComponent(district)}` : '';
  return apiClient<{ success: boolean; data: any }>(`/weather/forecast${query}`, options);
}
