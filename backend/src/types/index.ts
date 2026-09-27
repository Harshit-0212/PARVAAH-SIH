/**
 * PARVAAH Backend Domain & Data Types
 */

export type DataMode = 'demo' | 'live' | 'hybrid';
export type DataFreshness = 'FRESH' | 'AGING' | 'STALE';

export type HazardType =
  | 'LANDSLIDE'
  | 'FLASH_FLOOD'
  | 'RIVER_FLOOD'
  | 'CYCLONE'
  | 'ROAD_BLOCKAGE'
  | 'BRIDGE_DAMAGE'
  | 'SLOPE_CRACK'
  | 'INFRASTRUCTURE_FAILURE';

export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'ACTIVE'
  | 'UNDER_VERIFICATION'
  | 'CONTAINED'
  | 'RESOLVED'
  | 'ARCHIVED';

export type VerificationStatus =
  | 'DEMO'
  | 'UNVERIFIED'
  | 'COMMUNITY_CONFIRMED'
  | 'OFFICIALLY_VERIFIED';

export type RoadCondition = 'OPEN' | 'PARTIALLY_BLOCKED' | 'CLOSED' | 'UNKNOWN';

export type EvacuationRecommendation =
  | 'NO_ADVICE'
  | 'ADVISORY'
  | 'VOLUNTARY'
  | 'MANDATORY'
  | 'SHELTER_IN_PLACE';

export type OfficialEvacuationStatus =
  | 'NO_ADVICE'
  | 'PREPARE_TO_EVACUATE'
  | 'VOLUNTARY_EVACUATION_RECOMMENDED'
  | 'MANDATORY_EVACUATION_ORDERED'
  | 'SHELTER_IN_PLACE'
  | 'EVACUATION_COMPLETED'
  | 'RETURN_NOT_AUTHORIZED'
  | 'RETURN_AUTHORIZED';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface IncidentTimelineEntry {
  time: string;
  author: string;
  agency?: string;
  note: string;
  statusChange?: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  titleHi?: string;
  description: string;
  descriptionHi?: string;
  hazardType: HazardType;
  status: IncidentStatus;
  verificationStatus: VerificationStatus;
  severity: SeverityLevel;
  confidence: number;
  source: string;
  isDemo: boolean;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
  coordinates: GeoCoordinates;
  affectedGeometry?: GeoJSONGeometry;
  district: string;
  state: string;
  nearbyInfrastructure?: string[];
  roadStatus: RoadCondition;
  rainfall24hMm: number;
  forecastRainfall24hMm: number;
  soilMoisturePercent: number;
  slopeDegrees: number;
  riskScore?: number;
  evacuationRecommendation: EvacuationRecommendation;
  officialEvacuationStatus: OfficialEvacuationStatus;
  nearestShelterId: string;
  recommendedActions: string[];
  assignedAgency: string;
  assignedOfficer: string;
  attachments?: Array<{ id: string; type: string; url: string }>;
  timeline: IncidentTimelineEntry[];
  dataFreshness: DataFreshness;
}

export type WeatherProviderType = 'IMD' | 'OPEN_METEO' | 'SCENARIO';
export type WeatherSourceType =
  | 'IMD_LIVE'
  | 'IMD_DEMO'
  | 'OPEN_METEO_FORECAST'
  | 'SIMULATED_SCENARIO';

export interface NormalizedWeather {
  provider: WeatherProviderType;
  sourceType: WeatherSourceType;
  isLive: boolean;
  isDemo: boolean;
  isOfficialWarning: boolean;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  rainfall1hMm?: number;
  rainfall3hMm?: number;
  rainfall24hMm?: number;
  forecastRainfall24hMm?: number;
  forecastRainfall72hMm?: number;
  warningLevel?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  warningType?: string;
  warningText?: string;
  observedAt?: string;
  fetchedAt: string;
  validUntil?: string;
  dataAgeMinutes?: number;
  dataFreshness: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
  disclaimer: string;
}

export interface ScenarioInput {
  id?: string;
  name: string;
  description?: string;
  district: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  rainfall24hMm: number;
  forecastRainfall24hMm: number;
  forecastRainfall72hMm?: number;
  soilMoisturePercent: number;
  slopeDegrees: number;
  historicalSusceptibility?: number;
  verifiedReportCount?: number;
  verifiedReportSeverity?: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  roadStatus?: RoadCondition;
  shelterOccupancyPercent?: number;
  durationMinutes: number;
  operator?: string;
}

export interface ScenarioRecord extends ScenarioInput {
  id: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  activatedAt?: string;
}

export interface NormalizedForecast {
  district: string;
  state: string;
  generatedAt: string;
  periods: Array<{
    periodName: string;
    validFrom: string;
    validTo: string;
    expectedRainfallMm: number;
    hazardProbabilityPct: number;
    advisoryText: string;
  }>;
  disclaimer: string;
  isDemo: boolean;
  sourceType?: WeatherSourceType;
  provider?: WeatherProviderType;
}

export interface ShelterRecord {
  id: string;
  name: string;
  coordinates: GeoCoordinates;
  address: string;
  district: string;
  state: string;
  capacity: number;
  occupancy: number;
  availability: number;
  contactPhone?: string;
  accessibilityFeatures: string[];
  medicalOfficerAvailable?: boolean;
  generatorBackup?: boolean;
  suppliesStatus?: 'ADEQUATE' | 'DEPLETED' | 'CRITICAL';
  isOpen?: boolean;
  updatedAt: string;
  source: string;
  isDemo: boolean;
}

export interface SensorRecord {
  id: string;
  stationName: string;
  district: string;
  state: string;
  coordinates: GeoCoordinates;
  sensorType: string;
  reading: number;
  unit: string;
  thresholdStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  observedAt: string;
  batteryPercent: number;
  elevationMeters: number;
  source: string;
  isDemo: boolean;
  isLive: boolean;
  updatedAt: string;
  dataFreshness: DataFreshness;
}

export type ReportVerificationStatus =
  | 'UNDER_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DUPLICATE';

export interface CitizenReportInput {
  clientReportId: string;
  hazardType: HazardType;
  description: string;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  roadCondition?: RoadCondition;
  numberOfPeopleAffected?: number;
  contactNumber?: string;
  reporterRole?: 'citizen' | 'field_officer' | 'district_officer' | 'admin';
  captureTimestamp?: string;
  attachmentMetadata?: Array<{
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }>;
}

export interface CitizenReportRecord extends CitizenReportInput {
  serverReportId: string;
  id?: string;
  district: string;
  state: string;
  coordinates: GeoCoordinates;
  status: 'UNDER_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verificationStatus: ReportVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  locationResolutionStatus?: 'RESOLVED' | 'OUTSIDE_SERVICE_REGION' | 'UNRESOLVED' | 'MANUAL_CONFIRMED';
  qualityFlags?: string[];
  userWarning?: string;
  attachmentMetadata?: any[];
  attachments?: any[];
  receivedAt: string;
  source: string;
  isDemo: boolean;
  isLive: boolean;
  dataFreshness: DataFreshness;
}


export interface IntegrationHealth {
  name: string;
  configured: boolean;
  status: 'DEMO' | 'NOT_CONFIGURED' | 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'ERROR';
  isLive: boolean;
  lastSuccessfulFetch: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  dataAgeMinutes: number | null;
  message: string;
  checkedAt?: string;
  latencyMs?: number | null;
  sourceType?: 'LIVE_CHECK' | 'DATABASE_CHECK' | 'CONFIGURATION' | 'DEMO' | 'NOT_CONFIGURED';
  details?: Record<string, unknown>;
}

export interface RiskZoneFeature {
  type: 'Feature';
  id: string;
  properties: {
    zoneId: string;
    zoneName: string;
    riskScore: number;
    riskLevel: SeverityLevel;
    confidence: number;
    modelVersion: string;
    modelMode: 'DEMO_RULE_BASED' | 'TRAINED_MODEL' | 'UNAVAILABLE';
    calculatedAt: string;
    forecastValidUntil: string;
    contributingFactors: {
      rainfall24hContribution: number;
      forecastRainfallContribution: number;
      soilMoistureContribution: number;
      slopeContribution: number;
      historicalSusceptibilityContribution: number;
      verifiedFieldReportsContribution: number;
    };
    affectedVillages: string[];
    affectedRoadSegments: string[];
    nearbyShelters: string[];
    recommendedAction: string;
    disclaimer: string;
    isDemo: boolean;
    isLive: boolean;
  };
  geometry: GeoJSONGeometry;
}
