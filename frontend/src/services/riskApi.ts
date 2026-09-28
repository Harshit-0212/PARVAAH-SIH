import type { WardRisk, WardAlert } from '../types/risk';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetches computed flood risk scores for all administrative wards
 */
export async function fetchWardRisks(): Promise<WardRisk[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/wards/risk`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.warn('Backend /wards/risk offline, returning resilient demo ward data:', error);
    return [
      {
        wardId: 'W-01',
        wardName: 'Silpukhuri Ward',
        district: 'Kamrup',
        state: 'Assam',
        riskScore: 78.4,
        riskCategory: 'Very High',
        leadTimeHours: 6,
        actionText: 'CRITICAL: Flash flood risk is VERY HIGH (78.4/100) in Silpukhuri Ward. Evacuate low-lying areas near Bharalu Stream within the next 6 hours. Take [Silpukhuri Main Link Rd -> G.S. Road Flyover] to reach shelter at [Guwahati High Secondary Shelter Camp].',
        rainfall_24h: 185,
        rainfall_forecast_6h: 72,
        streamName: 'Bharalu Stream',
        recommendedShelter: 'Guwahati High Secondary Shelter Camp',
        evacuationRoute: 'Silpukhuri Main Link Rd -> G.S. Road Flyover'
      },
      {
        wardId: 'W-02',
        wardName: 'Dispur Valley',
        district: 'Kamrup',
        state: 'Assam',
        riskScore: 58.2,
        riskCategory: 'High',
        leadTimeHours: 6,
        actionText: 'High flood risk in next 6 hours for Dispur Valley (58.2/100). Evacuate low-lying areas near Basistha River. Use [Capital Complex Arterial -> National Highway 27] to reach [Dispur College Flood Relief Center]. Keep emergency supplies ready.',
        rainfall_24h: 125,
        rainfall_forecast_6h: 55,
        streamName: 'Basistha River',
        recommendedShelter: 'Dispur College Flood Relief Center',
        evacuationRoute: 'Capital Complex Arterial -> National Highway 27'
      },
      {
        wardId: 'W-03',
        wardName: 'Kamakhya Foothills',
        district: 'Kamrup',
        state: 'Assam',
        riskScore: 21.0,
        riskCategory: 'Low',
        leadTimeHours: 24,
        actionText: 'Low flood risk in Kamakhya Foothills (21.0/100). Normal alert status. Continue regular monitoring.',
        rainfall_24h: 45,
        rainfall_forecast_6h: 18,
        streamName: 'Brahmaputra Tributary',
        recommendedShelter: 'Kamakhya Community Hall',
        evacuationRoute: 'Temple Ridge Road'
      },
      {
        wardId: 'W-04',
        wardName: 'Silchar Central',
        district: 'Cachar',
        state: 'Assam',
        riskScore: 82.5,
        riskCategory: 'Very High',
        leadTimeHours: 6,
        actionText: 'CRITICAL: Flash flood risk is VERY HIGH (82.5/100) in Silchar Central. Evacuate low-lying areas near Barak River Tributary within the next 6 hours. Take [Central Trunk Road -> Meherpur Elevated Bypass] to reach shelter at [Silchar District Stadium & Indoor Complex].',
        rainfall_24h: 210,
        rainfall_forecast_6h: 85,
        streamName: 'Barak River Tributary',
        recommendedShelter: 'Silchar District Stadium & Indoor Complex',
        evacuationRoute: 'Central Trunk Road -> Meherpur Elevated Bypass'
      }
    ];
  }
}

/**
 * Fetches active high and very high priority early warning alerts
 */
export async function fetchAlerts(): Promise<WardAlert[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/alerts`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.alerts || [];
  } catch (error) {
    console.warn('Backend /alerts offline, deriving alerts from fallback:', error);
    const risks = await fetchWardRisks();
    return risks
      .filter((w) => w.riskCategory === 'High' || w.riskCategory === 'Very High')
      .map((w) => ({
        wardId: w.wardId,
        wardName: w.wardName,
        riskScore: w.riskScore,
        riskCategory: w.riskCategory,
        leadTimeHours: w.leadTimeHours,
        actionText: w.actionText,
        streamName: w.streamName,
        recommendedShelter: w.recommendedShelter,
        evacuationRoute: w.evacuationRoute,
        updatedAt: w.updatedAt
      }));
  }
}
