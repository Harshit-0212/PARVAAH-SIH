/**
 * Meteorology & Hydrology Telemetry Types
 */

export type WeatherProviderType = 'IMD' | 'OPEN_METEO' | 'SCENARIO';
export type WeatherSourceType = 'IMD_LIVE' | 'IMD_DEMO' | 'OPEN_METEO_FORECAST' | 'SIMULATED_SCENARIO';

export interface WeatherRecord {
  district: string;
  districtName?: string;
  state?: string;
  currentRainfallMm?: number;
  rainfall1hMm?: number;
  rainfall3hMm?: number;
  rainfall24hMm?: number;
  forecastRainfall24hMm?: number;
  forecastRainfall72hMm?: number;
  thresholdLimitMm?: number;
  forecast24h?: string;
  riskOutlook?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  warningLevel?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  warningType?: string;
  warningText?: string;
  soilSaturationPct?: number;
  recordedAt?: string;
  observedAt?: string;
  fetchedAt?: string;
  validUntil?: string;
  source?: string;
  provider?: WeatherProviderType;
  sourceType?: WeatherSourceType;
  isLive: boolean;
  isDemo: boolean;
  isOfficialWarning?: boolean;
  dataFreshness: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
  disclaimer?: string;
}
