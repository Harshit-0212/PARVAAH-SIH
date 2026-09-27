import type { IntegrationHealth } from '../types/index.js';
import { weatherService } from './weather.service.js';
import { ImdDemoProvider } from '../providers/weather/imd-demo.provider.js';
import { ImdLiveProvider } from '../providers/weather/imd-live.provider.js';
import { env } from '../config/env.js';
import { checkDatabaseHealth } from '../config/db.js';
import { SensorDemoProvider } from '../providers/sensors/sensor-demo.provider.js';
import { mlService } from './ml.service.js';
import { logger } from '../utils/logger.js';

export class IntegrationHealthService {
  async getAllIntegrationHealth(): Promise<{
    status: string;
    serverTime: string;
    uptimeSeconds: number;
    environment: string;
    dataMode: string;
    providers: IntegrationHealth[];
  }> {
    const checkedAt = new Date().toISOString();
    const safeServiceHealth = async (operation: () => Promise<IntegrationHealth>, fallback: IntegrationHealth): Promise<IntegrationHealth> => {
      try {
        return await operation();
      } catch (error: any) {
        logger.warn(`Integration health probe failed: ${error?.message || 'unknown provider error'}`);
        return {
          ...fallback,
          status: 'ERROR',
          isLive: false,
          lastAttemptAt: checkedAt,
          lastError: error?.message || 'Provider probe failed',
          message: `Provider check failed safely: ${error?.message || 'unknown provider error'}`
        };
      }
    };

    const imdProvider = env.IMD_ENABLED ? new ImdLiveProvider() : new ImdDemoProvider();
    const imdHealth = await safeServiceHealth(
      () => imdProvider.getHealth(),
      {
        name: 'India Meteorological Department (IMD) Gateway',
        configured: false,
        status: 'ERROR',
        isLive: false,
        lastSuccessfulFetch: null,
        lastAttemptAt: checkedAt,
        lastError: 'IMD provider probe failed',
        dataAgeMinutes: null,
        sourceType: 'DEMO',
        message: 'IMD provider check failed safely. Demo weather data is active.'
      }
    );
    const openMeteoHealth = await safeServiceHealth(
      () => weatherService.getOpenMeteoProvider().getHealth(),
      {
        name: 'Open-Meteo High-Resolution Weather API',
        configured: false,
        status: 'ERROR',
        isLive: false,
        lastSuccessfulFetch: null,
        lastAttemptAt: checkedAt,
        lastError: 'Open-Meteo provider probe failed',
        dataAgeMinutes: null,
        sourceType: 'LIVE_CHECK',
        message: 'Open-Meteo provider check failed safely.'
      }
    );
    const scenarioHealth = await safeServiceHealth(
      () => weatherService.getScenarioProvider().getHealth(),
      {
        name: 'Simulated Scenario Weather Provider',
        configured: false,
        status: 'ERROR',
        isLive: false,
        lastSuccessfulFetch: null,
        lastAttemptAt: checkedAt,
        lastError: 'Scenario provider probe failed',
        dataAgeMinutes: null,
        sourceType: 'LIVE_CHECK',
        message: 'Scenario provider check failed safely.'
      }
    );
    const sensorHealth = await safeServiceHealth(
      () => new SensorDemoProvider().getHealth(),
      {
        name: 'Sensor Network Proxy',
        configured: false,
        status: 'ERROR',
        isLive: false,
        lastSuccessfulFetch: null,
        lastAttemptAt: checkedAt,
        lastError: 'Sensor provider probe failed',
        dataAgeMinutes: null,
        sourceType: 'DEMO',
        message: 'Sensor provider check failed safely.'
      }
    );
    const databaseCheck = await checkDatabaseHealth();
    const mlHealth = await mlService.checkHealth();
    const mlProbe = mlService.getHealthTelemetry();

    const satelliteHealth: IntegrationHealth = {
      name: 'ISRO Bhuvan / Cartosat Geoportal',
      configured: false,
      status: 'NOT_CONFIGURED',
      isLive: false,
      lastSuccessfulFetch: null,
      lastAttemptAt: null,
      lastError: null,
      dataAgeMinutes: null,
      sourceType: 'NOT_CONFIGURED',
      message: 'ISRO/Bhuvan access is not configured. No agency access or clearance is being claimed.'
    };

    const databaseHealth: IntegrationHealth = {
      name: 'Persistence Layer (MongoDB / In-Memory Demo Store)',
      configured: databaseCheck.configured,
      status: databaseCheck.status === 'ERROR' ? 'ERROR' : databaseCheck.status,
      isLive: databaseCheck.status === 'CONNECTED',
      lastSuccessfulFetch: databaseCheck.status === 'CONNECTED' ? databaseCheck.checkedAt : null,
      lastAttemptAt: databaseCheck.checkedAt,
      lastError: databaseCheck.lastError,
      dataAgeMinutes: null,
      checkedAt: databaseCheck.checkedAt,
      latencyMs: databaseCheck.latencyMs,
      sourceType: 'DATABASE_CHECK',
      message: databaseCheck.status === 'CONNECTED'
        ? 'MongoDB ping/readiness check succeeded.'
        : databaseCheck.status === 'NOT_CONFIGURED'
        ? 'MongoDB URI is not configured; using the in-memory/demo store.'
        : 'MongoDB is configured but the ping/readiness check did not succeed.'
    };

    const notificationHealth: IntegrationHealth = {
      name: 'CDAC National Disaster SMS / Alert Gateway',
      configured: false,
      status: 'NOT_CONFIGURED',
      isLive: false,
      lastSuccessfulFetch: null,
      lastAttemptAt: null,
      lastError: null,
      dataAgeMinutes: null,
      sourceType: 'NOT_CONFIGURED',
      message: 'Live alert dispatch disabled in development. Test alerts only; no public messages sent.'
    };

    const mlIntegrationHealth: IntegrationHealth = {
      name: 'FastAPI XGBoost Practice Model',
      configured: true,
      status: mlHealth?.ok && mlHealth.modelLoaded ? 'CONNECTED' : 'ERROR',
      isLive: Boolean(mlHealth?.ok && mlHealth.modelLoaded),
      lastSuccessfulFetch: mlHealth?.ok ? mlProbe.checkedAt : null,
      lastAttemptAt: mlProbe.checkedAt,
      lastError: mlProbe.lastError,
      dataAgeMinutes: null,
      checkedAt: mlProbe.checkedAt || checkedAt,
      latencyMs: mlProbe.latencyMs,
      sourceType: 'LIVE_CHECK',
      details: { modelLoaded: Boolean(mlHealth?.modelLoaded), modelVersion: mlHealth?.modelVersion || 'UNKNOWN', modelMode: mlHealth?.modelMode || 'UNAVAILABLE' },
      message: mlHealth?.ok && mlHealth.modelLoaded
        ? 'FastAPI health check succeeded. Practice synthetic model only; not production or official NER intelligence.'
        : 'FastAPI ML service is unavailable or its model is not loaded.'
    };

    const providers: IntegrationHealth[] = [
      openMeteoHealth,
      scenarioHealth,
      imdHealth,
      sensorHealth,
      satelliteHealth,
      databaseHealth,
      notificationHealth,
      mlIntegrationHealth
    ];

    const isAnyError = providers.some(p => p.status === 'ERROR');
    const isAnyDegraded = providers.some(p => p.status === 'DEGRADED' || p.status === 'DISCONNECTED');

    return {
      status: isAnyError ? 'DEGRADED' : isAnyDegraded ? 'DEGRADED' : 'OPERATIONAL',
      serverTime: checkedAt,
      uptimeSeconds: Math.round(process.uptime()),
      environment: env.NODE_ENV,
      dataMode: env.DATA_MODE,
      providers
    };
  }
}

export const integrationHealthService = new IntegrationHealthService();
