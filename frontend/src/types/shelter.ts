/**
 * Relief Shelter Domain Types
 */

import type { Coordinates } from './incident';

export interface ShelterRecord {
  id: string;
  name: string;
  district: string;
  state: string;
  coordinates: Coordinates;
  capacity: number;
  occupancy: number;
  contactPhone: string;
  medicalOfficerAvailable: boolean;
  generatorBackup: boolean;
  suppliesStatus: 'ADEQUATE' | 'DEPLETED' | 'CRITICAL';
  isOpen: boolean;
  accessibilityFeatures: string[];
  source: string;
  isDemo: boolean;
  isLive: boolean;
  updatedAt: string;
  dataFreshness: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
}

export interface SensorRecord {
  id: string;
  stationName: string;
  district: string;
  state: string;
  coordinates: Coordinates;
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
  dataFreshness: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
}

export interface CitizenReportRecord {
  id: string;
  serverReportId?: string;
  clientReportId?: string;
  hazardType: string;
  description: string;
  verificationStatus: 'UNDER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE';
  status?: string;
  severity?: string;
  coordinates: Coordinates;
  latitude?: number;
  longitude?: number;
  district: string;
  state?: string;
  roadCondition?: string;
  numberOfPeopleAffected?: number;
  contactNumber?: string;
  reporterRole?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  receivedAt: string;
  captureTimestamp?: string;
  mediaCount?: number;
  attachmentMetadata?: any[];
  source: string;
  isDemo: boolean;
  isLive: boolean;
  dataFreshness: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
}

