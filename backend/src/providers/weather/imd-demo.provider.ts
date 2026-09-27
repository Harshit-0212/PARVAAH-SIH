import type { WeatherProvider, WeatherQuery } from './weather-provider.interface.js';
import type { NormalizedWeather, NormalizedForecast, IntegrationHealth } from '../../types/index.js';
import { DEMO_WEATHER_RECORDS, DEMO_FORECASTS } from '../../data/demo/weather.js';
import { calculateDistanceKm } from '../../utils/geo.js';

export class ImdDemoProvider implements WeatherProvider {
  async getCurrentWeather(input: WeatherQuery): Promise<NormalizedWeather | NormalizedWeather[]> {
    if (input.lat !== undefined && input.lng !== undefined) {
      // Find nearest station by haversine distance
      let nearest = DEMO_WEATHER_RECORDS[0];
      let minDistance = Infinity;
      for (const record of DEMO_WEATHER_RECORDS) {
        const dist = calculateDistanceKm(input.lat, input.lng, record.latitude, record.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = record;
        }
      }
      return {
        ...nearest,
        isDemo: true,
        isLive: false,
        sourceType: 'IMD_DEMO'
      };
    }

    if (input.district && input.district !== 'all') {
      const match = DEMO_WEATHER_RECORDS.find(w => w.district && w.district.toLowerCase() === input.district!.toLowerCase());
      if (match) return { ...match, isDemo: true, isLive: false, sourceType: 'IMD_DEMO' };
    }

    return DEMO_WEATHER_RECORDS.map(r => ({ ...r, isDemo: true, isLive: false, sourceType: 'IMD_DEMO' }));
  }

  async getForecast(input: WeatherQuery): Promise<NormalizedForecast> {
    const districtKey = input.district && input.district !== 'all' ? input.district : 'east_sikkim';
    const forecast = DEMO_FORECASTS[districtKey] || DEMO_FORECASTS['east_sikkim'];
    return {
      ...forecast,
      isDemo: true
    };
  }

  async getHealth(): Promise<IntegrationHealth> {
    return {
      name: 'India Meteorological Department (IMD) Gateway',
      configured: false,
      status: 'DEMO',
      isLive: false,
      lastSuccessfulFetch: null,
      lastAttemptAt: null,
      lastError: null,
      dataAgeMinutes: null,
      sourceType: 'DEMO',
      message: 'IMD live access is disabled. IMD-compatible demo weather data is active; no official IMD request was made.'
    };
  }
}

export const imdDemoProvider = new ImdDemoProvider();
