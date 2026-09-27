import { z } from 'zod';
import type { WeatherProvider, WeatherQuery } from './weather-provider.interface.js';
import type { NormalizedWeather, NormalizedForecast, IntegrationHealth } from '../../types/index.js';
import { env } from '../../config/env.js';
import { cache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';
import { WeatherSnapshotModel } from '../../models/WeatherSnapshot.model.js';
import { isDatabaseConnected } from '../../config/db.js';

// Zod Schema to validate external Open-Meteo API response
const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number().optional(),
  utc_offset_seconds: z.number().optional(),
  timezone: z.string().optional(),
  current: z.object({
    time: z.string().optional(),
    precipitation: z.number().optional().default(0),
    temperature_2m: z.number().optional().default(20),
    weather_code: z.number().optional()
  }).optional(),
  hourly: z.object({
    time: z.array(z.string()),
    precipitation: z.array(z.number().nullable()).optional().default([]),
    rain: z.array(z.number().nullable()).optional().default([]),
    showers: z.array(z.number().nullable()).optional().default([]),
    weather_code: z.array(z.number().nullable()).optional().default([])
  })
});

// District coordinate map for fallback when district name is queried without lat/lng
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; state: string }> = {
  east_sikkim: { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
  east_khasi: { lat: 25.5788, lng: 91.8933, state: 'Meghalaya' },
  dima_hasao: { lat: 25.1782, lng: 93.0189, state: 'Assam' },
  west_kameng: { lat: 27.2645, lng: 92.2341, state: 'Arunachal Pradesh' },
  kohima: { lat: 25.6751, lng: 94.1086, state: 'Nagaland' },
  aizawl: { lat: 23.7271, lng: 92.7176, state: 'Mizoram' },
  imphal_west: { lat: 24.8170, lng: 93.9368, state: 'Manipur' }
};

export class OpenMeteoProvider implements WeatherProvider {
  private lastSuccessfulFetch: string | null = null;
  private lastAttemptAt: string | null = null;
  private lastError: string | null = null;
  private lastRequestLatencyMs: number | null = null;
  private lastSuccessRecord: NormalizedWeather | null = null;

  private static readonly DISCLAIMER =
    'Third-party weather forecast data used for research/demo. This is not an official IMD warning.';

  async getCurrentWeather(input: WeatherQuery, force = false): Promise<NormalizedWeather | NormalizedWeather[]> {
    if (!env.OPEN_METEO_ENABLED) {
      throw new Error('Open-Meteo provider is disabled in configuration.');
    }

    // Determine target coordinate
    let lat = input.lat;
    let lng = input.lng;
    let district = input.district;
    let state = input.state || 'North East India';

    if ((lat === undefined || lng === undefined) && district && district !== 'all') {
      const coords = DISTRICT_COORDINATES[district.toLowerCase()];
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        state = coords.state;
      }
    }

    // Default to East Sikkim if not specified
    if (lat === undefined || lng === undefined) {
      lat = 27.3389;
      lng = 88.6065;
      district = district || 'east_sikkim';
      state = 'Sikkim';
    }

    const cacheKey = `open-meteo-${lat.toFixed(2)}-${lng.toFixed(2)}`;
    const cached = force ? null : cache.get<NormalizedWeather>(cacheKey);
    if (cached) {
      return cached;
    }

    this.lastAttemptAt = new Date().toISOString();
    const requestStartedAt = Date.now();

    const url = `${env.OPEN_METEO_BASE_URL}?latitude=${lat}&longitude=${lng}&hourly=precipitation,rain,showers,weather_code&current=precipitation,temperature_2m,weather_code&forecast_days=7&timezone=Asia%2FKolkata`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.OPEN_METEO_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeout);
      this.lastRequestLatencyMs = Date.now() - requestStartedAt;

      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status}: ${res.statusText}`);
      }

      const rawJson = await res.json();
      const validated = openMeteoResponseSchema.parse(rawJson);

      // Compute rainfall aggregations
      const hourlyRain = validated.hourly.precipitation || [];
      const next24hValues = hourlyRain.slice(0, 24).map(v => v || 0);
      const next72hValues = hourlyRain.slice(0, 72).map(v => v || 0);

      const sum24h = Math.round(next24hValues.reduce((acc, v) => acc + v, 0) * 10) / 10;
      const sum72h = Math.round(next72hValues.reduce((acc, v) => acc + v, 0) * 10) / 10;
      const current1h = validated.current?.precipitation ?? (next24hValues[0] || 0);

      const nowIso = new Date().toISOString();
      const validUntilIso = new Date(Date.now() + 24 * 3600000).toISOString();

      let warningLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
      if (sum24h >= 150) warningLevel = 'RED';
      else if (sum24h >= 100) warningLevel = 'ORANGE';
      else if (sum24h >= 50) warningLevel = 'YELLOW';

      const normalized: NormalizedWeather = {
        provider: 'OPEN_METEO',
        sourceType: 'OPEN_METEO_FORECAST',
        isLive: true,
        isDemo: false,
        isOfficialWarning: false, // STRICTLY FALSE
        latitude: lat,
        longitude: lng,
        district: district || 'Regional Corridor',
        state,
        rainfall1hMm: current1h,
        rainfall3hMm: Math.round(next24hValues.slice(0, 3).reduce((acc, v) => acc + v, 0) * 10) / 10,
        rainfall24hMm: sum24h,
        forecastRainfall24hMm: sum24h,
        forecastRainfall72hMm: sum72h,
        warningLevel,
        warningType: sum24h >= 100 ? 'High Precipitation Window (Open-Meteo Model)' : 'Standard Seasonal Outlook',
        warningText: `Expected ${sum24h}mm rainfall over next 24h per numerical hydrological model.`,
        observedAt: validated.current?.time || nowIso,
        fetchedAt: nowIso,
        validUntil: validUntilIso,
        dataAgeMinutes: 1,
        dataFreshness: 'FRESH',
        disclaimer: OpenMeteoProvider.DISCLAIMER
      };

      // Store in memory cache
      cache.set(cacheKey, normalized, env.OPEN_METEO_CACHE_TTL_MINUTES * 60);

      this.lastSuccessfulFetch = nowIso;
      this.lastSuccessRecord = normalized;
      this.lastError = null;

      // Asynchronously store snapshot in MongoDB if database is connected
      if (isDatabaseConnected()) {
        WeatherSnapshotModel.create(normalized).catch((dbErr: any) => {
          logger.warn(`Failed saving weather snapshot to MongoDB: ${dbErr.message}`);
        });
      }

      return normalized;
    } catch (err: any) {
      clearTimeout(timeout);
      this.lastRequestLatencyMs = Date.now() - requestStartedAt;
      this.lastError = err.message || 'Open-Meteo network request failed';
      logger.warn(`[OpenMeteoProvider] Fetch notice: ${this.lastError}`);

      // Fallback 1: Return last successful cached record marked as STALE
      if (this.lastSuccessRecord) {
        return {
          ...this.lastSuccessRecord,
          dataFreshness: 'STALE',
          disclaimer: `${OpenMeteoProvider.DISCLAIMER} (Serving cached fallback telemetry)`
        };
      }

      // Fallback 2: Synthetic research baseline
      return {
        provider: 'OPEN_METEO',
        sourceType: 'OPEN_METEO_FORECAST',
        isLive: false,
        isDemo: true,
        isOfficialWarning: false,
        latitude: lat,
        longitude: lng,
        district: district || 'Regional',
        state,
        rainfall1hMm: 8.5,
        rainfall24hMm: 140,
        forecastRainfall24hMm: 55,
        forecastRainfall72hMm: 120,
        warningLevel: 'YELLOW',
        warningType: 'Research Fallback Telemetry',
        warningText: 'External weather provider unavailable; serving research model baseline.',
        fetchedAt: new Date().toISOString(),
        dataFreshness: 'STALE',
        disclaimer: `${OpenMeteoProvider.DISCLAIMER} (Simulated baseline due to provider timeout)`
      };
    }
  }

  async getForecast(input: WeatherQuery): Promise<NormalizedForecast> {
    const weather = await this.getCurrentWeather(input) as NormalizedWeather;
    const now = new Date();

    return {
      district: weather.district || 'Regional',
      state: weather.state || 'North East India',
      generatedAt: now.toISOString(),
      provider: 'OPEN_METEO',
      sourceType: 'OPEN_METEO_FORECAST',
      periods: [
        {
          periodName: 'Next 24 Hours',
          validFrom: now.toISOString(),
          validTo: new Date(now.getTime() + 24 * 3600000).toISOString(),
          expectedRainfallMm: weather.forecastRainfall24hMm || 45,
          hazardProbabilityPct: (weather.forecastRainfall24hMm || 0) > 100 ? 80 : 45,
          advisoryText: 'High-resolution numerical weather prediction (Open-Meteo).'
        },
        {
          periodName: 'Next 72 Hours',
          validFrom: now.toISOString(),
          validTo: new Date(now.getTime() + 72 * 3600000).toISOString(),
          expectedRainfallMm: weather.forecastRainfall72hMm || 110,
          hazardProbabilityPct: (weather.forecastRainfall72hMm || 0) > 150 ? 85 : 55,
          advisoryText: 'Cumulative 3-day precipitation outlook for hill slope stability analysis.'
        }
      ],
      disclaimer: OpenMeteoProvider.DISCLAIMER,
      isDemo: false
    };
  }

  async getHealth(): Promise<IntegrationHealth> {
    const isConfigured = Boolean(env.OPEN_METEO_ENABLED && env.OPEN_METEO_BASE_URL);
    const hasError = Boolean(this.lastError);
    const hasSuccessfulFetch = Boolean(this.lastSuccessfulFetch);

    return {
      name: 'Open-Meteo High-Resolution Weather API',
      configured: isConfigured,
      status: !isConfigured
        ? 'NOT_CONFIGURED'
        : hasError
        ? 'DEGRADED'
        : hasSuccessfulFetch
        ? 'CONNECTED'
        : 'DEGRADED',
      isLive: hasSuccessfulFetch && !hasError,
      lastSuccessfulFetch: this.lastSuccessfulFetch,
      lastAttemptAt: this.lastAttemptAt,
      lastError: this.lastError,
      dataAgeMinutes: this.lastSuccessfulFetch
        ? Math.round((Date.now() - new Date(this.lastSuccessfulFetch).getTime()) / 60000)
        : null,
      sourceType: 'LIVE_CHECK',
      latencyMs: this.lastRequestLatencyMs,
      message: !isConfigured
        ? 'Open-Meteo is disabled or has no configured endpoint.'
        : hasError
        ? 'Open-Meteo request failed. The previous successful timestamp is retained.'
        : hasSuccessfulFetch
        ? 'Third-party weather forecast data available for research/demo use. Not an official IMD warning.'
        : 'Open-Meteo is configured but has not been checked yet.'
    };
  }

  async syncNow(lat = 27.3389, lng = 88.6065): Promise<NormalizedWeather> {
    const result = await this.getCurrentWeather({ lat, lng }, true);
    return Array.isArray(result) ? result[0] : result;
  }
}

export const openMeteoProvider = new OpenMeteoProvider();
