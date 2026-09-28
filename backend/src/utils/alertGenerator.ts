import { RiskCategory } from '../types/risk.js';

export interface AlertContext {
  wardName: string;
  riskScore: number;
  riskCategory: RiskCategory;
  leadTimeHours: number;
  streamName?: string;
  recommendedShelter?: string;
  evacuationRoute?: string;
}

/**
 * Estimates lead time based on forecast rainfall triggers:
 * - forecast_6h > 50 -> 6 hours
 * - forecast_24h > 100 -> 24 hours
 * - Else -> 24 hours
 */
export function estimateLeadTime(forecast6h: number, forecast24h?: number): number {
  if (forecast6h > 50) {
    return 6;
  }
  if ((forecast24h ?? 0) > 100) {
    return 24;
  }
  return 24;
}

/**
 * Generates an actionable early warning text advisory for a ward
 */
export function generateActionText(ctx: AlertContext): string {
  const { wardName, riskScore, riskCategory, leadTimeHours, streamName, recommendedShelter, evacuationRoute } = ctx;
  const stream = streamName || 'nearby stream/river channel';
  const shelter = recommendedShelter || 'Designated Community Flood Shelter';
  const route = evacuationRoute || 'Primary High-ground Arterial Road';

  if (riskCategory === 'Very High') {
    return `CRITICAL: Flash flood risk is VERY HIGH (${riskScore}/100) in ${wardName}. Evacuate low-lying areas near ${stream} within the next ${leadTimeHours} hours. Take [${route}] to reach shelter at [${shelter}]. Protect livestock and essential documents immediately.`;
  }

  if (riskCategory === 'High') {
    return `High flood risk in next ${leadTimeHours} hours for ${wardName} (${riskScore}/100). Evacuate low-lying areas near ${stream}. Use [${route}] to reach [${shelter}]. Keep emergency supplies ready.`;
  }

  if (riskCategory === 'Medium') {
    return `Moderate flood advisory for ${wardName} (${riskScore}/100) over the next ${leadTimeHours} hours. Monitor water levels near ${stream}. Avoid traveling through unpaved flood-prone roads.`;
  }

  return `Low flood risk in ${wardName} (${riskScore}/100). Normal alert status. Continue regular monitoring.`;
}
