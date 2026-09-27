export type Language = 'en' | 'hi' | 'as' | 'bn' | 'ne';

export type UserRole = 'citizen' | 'field_officer' | 'district_officer' | 'admin';

export type PageState = 'landing' | 'login' | 'dashboard' | 'integration-health' | 'empty' | '404' | 'risk-simulator' | 'telemetry' | 'district-risk' | 'proof-to-protection' | 'red-zones' | 'about';

export type SystemMode = 'live' | 'loading' | 'skeleton' | 'offline' | 'error' | 'success' | 'no-data';

export type HazardType = 
  | 'landslide' 
  | 'flash_flood' 
  | 'river_flood' 
  | 'cyclone' 
  | 'road_blockage' 
  | 'bridge_damage' 
  | 'slope_crack' 
  | 'infrastructure_failure';

export type IncidentLifecycleStatus = 
  | 'REPORTED' 
  | 'UNDER_VERIFICATION' 
  | 'CONFIRMED' 
  | 'ACTIVE' 
  | 'CONTAINED' 
  | 'ROAD_PARTIALLY_REOPENED' 
  | 'RESOLVED' 
  | 'FALSE_REPORT' 
  | 'ARCHIVED'
  // Legacy aliases for backward compatibility
  | 'OPEN' 
  | 'IN_PROGRESS' 
  | 'CLEARED' 
  | 'MONITORING';

export type VerificationStatus = 
  | 'UNVERIFIED' 
  | 'COMMUNITY_CONFIRMED' 
  | 'OFFICIALLY_VERIFIED';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type DataFreshness = 'FRESH' | 'AGING' | 'STALE' | 'OFFLINE_SYNCED';

export type EvacuationOrderStatus = 
  | 'NO_ADVICE' 
  | 'PREPARE' 
  | 'VOLUNTARY_RECOMMENDED' 
  | 'MANDATORY_ORDERED' 
  | 'SHELTER_IN_PLACE' 
  | 'EVACUATION_COMPLETED' 
  | 'RETURN_NOT_AUTHORIZED' 
  | 'RETURN_AUTHORIZED';

export interface TimelineEntry {
  time: string;
  author: string;
  agency?: string;
  note: string;
  statusChange?: string;
}

export interface IncidentAttachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface LandslideIncident {
  id: string;
  hazardType: HazardType;
  title: string;
  titleHi?: string;
  locationName: string;
  locationNameHi: string;
  description: string;
  descriptionHi: string;
  status: IncidentLifecycleStatus;
  verificationStatus: VerificationStatus;
  severity: SeverityLevel;
  riskLevel: SeverityLevel; // Alias for backward compatibility with existing views
  confidence: number; // 0-100 %
  source: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  freshness: DataFreshness;
  coordinates: [number, number]; // [lat, lng] or [lng, lat]
  latitude?: number;
  longitude?: number;
  affectedGeometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  district: string;
  state: string;
  roadId: string;
  roadName: string;
  roadStatus: 'OPEN' | 'SINGLE_LANE' | 'BLOCKED' | 'HIGH_RISK' | 'UNKNOWN';
  clearanceEta?: string;
  rainfall24h: number;
  rainfallForecast?: string;
  soilMoisture?: number; // %
  slope?: number; // degrees
  evacuationLevel?: 'NONE' | 'ADVISORY' | 'VOLUNTARY' | 'MANDATORY';
  evacuationOrderStatus: EvacuationOrderStatus;
  nearestShelterId?: string;
  recommendedActions: string[];
  assignedAgency: string;
  assignedOfficer: string;
  attachments?: IncidentAttachment[];
  photoUrl?: string; // Legacy fallback
  timeline: TimelineEntry[];
  affectedVillagesCount: number;
  affectedPopulationEstimate: number;
  reportedAt: string;
  verifiedBy: string;
  reporterRole: UserRole;
  citizenReportCount?: number;
}

export interface SlopeSensor {
  id: string;
  stationName: string;
  district: string;
  state?: string;
  coordinates: [number, number];
  inclinometerMm: number;
  soilMoisturePct: number;
  status: 'CRITICAL' | 'WARNING' | 'STABLE';
  lastPing: string;
  batteryPct?: number;
  elevationMeters?: number;
  isDemo?: boolean;
}

export interface Shelter {
  id: string;
  name: string;
  district: string;
  state?: string;
  coordinates: [number, number];
  capacity: number;
  occupied: number;
  contactPhone: string;
  medicalOfficerAvailable?: boolean;
  generatorBackup?: boolean;
  suppliesStatus?: 'ADEQUATE' | 'CRITICAL' | 'DEPLETED';
  isOpen?: boolean;
  accessibilityFeatures?: string[];
  isDemo?: boolean;
}

export interface WeatherMetric {
  district: string;
  currentRainfall: number;
  thresholdLimit: number;
  forecast24h: string;
  forecast24hHi: string;
  riskOutlook: SeverityLevel;
  soilSaturationPct?: number;
  recordedAt?: string;
  isLive?: boolean;
}

export interface RoadStatus {
  id: string;
  roadCode: string;
  name: string;
  nameHi: string;
  district: string;
  state?: string;
  status: 'BLOCKED' | 'SINGLE_LANE' | 'CLEAR' | 'HIGH_RISK' | 'UNKNOWN';
  clearanceProgress: number; // percentage
  detourRouteName: string;
  detourRouteNameHi: string;
  coordinates?: [number, number][]; // LineString
  criticalBridgesInside?: string[];
  lastInspected?: string;
}

export interface SystemAlert {
  id: string;
  hazard: HazardType;
  severity: 'INFO' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'EMERGENCY';
  headline: string;
  headlineHi?: string;
  area: string;
  district: string;
  issuedAt: string;
  validUntil: string;
  clearAction: string;
  clearActionHi?: string;
  issuingAuthority: string;
  source: string;
  isTestAlert: boolean;
  language: Language;
}

export interface CitizenReportSubmission {
  localId?: string;
  hazardType: HazardType;
  description: string;
  coordinates: [number, number];
  locationName: string;
  roadCondition: 'OPEN' | 'PARTIAL' | 'BLOCKED' | 'UNKNOWN';
  peopleAffectedCount: number;
  reporterContact?: string;
  reporterName?: string;
  isSafeToApproach: boolean;
  photoBlob?: string;
  videoBlob?: string;
  submittedAt: string;
  syncStatus: 'SYNCED' | 'PENDING_OFFLINE' | 'FAILED';
}

// Re-export modular domain types and validator utilities
export * from './api';
export * from './incident';
export * from './geojson';
export * from './weather';
export * from './road';
export * from './shelter';
export * from './scenario';
