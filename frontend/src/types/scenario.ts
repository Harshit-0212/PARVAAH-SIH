/**
 * Scenario Simulation Types for College Demonstrations & Drills
 */

export interface ScenarioRecord {
  id: string;
  name: string;
  description: string;
  district: string;
  state: string;
  rainfall24hMm: number;
  forecastRainfall24hMm: number;
  forecastRainfall72hMm: number;
  soilMoisturePercent: number;
  slopeDegrees: number;
  historicalSusceptibility: number;
  verifiedReportCount: number;
  verifiedReportSeverity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'NONE';
  roadStatus: 'OPEN' | 'PARTIALLY_BLOCKED' | 'CLOSED';
  shelterOccupancyPercent: number;
  durationMinutes: number;
  operator: string;
  isActive: boolean;
  activatedAt?: string;
  expiresAt: string;
  createdAt?: string;
}

export interface ScenarioInput {
  id?: string;
  name: string;
  description?: string;
  district: string;
  state?: string;
  rainfall24hMm: number;
  forecastRainfall24hMm: number;
  forecastRainfall72hMm?: number;
  soilMoisturePercent: number;
  slopeDegrees: number;
  historicalSusceptibility?: number;
  verifiedReportCount?: number;
  verifiedReportSeverity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'NONE';
  roadStatus?: 'OPEN' | 'PARTIALLY_BLOCKED' | 'CLOSED';
  shelterOccupancyPercent?: number;
  durationMinutes?: number;
  operator?: string;
}
