/**
 * GeoJSON Domain Types for Risk Zones, Roads, and Evacuation Areas
 */

export interface RiskZoneProperties {
  zoneId: string;
  title: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  confidence: number;
  modelVersion: string;
  contributingFactors?: Array<{ factor: string; weight: string; impact: string }>;
  forecastValidUntil: string;
  affectedRoads: string[];
  affectedVillages: string[];
  recommendedAction: string;
  disclaimer: string;
  source: string;
  isDemo: boolean;
  isLive: boolean;
  updatedAt: string;
  dataFreshness: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
}

export type RiskZoneFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, RiskZoneProperties>;
export type RiskZoneFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, RiskZoneProperties>;

export interface RoadProperties {
  id: string;
  name: string;
  roadCode: string;
  status: 'OPEN' | 'PARTIALLY_BLOCKED' | 'CLOSED' | 'UNKNOWN';
  district?: string;
  state?: string;
  clearanceProgress?: number;
  detourRouteName?: string;
  criticalBridges?: string[];
  clearanceEta?: string;
  lastInspected?: string;
  source: string;
  isDemo: boolean;
  isLive: boolean;
  updatedAt: string;
  dataFreshness: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
}

export type RoadFeature = GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString, RoadProperties>;
export type RoadFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString | GeoJSON.MultiLineString, RoadProperties>;

export interface EvacuationZoneProperties {
  zoneId: string;
  name: string;
  status: 'EVACUATE_NOW' | 'PREPARE' | 'SAFE_HAVEN' | 'RESTRICTED_NO_ENTRY';
  designatedShelterIds: string[];
  updatedAt: string;
  source: string;
  isDemo: boolean;
}

export type EvacuationZoneFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, EvacuationZoneProperties>;
export type EvacuationZoneFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, EvacuationZoneProperties>;
