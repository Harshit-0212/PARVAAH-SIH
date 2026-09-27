import { Types } from 'mongoose';

// User Roles & Enums
export type UserRole = 'citizen' | 'officer' | 'admin';
export type IncidentSeverity = 'low' | 'moderate' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'in_progress' | 'cleared' | 'monitoring';
export type IncidentSource = 'citizen' | 'officer' | 'sensor' | 'model';
export type RoadStatusType = 'open' | 'at_risk' | 'blocked';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';
export type ReportStatus = 'pending_verification' | 'verified' | 'rejected' | 'duplicate';
export type AlertSeverity = 'info' | 'advisory' | 'warning' | 'emergency';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SyncActionType = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncEntityType = 'Report' | 'Incident' | 'RoadStatus';

// GeoJSON Types following strict MongoDB Standards
export interface GeoJSONPoint {
  type: 'Point';
  /** Coordinates array: [longitude, latitude] */
  coordinates: [number, number];
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  /** Coordinates array: linear ring array of [longitude, latitude] */
  coordinates: [number, number][][];
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: [number, number][][][];
}

export interface GeoJSONLineString {
  type: 'LineString';
  /** Coordinates array: array of [longitude, latitude] points representing line segments */
  coordinates: [number, number][];
}

export interface GeoJSONMultiLineString {
  type: 'MultiLineString';
  coordinates: [number, number][][];
}

// Domain Model Interfaces
export interface IUser {
  _id?: Types.ObjectId;
  fullName: string;
  email?: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  districtId?: Types.ObjectId;
  languagePreference: 'en' | 'hi' | 'as';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDistrict {
  _id?: Types.ObjectId;
  name: string;
  stateName: string;
  code: string;
  boundary: GeoJSONPolygon | GeoJSONMultiPolygon;
  center: GeoJSONPoint;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVillage {
  _id?: Types.ObjectId;
  districtId: Types.ObjectId;
  name: string;
  population: number;
  location: GeoJSONPoint;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoad {
  _id?: Types.ObjectId;
  districtId: Types.ObjectId;
  roadName: string;
  roadCode?: string;
  status: RoadStatusType;
  riskLevel: RiskLevel;
  geometry: GeoJSONLineString | GeoJSONMultiLineString;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IIncident {
  _id?: Types.ObjectId;
  districtId: Types.ObjectId;
  villageId?: Types.ObjectId;
  roadId?: Types.ObjectId;
  reportedBy?: Types.ObjectId;
  incidentType: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  sourceType: IncidentSource;
  location: GeoJSONPoint;
  mediaUrls: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReport {
  _id?: Types.ObjectId;
  reporterId: Types.ObjectId;
  incidentId?: Types.ObjectId;
  districtId: Types.ObjectId;
  title: string;
  description: string;
  mediaUrls: string[];
  location: GeoJSONPoint;
  reportStatus: ReportStatus;
  offlineCreatedAt?: Date;
  syncedAt?: Date;
  clientTempId?: string;
  dedupeHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAlert {
  _id?: Types.ObjectId;
  districtId: Types.ObjectId;
  title: string;
  message: string;
  severity: AlertSeverity;
  languageCode: string;
  isActive: boolean;
  issuedBy?: Types.ObjectId;
  startsAt: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWeatherSnapshot {
  _id?: Types.ObjectId;
  districtId: Types.ObjectId;
  rainfallMm: number;
  soilMoisture?: number;
  forecastWindow: string;
  sourceName: string;
  observedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRiskAssessment {
  _id?: Types.ObjectId;
  districtId: Types.ObjectId;
  villageId?: Types.ObjectId;
  roadId?: Types.ObjectId;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  reasoning: string;
  modelVersion: string;
  assessedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISyncQueue {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  entityType: SyncEntityType;
  entityId?: Types.ObjectId;
  actionType: SyncActionType;
  payload: Record<string, unknown>;
  syncStatus: SyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// API DTO Interfaces
export interface CreateReportInput {
  reporterId: string;
  districtId: string;
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  mediaUrls?: string[];
  clientTempId?: string;
  offlineCreatedAt?: string;
  dedupeHash?: string;
}

export interface DashboardSummaryResponse {
  district: IDistrict | null;
  activeAlertsCount: number;
  activeAlerts: IAlert[];
  recentIncidentsCount: number;
  recentIncidents: IIncident[];
  highRiskRoadsCount: number;
  roads: IRoad[];
  latestWeather: IWeatherSnapshot | null;
  latestRiskAssessment: IRiskAssessment | null;
}
