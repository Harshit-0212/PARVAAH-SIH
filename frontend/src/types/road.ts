/**
 * Road Domain & Corridor Types
 */

export type RoadOperationalStatus = 'OPEN' | 'PARTIALLY_BLOCKED' | 'CLOSED' | 'UNKNOWN';

export interface RoadRecord {
  id: string;
  roadCode: string;
  name: string;
  nameHi?: string;
  district: string;
  state: string;
  status: RoadOperationalStatus;
  clearanceProgress: number;
  detourRouteName?: string;
  criticalBridgesInside?: string[];
  clearanceEta?: string;
  lastInspected?: string;
  source?: string;
  isDemo?: boolean;
  isLive?: boolean;
  updatedAt?: string;
  dataFreshness?: 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
}
