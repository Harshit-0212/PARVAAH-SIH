import { Request, Response, NextFunction } from 'express';
import { WardRisk } from '../types/risk.js';
import { calculateFloodRisk } from '../utils/riskModel.js';
import { generateActionText, estimateLeadTime } from '../utils/alertGenerator.js';
import { getFloodFrequencyByWard } from '../utils/indofloodsLoader.js';
import { WardRiskModel } from '../models/WardRisk.js';
import { isDatabaseConnected } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Seeded base ward attributes for SIH demo / live fallback
const BASE_WARDS: Array<Omit<WardRisk, 'riskScore' | 'riskCategory' | 'leadTimeHours' | 'actionText'> & {
  rainfall_24h: number;
  rainfall_forecast_6h: number;
  rainfall_forecast_24h: number;
  slope: number;
  elevation: number;
  dist_to_stream: number;
}> = [
  {
    wardId: 'W-01',
    wardName: 'Silpukhuri Ward',
    district: 'Kamrup',
    state: 'Assam',
    rainfall_24h: 185.0,
    rainfall_forecast_6h: 72.0,
    rainfall_forecast_24h: 120.0,
    slope: 2.3,
    elevation: 48,
    dist_to_stream: 0.8,
    streamName: 'Bharalu Stream',
    recommendedShelter: 'Guwahati High Secondary Shelter Camp',
    evacuationRoute: 'Silpukhuri Main Link Rd -> G.S. Road Flyover'
  },
  {
    wardId: 'W-02',
    wardName: 'Dispur Valley',
    district: 'Kamrup',
    state: 'Assam',
    rainfall_24h: 125.0,
    rainfall_forecast_6h: 55.0,
    rainfall_forecast_24h: 95.0,
    slope: 3.8,
    elevation: 55,
    dist_to_stream: 1.2,
    streamName: 'Basistha River',
    recommendedShelter: 'Dispur College Flood Relief Center',
    evacuationRoute: 'Capital Complex Arterial -> National Highway 27'
  },
  {
    wardId: 'W-03',
    wardName: 'Kamakhya Foothills',
    district: 'Kamrup',
    state: 'Assam',
    rainfall_24h: 45.0,
    rainfall_forecast_6h: 18.0,
    rainfall_forecast_24h: 35.0,
    slope: 16.5,
    elevation: 165,
    dist_to_stream: 4.5,
    streamName: 'Brahmaputra Tributary',
    recommendedShelter: 'Kamakhya Community Hall',
    evacuationRoute: 'Temple Ridge Road'
  },
  {
    wardId: 'W-04',
    wardName: 'Silchar Central',
    district: 'Cachar',
    state: 'Assam',
    rainfall_24h: 210.0,
    rainfall_forecast_6h: 85.0,
    rainfall_forecast_24h: 145.0,
    slope: 1.5,
    elevation: 22,
    dist_to_stream: 0.4,
    streamName: 'Barak River Tributary',
    recommendedShelter: 'Silchar District Stadium & Indoor Complex',
    evacuationRoute: 'Central Trunk Road -> Meherpur Elevated Bypass'
  }
];

/**
 * Computes live or cached WardRisk objects integrating INDOFLOODS & terrain
 */
export async function computeAllWardRisks(): Promise<WardRisk[]> {
  const freqMap = getFloodFrequencyByWard();

  const computed: WardRisk[] = BASE_WARDS.map((base) => {
    const historicalFloodCount = freqMap.get(base.wardId) || freqMap.get(base.district || '') || 0;

    const riskOut = calculateFloodRisk({
      rainfall_24h: base.rainfall_24h,
      rainfall_forecast_6h: base.rainfall_forecast_6h,
      slope: base.slope,
      dist_to_stream: base.dist_to_stream,
      historical_flood_count: historicalFloodCount,
    });

    const leadTime = estimateLeadTime(base.rainfall_forecast_6h, base.rainfall_forecast_24h);

    const actionText = generateActionText({
      wardName: base.wardName,
      riskScore: riskOut.riskScore,
      riskCategory: riskOut.riskCategory,
      leadTimeHours: leadTime,
      streamName: base.streamName,
      recommendedShelter: base.recommendedShelter,
      evacuationRoute: base.evacuationRoute
    });

    return {
      ...base,
      historical_flood_count: historicalFloodCount,
      riskScore: riskOut.riskScore,
      riskCategory: riskOut.riskCategory,
      leadTimeHours: leadTime,
      actionText,
      updatedAt: new Date().toISOString()
    };
  });

  // Sync to MongoDB if connected
  if (isDatabaseConnected()) {
    try {
      for (const item of computed) {
        await WardRiskModel.findOneAndUpdate(
          { wardId: item.wardId },
          { $set: item },
          { upsert: true, new: true }
        );
      }
    } catch (err: any) {
      logger.warn(`Could not sync WardRisks to MongoDB: ${err.message}`);
    }
  }

  return computed;
}

/**
 * Controller functions
 */
export const riskController = {
  /**
   * GET /api/wards/risk or /api/v1/wards/risk
   */
  async getWardRisks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (isDatabaseConnected()) {
        const fromDb = await WardRiskModel.find().lean();
        if (fromDb && fromDb.length > 0) {
          res.json({ success: true, count: fromDb.length, data: fromDb });
          return;
        }
      }
      const data = await computeAllWardRisks();
      res.json({ success: true, count: data.length, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/alerts or /api/v1/alerts
   */
  async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wards = await computeAllWardRisks();
      // Filter high-risk and very high-risk wards (>= 50)
      const alerts = wards
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

      res.json({
        success: true,
        count: alerts.length,
        timestamp: new Date().toISOString(),
        alerts
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/ward/:id or /api/v1/ward/:id
   */
  async getWardById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const targetId = id.toUpperCase();

      if (isDatabaseConnected()) {
        const doc = await WardRiskModel.findOne({ wardId: targetId }).lean();
        if (doc) {
          res.json({ success: true, data: doc });
          return;
        }
      }

      const all = await computeAllWardRisks();
      const match = all.find((w) => w.wardId.toUpperCase() === targetId);

      if (!match) {
        res.status(404).json({ success: false, message: `Ward with ID '${id}' not found` });
        return;
      }

      res.json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  }
};
