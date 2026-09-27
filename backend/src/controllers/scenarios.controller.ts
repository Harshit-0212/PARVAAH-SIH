import type { Request, Response, NextFunction } from 'express';
import { scenarioWeatherProvider } from '../providers/weather/scenario-weather.provider.js';
import { AppError } from '../middleware/error-handler.js';

export class ScenariosController {
  async getScenarios(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scenarios = scenarioWeatherProvider.getAllScenarios();
      const active = scenarioWeatherProvider.getActiveScenario();

      res.status(200).json({
        success: true,
        count: scenarios.length,
        activeScenario: active,
        data: scenarios,
        disclaimer: 'SIMULATED SCENARIOS — College demonstration and drill training only.'
      });
    } catch (err) {
      next(err);
    }
  }

  async createScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        description,
        district,
        state,
        rainfall24hMm,
        forecastRainfall24hMm,
        forecastRainfall72hMm,
        soilMoisturePercent,
        slopeDegrees,
        historicalSusceptibility,
        verifiedReportCount,
        verifiedReportSeverity,
        roadStatus,
        shelterOccupancyPercent,
        durationMinutes,
        operator
      } = req.body;

      if (!name || !district || rainfall24hMm === undefined || forecastRainfall24hMm === undefined || soilMoisturePercent === undefined || slopeDegrees === undefined) {
        throw new AppError('Missing required scenario parameters: name, district, rainfall24hMm, forecastRainfall24hMm, soilMoisturePercent, slopeDegrees', 400);
      }

      const created = await scenarioWeatherProvider.createCustomScenario({
        name,
        description,
        district,
        state,
        rainfall24hMm: Number(rainfall24hMm),
        forecastRainfall24hMm: Number(forecastRainfall24hMm),
        forecastRainfall72hMm: forecastRainfall72hMm ? Number(forecastRainfall72hMm) : undefined,
        soilMoisturePercent: Number(soilMoisturePercent),
        slopeDegrees: Number(slopeDegrees),
        historicalSusceptibility: historicalSusceptibility ? Number(historicalSusceptibility) : undefined,
        verifiedReportCount: verifiedReportCount ? Number(verifiedReportCount) : 0,
        verifiedReportSeverity,
        roadStatus,
        shelterOccupancyPercent: shelterOccupancyPercent ? Number(shelterOccupancyPercent) : undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
        operator: operator || 'Admin'
      });

      res.status(201).json({
        success: true,
        message: 'Custom simulation scenario created.',
        data: created
      });
    } catch (err) {
      next(err);
    }
  }

  async activateScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { durationMinutes, operator } = req.body;

      const activated = await scenarioWeatherProvider.activateScenario(
        id,
        durationMinutes ? Number(durationMinutes) : undefined,
        operator || 'College Demo Controller'
      );

      res.status(200).json({
        success: true,
        message: `Scenario '${activated.name}' activated for district '${activated.district}'. Automatic expiry set for ${activated.expiresAt}.`,
        badge: 'SIMULATED SCENARIO — College demonstration only',
        data: activated
      });
    } catch (err) {
      next(err);
    }
  }

  async deactivateScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await scenarioWeatherProvider.deactivateScenario(id);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async clearState(_req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.clearActiveScenario(_req, res, next);
  }

  async getActiveScenario(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const active = scenarioWeatherProvider.getActiveScenario();
      res.status(200).json({
        success: true,
        activeScenario: active || null,
        hasActiveScenario: !!active
      });
    } catch (err) {
      next(err);
    }
  }

  async clearActiveScenario(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const active = scenarioWeatherProvider.getActiveScenario();

      if (!active) {
        res.status(200).json({
          success: true,
          cleared: false,
          message: 'No active demo scenario to clear. System is already in baseline state.',
          action: 'CLEAR_DEMO_STATE',
          preservationStatus: {
            storedReportsPreserved: true,
            verifiedRecordsPreserved: true,
            officialRecordsPreserved: true
          }
        });
        return;
      }

      // Deactivate any active scenario
      await scenarioWeatherProvider.deactivateScenario();

      // Restore baseline risk zone values
      const { DEMO_RISK_ZONES } = await import('../data/demo/risk-zones.js');
      for (const f of DEMO_RISK_ZONES.features) {
        if (f.id === 'ZONE-SKM-01') {
          f.properties.riskScore = 92;
          f.properties.riskLevel = 'CRITICAL';
          f.properties.modelMode = 'DEMO_RULE_BASED';
        } else if (f.id === 'ZONE-MEG-02') {
          f.properties.riskScore = 84;
          f.properties.riskLevel = 'HIGH';
          f.properties.modelMode = 'DEMO_RULE_BASED';
        } else if (f.id === 'ZONE-ASM-03') {
          f.properties.riskScore = 88;
          f.properties.riskLevel = 'CRITICAL';
          f.properties.modelMode = 'DEMO_RULE_BASED';
        }
        f.properties.calculatedAt = new Date().toISOString();
        f.properties.disclaimer =
          'This risk score is a prototype decision-support advisory. It is not an official warning or evacuation order.';
      }

      res.status(200).json({
        success: true,
        cleared: true,
        clearedScenario: { id: active.id, name: active.name },
        message: `Active demo scenario '${active.name}' cleared. Baseline values restored. Stored citizen reports and verified records preserved.`,
        action: 'CLEAR_DEMO_STATE',
        recalculatedZonesCount: DEMO_RISK_ZONES.features.length,
        preservationStatus: {
          storedReportsPreserved: true,
          verifiedRecordsPreserved: true,
          officialRecordsPreserved: true
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const scenariosController = new ScenariosController();
