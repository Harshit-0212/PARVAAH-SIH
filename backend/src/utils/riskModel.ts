import { RiskInput, RiskOutput, RiskCategory } from '../types/risk.js';

/**
 * Calculates hyper-local flood risk score (0 - 100) and assigns category.
 * 
 * Formula:
 * - rainfall_24h: min(rainfall_24h / 100, 30)
 * - rainfall_forecast_6h: min(rainfall_forecast_6h / 50, 30)
 * - slope: min(slope / 10, 15)
 * - dist_to_stream: max(0, 10 - dist_to_stream)
 * - historical_flood_count: min(historical_flood_count * 2, 15)
 * - Total = sum (max 100)
 * 
 * Categories:
 * - Very High: >= 70
 * - High: >= 50
 * - Medium: >= 30
 * - Low: < 30
 */
export function calculateFloodRisk(input: RiskInput): RiskOutput {
  const {
    rainfall_24h,
    rainfall_forecast_6h,
    slope,
    dist_to_stream,
    historical_flood_count
  } = input;

  const rain24hScore = Math.min(Math.max(0, rainfall_24h) / 100, 30);
  const forecast6hScore = Math.min(Math.max(0, rainfall_forecast_6h) / 50, 30);
  const slopeScore = Math.min(Math.max(0, slope) / 10, 15);
  const distStreamScore = Math.max(0, 10 - Math.max(0, dist_to_stream));
  const historyScore = Math.min(Math.max(0, historical_flood_count) * 2, 15);

  const rawTotal = rain24hScore + forecast6hScore + slopeScore + distStreamScore + historyScore;
  const riskScore = Math.min(100, Math.max(0, Math.round(rawTotal * 100) / 100));

  let riskCategory: RiskCategory;
  if (riskScore >= 70) {
    riskCategory = 'Very High';
  } else if (riskScore >= 50) {
    riskCategory = 'High';
  } else if (riskScore >= 30) {
    riskCategory = 'Medium';
  } else {
    riskCategory = 'Low';
  }

  return {
    riskScore,
    riskCategory,
    breakdown: {
      rain24hScore: Math.round(rain24hScore * 100) / 100,
      forecast6hScore: Math.round(forecast6hScore * 100) / 100,
      slopeScore: Math.round(slopeScore * 100) / 100,
      distStreamScore: Math.round(distStreamScore * 100) / 100,
      historyScore: Math.round(historyScore * 100) / 100,
    }
  };
}
