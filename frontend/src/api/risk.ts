/**
 * Risk Zones GeoJSON & XGBoost Risk API Client
 */

import { apiClient, type ApiFetchOptions } from './client';
import type { RiskZoneFeatureCollection, RiskZoneFeature } from '../types';

export interface RiskCalculationInput {
  rainfall_24h_mm: number;
  forecast_rainfall_24h_mm: number;
  soil_moisture_percent: number;
  slope_degrees: number;
  historical_landslide_density: number;
  verified_report_count: number;
  zoneId?: string;
  inputSources?: Record<string, string>;
  triggeredBy?: string;
}

/** 7-feature input for the demo_xgboost_v1 model */
export interface DemoXGBoostInput {
  rainfall_24h_mm: number;
  rainfall_48h_mm: number;
  rainfall_7d_mm: number;
  soil_moisture_percent: number;
  slope_degrees: number;
  elevation_m: number;
  /** Normalized 0–1 */
  historical_landslide_density: number;
  zoneId?: string;
  triggeredBy?: string;
}

export interface RiskCalculationResult {
  modelVersion: string;
  modelMode: 'DEMO_XGBOOST' | 'EXCEL_PILOT_XGBOOST' | 'PRACTICE_XGBOOST' | 'DEMO_RULE_BASED' | 'UNAVAILABLE';
  modelAvailable: boolean;
  landslideProbability: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  calculatedAt: string;
  forecastValidUntil: string;
  zoneId?: string;
  inputSummary: {
    rainfall_24h_mm: number;
    forecast_rainfall_24h_mm: number;
    soil_moisture_percent: number;
    slope_degrees: number;
    historical_landslide_density: number;
    verified_report_count: number;
  };
  inputSources?: Record<string, string>;
  contributingFactors: {
    rainfall24h: { value: number; normalized: number; contribution: number };
    forecastRainfall: { value: number; normalized: number; contribution: number };
    soilMoisture: { value: number; normalized: number; contribution: number };
    slope: { value: number; normalized: number; contribution: number };
    historicalSusceptibility: { value: number; normalized: number; contribution: number };
    verifiedFieldReports: { value: number; normalized: number; contribution: number };
  };
  evacuationRecommendation: 'NO_ADVICE' | 'MONITOR_SITUATION' | 'PREPARE_TO_EVACUATE' | 'VOLUNTARY_EVACUATION_RECOMMENDED' | 'SHELTER_IN_PLACE_RECOMMENDED' | 'VOLUNTARY' | 'ADVISORY';
  officialEvacuationStatus?: string;
  disclaimer: string;
  latencyMs: number;
  isFallback: boolean;
}

/** Result from the demo_xgboost_v1 7-feature endpoint */
export interface DemoXGBoostResult {
  modelVersion: string;
  modelMode: 'DEMO_XGBOOST' | 'DEMO_RULE_BASED';
  modelAvailable: boolean;
  landslideProbability: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  /** AI model recommendation — NOT an official order */
  evacuationRecommendation: string;
  /** Always NO_ADVICE from simulator — only authorised officer can change */
  officialEvacuationStatus: string;
  calculatedAt: string;
  inputSummary: DemoXGBoostInput;
  disclaimer: string;
  latencyMs: number;
  isFallback: boolean;
}

export interface RiskCalculationResponse {
  success: boolean;
  data: RiskCalculationResult;
  error?: string;
}

export interface DemoXGBoostResponse {
  success: boolean;
  data: DemoXGBoostResult;
  error?: string;
}

export interface RecalculateZoneResponse {
  success: boolean;
  message: string;
  data: RiskZoneFeature;
}

export async function fetchRiskZones(
  district?: string,
  options?: ApiFetchOptions
): Promise<RiskZoneFeatureCollection> {
  const query = district && district !== 'all' ? `?district=${encodeURIComponent(district)}` : '';
  return apiClient<RiskZoneFeatureCollection>(`/risk-zones${query}`, options);
}

export async function calculateRisk(
  input: RiskCalculationInput,
  options?: ApiFetchOptions
): Promise<RiskCalculationResponse> {
  return apiClient<RiskCalculationResponse>('/risk/calculate', {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    body: JSON.stringify(input)
  });
}

/** Call the 7-feature demo_xgboost_v1 endpoint via Node backend → FastAPI. */
export async function calculateXGBoostRisk(
  input: DemoXGBoostInput,
  options?: ApiFetchOptions
): Promise<DemoXGBoostResponse> {
  return apiClient<DemoXGBoostResponse>('/risk/predict', {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    body: JSON.stringify(input)
  });
}

export async function recalculateRiskForZone(
  zoneId: string,
  triggerSource = 'MANUAL_DASHBOARD',
  options?: ApiFetchOptions
): Promise<RecalculateZoneResponse> {
  return apiClient<RecalculateZoneResponse>(`/risk-zones/${encodeURIComponent(zoneId)}/recalculate`, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    body: JSON.stringify({ triggerSource })
  });
}

// ---------------------------------------------------------------------------
// SIH26191 Alignment: Red Zones & Safer Relocation Sites
// ---------------------------------------------------------------------------

export interface RedZoneSummary {
  state: string;
  district: string;
  total_points: number;
  count_critical: number;
  count_high: number;
  percent_high_or_critical: number;
  zone_risk_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  red_zone_flag: boolean;
  centroid_lat: number;
  centroid_lon: number;
  population_families?: number;
  priority?: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'NONE';
  vulnerability_score?: number;
  flood_risk_level?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  flood_red_zone_flag?: boolean;
  flood_risk_score?: number;
  recommended_site_ids?: string;
  relocation_feasibility?: 'FEASIBLE' | 'INSUFFICIENT_CAPACITY' | 'N/A';
}

export interface SaferRelocationSite {
  site_id: string;
  site_name: string;
  state: string;
  district: string;
  safe_from_landslides: boolean | string;
  capacity_families: number;
  capacity_people: number;
  latitude: number;
  longitude: number;
}

export async function fetchRedZones(options?: ApiFetchOptions): Promise<RedZoneSummary[]> {
  try {
    return await apiClient<RedZoneSummary[]>('/red-zones', options);
  } catch {
    // Graceful fallback to static JSON
    const res = await fetch('/data/red_zones_demo.json');
    if (!res.ok) throw new Error('Failed to load red zones');
    return await res.json();
  }
}

export async function fetchSaferSites(options?: ApiFetchOptions): Promise<SaferRelocationSite[]> {
  try {
    return await apiClient<SaferRelocationSite[]>('/safer-sites', options);
  } catch {
    // Graceful fallback to static JSON
    const res = await fetch('/data/safer_sites_demo.json');
    if (!res.ok) throw new Error('Failed to load safer sites');
    return await res.json();
  }
}

