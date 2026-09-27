/**
 * Incident Domain Types and Geospatial Validators
 */

export type HazardType =
  | 'LANDSLIDE'
  | 'FLASH_FLOOD'
  | 'RIVER_FLOOD'
  | 'CYCLONE'
  | 'ROAD_BLOCKAGE'
  | 'BRIDGE_DAMAGE'
  | 'SLOPE_CRACK'
  | 'INFRASTRUCTURE_FAILURE';

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type RoadStatus =
  | 'OPEN'
  | 'PARTIALLY_BLOCKED'
  | 'CLOSED'
  | 'UNKNOWN';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  hazardType: HazardType;
  status: string;
  verificationStatus: string;
  severity: Severity;
  confidence?: number;
  source: string;
  isDemo: boolean;
  isLive: boolean;
  createdAt?: string;
  updatedAt: string;
  coordinates: Coordinates;
  affectedGeometry?: GeoJSON.Geometry;
  district?: string;
  state?: string;
  roadStatus?: RoadStatus;
  rainfall24hMm?: number;
  forecastRainfall24hMm?: number;
  soilMoisturePercent?: number;
  slopeDegrees?: number;
  riskScore?: number;
  evacuationRecommendation?: string;
  officialEvacuationStatus?: string;
  nearestShelterId?: string;
  recommendedActions?: string[];
  assignedAgency?: string;
  assignedOfficer?: string;
  timeline?: Array<{
    time: string;
    author: string;
    agency?: string;
    note: string;
    statusChange?: string;
  }>;
  dataFreshness?: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
}

export function isValidLatitude(value: unknown): value is number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180;
}

export function isValidCoordinatePair(lat: unknown, lng: unknown): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}
