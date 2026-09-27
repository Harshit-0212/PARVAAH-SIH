import type { NormalizedWeather, NormalizedForecast, IntegrationHealth } from '../../types/index.js';

export interface WeatherQuery {
  district?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

export interface WeatherProvider {
  getCurrentWeather(input: WeatherQuery): Promise<NormalizedWeather | NormalizedWeather[]>;
  getForecast(input: WeatherQuery): Promise<NormalizedForecast>;
  getHealth(): Promise<IntegrationHealth>;
}
