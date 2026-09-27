import type { Request, Response, NextFunction } from 'express';
import { DEMO_RISK_ZONES } from '../data/demo/risk-zones.js';
import { riskService } from '../services/risk.service.js';
import { scenarioWeatherProvider } from '../providers/weather/scenario-weather.provider.js';
import { riskCalculationInputSchema } from '../schemas/risk.schema.js';
import { AppError } from '../middleware/error-handler.js';
import { recordRecalculationEvent } from '../routes/telemetry.routes.js';

export class RiskController {
  async getRiskZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const district = req.query.district as string | undefined;
      let features = [...DEMO_RISK_ZONES.features];
      const activeScenario = scenarioWeatherProvider.getActiveScenario();

      if (district && district !== 'all') {
        features = features.filter(f => 
          f.properties.zoneId.toLowerCase().includes(district.toLowerCase()) ||
          f.properties.zoneName.toLowerCase().includes(district.toLowerCase())
        );
      }

      if (activeScenario) {
        features = features.map(f => {
          const isTargetZone = !activeScenario.district || 
            activeScenario.district === 'all' || 
            f.properties.zoneId.toLowerCase().includes(activeScenario.district.toLowerCase()) ||
            f.properties.zoneName.toLowerCase().includes(activeScenario.district.toLowerCase()) ||
            (activeScenario.district === 'east_sikkim' && f.properties.zoneId.includes('SKM')) ||
            (activeScenario.district === 'east_khasi' && f.properties.zoneId.includes('MEG')) ||
            (activeScenario.district === 'dima_hasao' && f.properties.zoneId.includes('ASM'));

          if (isTargetZone) {
            const calculated = riskService.calculateRisk({
              rainfall24hMm: activeScenario.rainfall24hMm,
              forecastRainfall24hMm: activeScenario.forecastRainfall24hMm,
              soilMoisturePercent: activeScenario.soilMoisturePercent,
              slopeDegrees: activeScenario.slopeDegrees,
              historicalSusceptibility: activeScenario.historicalSusceptibility || 50,
              verifiedFieldReportSeverity: activeScenario.verifiedReportSeverity || 'NONE'
            });

            return {
              ...f,
              properties: {
                ...f.properties,
                riskScore: calculated.riskScore,
                riskLevel: calculated.riskLevel,
                confidence: calculated.confidence,
                modelMode: 'SIMULATED_SCENARIO' as any,
                calculatedAt: new Date().toISOString(),
                contributingFactors: {
                  rainfall24hContribution: calculated.contributingFactors.rainfall24h.contribution,
                  forecastRainfallContribution: calculated.contributingFactors.forecastRainfall.contribution,
                  soilMoistureContribution: calculated.contributingFactors.soilMoisture.contribution,
                  slopeContribution: calculated.contributingFactors.slope.contribution,
                  historicalSusceptibilityContribution: calculated.contributingFactors.historicalSusceptibility.contribution,
                  verifiedFieldReportsContribution: calculated.contributingFactors.verifiedFieldReports.contribution
                },
                recommendedAction: calculated.evacuationRecommendation === 'MANDATORY'
                  ? 'Proactive evacuation advisory for vulnerable hillside settlements; divert non-emergency transit.'
                  : 'Monitor slope telemetry and stay alert for localized debris flow warnings.',
                disclaimer: 'SIMULATED SCENARIO — College demonstration only. Not an official disaster advisory.',
                isDemo: true,
                isLive: false
              }
            };
          }
          return f;
        });
      }

      res.status(200).json({
        type: 'FeatureCollection',
        metadata: {
          ...DEMO_RISK_ZONES.metadata,
          count: features.length,
          generatedAt: new Date().toISOString(),
          activeScenario: activeScenario ? {
            id: activeScenario.id,
            name: activeScenario.name,
            district: activeScenario.district,
            expiresAt: activeScenario.expiresAt
          } : null,
          dataSource: activeScenario ? 'SIMULATED_SCENARIO' : 'DEMO_RULE_BASED'
        },
        features
      });
    } catch (err) {
      next(err);
    }
  }

  async getRiskZoneById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const zone = DEMO_RISK_ZONES.features.find(f => f.id.toLowerCase() === id.toLowerCase() || f.properties.zoneId.toLowerCase() === id.toLowerCase());

      if (!zone) {
        throw new AppError(`Risk zone with ID '${id}' not found.`, 404);
      }

      res.status(200).json({
        success: true,
        data: zone.properties
      });
    } catch (err) {
      next(err);
    }
  }

  async calculateRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = riskCalculationInputSchema.parse(req.body);
      const result = await riskService.calculateMlRisk(
        input,
        req.body.triggeredBy || 'MANUAL_CALCULATOR'
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async recalculateZoneRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const triggerSource =
        (req.body && req.body.triggerSource) || 'ADMIN_TRIGGER';
      const feature = await riskService.recalculateRiskForZone(id, triggerSource);
      recordRecalculationEvent();

      res.status(200).json({
        success: true,
        message: `Risk zone '${id}' successfully recalculated with XGBoost/safe fallback.`,
        data: feature
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/risk/predict
   * 7-feature demo_xgboost_v1 endpoint.
   * Accepts: rainfall_24h_mm, rainfall_48h_mm, rainfall_7d_mm,
   *          soil_moisture_percent, slope_degrees, elevation_m,
   *          historical_landslide_density (0–1)
   */
  async calculateXGBoostRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as {
        rainfall_24h_mm?: unknown;
        rainfall_48h_mm?: unknown;
        rainfall_7d_mm?: unknown;
        soil_moisture_percent?: unknown;
        slope_degrees?: unknown;
        elevation_m?: unknown;
        historical_landslide_density?: unknown;
        zoneId?: string;
        triggeredBy?: string;
      };

      // Validate required numeric fields
      const fields = [
        'rainfall_24h_mm', 'rainfall_48h_mm', 'rainfall_7d_mm',
        'soil_moisture_percent', 'slope_degrees', 'elevation_m',
        'historical_landslide_density'
      ] as const;

      for (const field of fields) {
        const val = Number(body[field]);
        if (body[field] === undefined || body[field] === null || isNaN(val)) {
          throw new AppError(`Missing or invalid field: ${field}`, 400);
        }
      }

      const input = {
        rainfall_24h_mm: Number(body.rainfall_24h_mm),
        rainfall_48h_mm: Number(body.rainfall_48h_mm),
        rainfall_7d_mm: Number(body.rainfall_7d_mm),
        soil_moisture_percent: Number(body.soil_moisture_percent),
        slope_degrees: Number(body.slope_degrees),
        elevation_m: Number(body.elevation_m),
        historical_landslide_density: Math.max(0, Number(body.historical_landslide_density))
      };

      const result = await riskService.calculateDemoXGBoostRisk(
        input,
        body.zoneId,
        body.triggeredBy || 'RISK_SIMULATOR'
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getRedZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const jsonPath = path.resolve(process.cwd(), '..', 'ml-service', 'data', 'sample', 'red_zones_demo.json');
      const fallbackPath = path.resolve(process.cwd(), 'public', 'data', 'red_zones_demo.json');

      let data: any = [];
      if (fs.existsSync(jsonPath)) {
        data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      } else if (fs.existsSync(fallbackPath)) {
        data = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
      }
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getSaferSites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const jsonPath = path.resolve(process.cwd(), '..', 'ml-service', 'data', 'sample', 'safer_sites_demo.json');
      const fallbackPath = path.resolve(process.cwd(), 'public', 'data', 'safer_sites_demo.json');

      let data: any = [];
      if (fs.existsSync(jsonPath)) {
        data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      } else if (fs.existsSync(fallbackPath)) {
        data = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
      }
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}

export const riskController = new RiskController();

