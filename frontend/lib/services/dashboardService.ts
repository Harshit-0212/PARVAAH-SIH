import dbConnect from '../dbConnect';
import { District } from '../models/District';
import { Alert } from '../models/Alert';
import { Incident } from '../models/Incident';
import { Road } from '../models/Road';
import { WeatherSnapshot } from '../models/WeatherSnapshot';
import { RiskAssessment } from '../models/RiskAssessment';
import { DashboardSummaryResponse, IAlert, IIncident, IRoad, IWeatherSnapshot, IRiskAssessment, IDistrict } from '../../types/db';
import { Types } from 'mongoose';

/**
 * Aggregates comprehensive real-time dashboard data for a district.
 * Efficiently runs query promises in parallel with Promise.all.
 */
export async function getDashboardSummary(districtIdOrCode: string): Promise<DashboardSummaryResponse> {
  await dbConnect();

  let districtDoc;
  if (Types.ObjectId.isValid(districtIdOrCode)) {
    districtDoc = await District.findById(districtIdOrCode).lean();
  } else {
    districtDoc = await District.findOne({ code: districtIdOrCode.toUpperCase() }).lean();
  }

  if (!districtDoc) {
    return {
      district: null,
      activeAlertsCount: 0,
      activeAlerts: [],
      recentIncidentsCount: 0,
      recentIncidents: [],
      highRiskRoadsCount: 0,
      roads: [],
      latestWeather: null,
      latestRiskAssessment: null,
    };
  }

  const districtId = districtDoc._id as Types.ObjectId;
  const now = new Date();

  // Execute queries in parallel using Promise.all for high-performance response
  const [activeAlerts, recentIncidents, roads, latestWeather, latestRiskAssessment] = await Promise.all([
    Alert.find({
      districtId,
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }],
    })
      .sort({ severity: -1, createdAt: -1 })
      .lean(),

    Incident.find({ districtId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('villageId', 'name')
      .populate('roadId', 'roadName status')
      .lean(),

    Road.find({ districtId }).sort({ riskLevel: -1 }).lean(),

    WeatherSnapshot.findOne({ districtId }).sort({ observedAt: -1 }).lean(),

    RiskAssessment.findOne({ districtId }).sort({ assessedAt: -1 }).lean(),
  ]);

  const highRiskRoadsCount = roads.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'severe').length;

  return {
    district: districtDoc as unknown as IDistrict,
    activeAlertsCount: activeAlerts.length,
    activeAlerts: activeAlerts as unknown as IAlert[],
    recentIncidentsCount: recentIncidents.length,
    recentIncidents: recentIncidents as unknown as IIncident[],
    highRiskRoadsCount,
    roads: roads as unknown as IRoad[],
    latestWeather: (latestWeather as unknown as IWeatherSnapshot) || null,
    latestRiskAssessment: (latestRiskAssessment as unknown as IRiskAssessment) || null,
  };
}
