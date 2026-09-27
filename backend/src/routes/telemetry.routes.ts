import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { checkDatabaseHealth } from '../config/db.js';
import { mlService } from '../services/ml.service.js';
import { scenarioWeatherProvider } from '../providers/weather/scenario-weather.provider.js';
import { imdDemoProvider } from '../providers/weather/imd-demo.provider.js';
import { weatherService } from '../services/weather.service.js';
import { reportStorage } from '../providers/storage/report-storage.provider.js';
import { PredictionHistoryModel } from '../models/PredictionHistory.model.js';
import { CitizenReportModel } from '../models/CitizenReport.model.js';
import { ScenarioModel } from '../models/Scenario.model.js';

export const telemetryRouter = Router();

// In-memory operational metrics
let lastRecalculationTimestamp: string | null = null;
let lastWeatherSyncTimestamp: string | null = null;

export function recordRecalculationEvent(): void {
  lastRecalculationTimestamp = new Date().toISOString();
}

export function recordWeatherSyncEvent(): void {
  lastWeatherSyncTimestamp = new Date().toISOString();
}

function isAuthorizedDiagnostic(req: Request): boolean {
  return env.NODE_ENV === 'development' || (req.headers['x-user-role'] || '').toString().toLowerCase() === 'admin';
}

function safeDiagnosticError(error: unknown): string {
  return error instanceof Error ? error.message.replace(/mongodb:\/\/[^\s]+/gi, 'MongoDB connection') : 'Diagnostic check failed.';
}

telemetryRouter.post('/telemetry/test/mongodb', async (req: Request, res: Response): Promise<void> => {
  if (!isAuthorizedDiagnostic(req)) { res.status(403).json({ success: false, error: 'Development/admin diagnostic only.' }); return; }
  const attemptedAt = new Date().toISOString();
  try {
    const result = await checkDatabaseHealth();
    res.status(200).json({ success: result.status === 'CONNECTED', attemptedAt, result: { status: result.status, latencyMs: result.latencyMs, validation: result.status === 'CONNECTED' ? 'PING_OK' : 'PING_FAILED', error: result.lastError } });
  } catch (error) {
    res.status(200).json({ success: false, attemptedAt, result: { status: 'ERROR', latencyMs: null, validation: 'NOT_VALIDATED', error: safeDiagnosticError(error) } });
  }
});

telemetryRouter.post('/telemetry/test/open-meteo', async (req: Request, res: Response): Promise<void> => {
  if (!isAuthorizedDiagnostic(req)) { res.status(403).json({ success: false, error: 'Development/admin diagnostic only.' }); return; }
  const attemptedAt = new Date().toISOString();
  const startedAt = Date.now();
  try {
    const lat = req.body?.lat !== undefined ? Number(req.body.lat) : 27.3389;
    const lng = req.body?.lng !== undefined ? Number(req.body.lng) : 88.6065;
    const data = await weatherService.getOpenMeteoProvider().syncNow(lat, lng);
    res.status(200).json({ success: data.isLive === true && data.provider === 'OPEN_METEO', attemptedAt, result: { status: data.isLive ? 'CONNECTED' : 'DEGRADED', latencyMs: Date.now() - startedAt, validation: data.isLive ? 'REQUIRED_FIELDS_OK' : 'PROVIDER_FALLBACK', error: data.isLive ? null : 'Open-Meteo did not return live data.' } });
  } catch (error) {
    res.status(200).json({ success: false, attemptedAt, result: { status: 'ERROR', latencyMs: Date.now() - startedAt, validation: 'NOT_VALIDATED', error: safeDiagnosticError(error) } });
  }
});

telemetryRouter.post('/telemetry/test/ml', async (req: Request, res: Response): Promise<void> => {
  if (!isAuthorizedDiagnostic(req)) { res.status(403).json({ success: false, error: 'Development/admin diagnostic only.' }); return; }
  const attemptedAt = new Date().toISOString();
  try {
    const health = await mlService.checkHealth();
    const probe = mlService.getHealthTelemetry();
    res.status(200).json({ success: Boolean(health?.ok && health.modelLoaded), attemptedAt, result: { status: health?.ok && health.modelLoaded ? 'CONNECTED' : 'UNAVAILABLE', latencyMs: probe.latencyMs, validation: health?.modelLoaded ? 'HEALTH_OK_MODEL_LOADED' : 'MODEL_NOT_READY', modelLoaded: Boolean(health?.modelLoaded), modelVersion: health?.modelVersion || 'UNKNOWN', modelMode: health?.modelMode || 'UNAVAILABLE', error: probe.lastError } });
  } catch (error) {
    res.status(200).json({ success: false, attemptedAt, result: { status: 'ERROR', latencyMs: null, validation: 'NOT_VALIDATED', error: safeDiagnosticError(error) } });
  }
});

telemetryRouter.get('/telemetry', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requestId = (req as any).id || 'unknown';
    const now = new Date().toISOString();

    // 1. Database status & record counts
    const databaseHealthCheck = await checkDatabaseHealth();
    const dbConnected = databaseHealthCheck.status === 'CONNECTED';
    let reportCount = 0;
    let predictionCount = 0;
    let scenarioCount = 0;
    let lastPredictionRecord: any = null;
    let lastReportRecord: any = null;

    if (dbConnected) {
      try {
        [reportCount, predictionCount, scenarioCount, lastPredictionRecord, lastReportRecord] = await Promise.all([
          CitizenReportModel.countDocuments(),
          PredictionHistoryModel.countDocuments(),
          ScenarioModel.countDocuments(),
          PredictionHistoryModel.findOne().sort({ calculatedAt: -1 }).lean(),
          CitizenReportModel.findOne().sort({ receivedAt: -1 }).lean()
        ]);
      } catch {
        // Fallback to in-memory counts
        const inMemReports = await reportStorage.getAllReports();
        reportCount = inMemReports.length;
      }
    } else {
      const inMemReports = await reportStorage.getAllReports();
      reportCount = inMemReports.length;
    }

    // 2. FastAPI ML service health probe
    const mlHealth = await mlService.checkHealth();

    // 3. Weather providers status
    const imdHealth = await imdDemoProvider.getHealth();
    const openMeteoHealth = await weatherService.getOpenMeteoProvider().getHealth();

    // 4. Current active scenario
    const activeScenario = scenarioWeatherProvider.getActiveScenario();

    // 5. Assembled operational telemetry payload (never exposes secrets or URIs)
    const telemetryData = {
      service: 'PARVAAH Operational Telemetry Console',
      timestamp: now,
      environment: env.NODE_ENV,
      activeDataMode: env.DATA_MODE,
      apiHealth: {
        status: 'UP',
        uptimeSeconds: Math.round(process.uptime()),
        serverPort: env.PORT
      },
      database: {
        status: databaseHealthCheck.status,
        isLocalFallbackActive: !dbConnected,
        checkedAt: databaseHealthCheck.checkedAt,
        latencyMs: databaseHealthCheck.latencyMs,
        lastError: databaseHealthCheck.lastError,
        sourceType: 'DATABASE_CHECK',
        metrics: {
          totalCitizenReports: reportCount,
          totalPredictionsLogged: predictionCount,
          totalScenarios: scenarioCount
        }
      },
      fastApiMl: {
        serviceUrl: 'http://127.0.0.1:8001',
        isAvailable: Boolean(mlHealth && mlHealth.ok),
        modelLoaded: Boolean(mlHealth && mlHealth.modelLoaded),
        modelVersion: mlHealth ? mlHealth.modelVersion : 'practice-xgboost-v1',
        modelMode: mlHealth ? mlHealth.modelMode : 'PRACTICE_XGBOOST',
        disclaimer: mlHealth
          ? mlHealth.disclaimer
          : 'Practice-only synthetic model. Not a real landslide warning or evacuation decision.',
        lastPredictionLatencyMs: lastPredictionRecord ? lastPredictionRecord.latencyMs : null,
        lastPredictionCalculatedAt: lastPredictionRecord ? lastPredictionRecord.calculatedAt : null,
        lastPredictionRiskLevel: lastPredictionRecord ? lastPredictionRecord.output?.riskLevel : null
        ,lastHealthCheckAt: mlService.getHealthTelemetry().checkedAt
        ,healthLatencyMs: mlService.getHealthTelemetry().latencyMs
        ,lastHealthError: mlService.getHealthTelemetry().lastError
      },
      weatherProviders: {
        imd: {
          name: imdHealth.name,
          status: imdHealth.status,
          isConfigured: imdHealth.configured,
          isLive: imdHealth.isLive,
          message: imdHealth.message
        },
        openMeteo: {
          name: openMeteoHealth.name,
          status: openMeteoHealth.status,
          isConfigured: openMeteoHealth.configured,
          isLive: openMeteoHealth.isLive,
          dataAgeMinutes: openMeteoHealth.dataAgeMinutes,
          lastSync: openMeteoHealth.lastSuccessfulFetch,
          lastAttemptAt: openMeteoHealth.lastAttemptAt,
          lastError: openMeteoHealth.lastError,
          latencyMs: openMeteoHealth.latencyMs,
          sourceType: openMeteoHealth.sourceType
        }
      },
      activeScenario: activeScenario
        ? {
            id: activeScenario.id,
            name: activeScenario.name,
            district: activeScenario.district,
            rainfall24hMm: activeScenario.rainfall24hMm,
            slopeDegrees: activeScenario.slopeDegrees,
            soilMoisturePercent: activeScenario.soilMoisturePercent,
            expiresAt: activeScenario.expiresAt,
            disclaimer: 'SIMULATED SCENARIO — College demonstration only'
          }
        : null,
      operationalTimestamps: {
        lastWeatherSync: lastWeatherSyncTimestamp || openMeteoHealth.lastSuccessfulFetch,
        lastPrediction: lastPredictionRecord ? lastPredictionRecord.calculatedAt : null,
        lastCitizenReport: lastReportRecord ? lastReportRecord.receivedAt : null,
        lastRiskRecalculation: lastRecalculationTimestamp
      },
      recentSafeErrors: [],
      requestId
    };

    res.status(200).json({
      success: true,
      data: telemetryData
    });
  } catch (err) {
    next(err);
  }
});
