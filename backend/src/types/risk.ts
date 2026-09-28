export type RiskCategory = 'Low' | 'Medium' | 'High' | 'Very High';

export interface RiskInput {
  rainfall_24h: number;             // mm
  rainfall_forecast_6h: number;     // mm
  slope: number;                    // degrees
  elevation?: number;               // meters
  dist_to_stream: number;           // km or meters depending on normalized unit (formula expects normalized stream proximity)
  historical_flood_count: number;   // count of historical flood events from INDOFLOODS
  rainfall_forecast_24h?: number;   // mm for lead time calculation
}

export interface RiskOutput {
  riskScore: number;                // 0 - 100
  riskCategory: RiskCategory;
  breakdown?: {
    rain24hScore: number;
    forecast6hScore: number;
    slopeScore: number;
    distStreamScore: number;
    historyScore: number;
  };
}

export interface WardRisk {
  wardId: string;
  wardName: string;
  district?: string;
  state?: string;
  riskScore: number;
  riskCategory: RiskCategory;
  leadTimeHours: number;
  actionText: string;
  rainfall_24h?: number;
  rainfall_forecast_6h?: number;
  rainfall_forecast_24h?: number;
  slope?: number;
  elevation?: number;
  dist_to_stream?: number;
  historical_flood_count?: number;
  streamName?: string;
  recommendedShelter?: string;
  evacuationRoute?: string;
  updatedAt?: string | Date;
}
