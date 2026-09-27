import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface MlPredictInput {
  rainfall_24h_mm: number;
  forecast_rainfall_24h_mm: number;
  soil_moisture_percent: number;
  slope_degrees: number;
  historical_landslide_density: number;
  verified_report_count: number;
}

/** 7-feature input for the demo_xgboost_v1 model */
export interface MlDemoPredictInput {
  rainfall_24h_mm: number;
  rainfall_48h_mm: number;
  rainfall_7d_mm: number;
  soil_moisture_percent: number;
  slope_degrees: number;
  elevation_m: number;
  historical_landslide_density: number;
}

export interface MlPredictOutput {
  modelVersion: string;
  modelMode: 'DEMO_XGBOOST' | 'EXCEL_PILOT_XGBOOST' | 'PRACTICE_XGBOOST' | 'DEMO_RULE_BASED';
  modelAvailable: boolean;
  landslideProbability: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  calculatedAt: string;
  inputSummary: MlPredictInput | MlDemoPredictInput | Record<string, number>;
  disclaimer: string;
  latencyMs: number;
  isFallback: boolean;
  evacuationRecommendation?: string;
}

export interface MlHealthOutput {
  ok: boolean;
  service: string;
  modelLoaded: boolean;
  modelAvailable: boolean;
  modelVersion: string;
  modelMode: string;
  serverTime: string;
  disclaimer: string;
}

export class MlService {
  private baseUrl: string;
  private timeoutMs: number;
  private lastHealthCheckAt: string | null = null;
  private lastHealthLatencyMs: number | null = null;
  private lastHealthError: string | null = null;

  constructor() {
    this.baseUrl = env.ML_SERVICE_BASE_URL.replace(/\/$/, '');
    this.timeoutMs = env.ML_SERVICE_TIMEOUT_MS;
  }

  /**
   * Health probe for the FastAPI ML microservice.
   */
  async checkHealth(): Promise<MlHealthOutput | null> {
    const startedAt = Date.now();
    this.lastHealthCheckAt = new Date().toISOString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(3000, this.timeoutMs));

    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });

      clearTimeout(timeoutId);
      this.lastHealthLatencyMs = Date.now() - startedAt;

      if (!res.ok) {
        this.lastHealthError = `FastAPI health returned HTTP ${res.status}.`;
        logger.warn(`[MlService] Health check failed with status ${res.status}`);
        return {
          ok: false,
          service: 'PARVAAH Practice ML Service',
          modelLoaded: false,
          modelAvailable: false,
          modelVersion: 'prototype-rule-based-v1',
          modelMode: 'DEMO_RULE_BASED',
          serverTime: new Date().toISOString(),
          disclaimer: 'Prototype decision-support fallback. Not an official disaster warning.'
        };
      }

      const data = (await res.json()) as MlHealthOutput;
      this.lastHealthError = null;
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.lastHealthLatencyMs = Date.now() - startedAt;
      this.lastHealthError = 'FastAPI health check was unreachable or timed out.';
      logger.info(`[MlService] Microservice health check unreachable: ${err.message}`);
      return {
        ok: false,
        service: 'PARVAAH Practice ML Service',
        modelLoaded: false,
        modelAvailable: false,
        modelVersion: 'prototype-rule-based-v1',
        modelMode: 'DEMO_RULE_BASED',
        serverTime: new Date().toISOString(),
        disclaimer: 'Prototype decision-support fallback. Not an official disaster warning.'
      };
    }
  }

  getHealthTelemetry(): { checkedAt: string | null; latencyMs: number | null; lastError: string | null } {
    return { checkedAt: this.lastHealthCheckAt, latencyMs: this.lastHealthLatencyMs, lastError: this.lastHealthError };
  }

  /**
   * Checks if FastAPI ML microservice is available and model is loaded.
   */
  async isAvailable(): Promise<boolean> {
    const health = await this.checkHealth();
    return Boolean(health && health.ok && health.modelLoaded);
  }

  /**
   * Execute landslide risk inference using the loaded FastAPI ML model (legacy 6-feature).
   */
  async predict(input: MlPredictInput): Promise<MlPredictOutput> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(input),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`FastAPI ML service HTTP ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as {
        modelVersion: string;
        modelMode: 'DEMO_XGBOOST' | 'EXCEL_PILOT_XGBOOST' | 'PRACTICE_XGBOOST' | 'DEMO_RULE_BASED';
        modelAvailable: boolean;
        landslideProbability: number;
        riskScore: number;
        riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
        calculatedAt: string;
        inputSummary: Record<string, any>;
        disclaimer: string;
      };

      const finalScore = Math.round(data.riskScore * 10) / 10;
      let finalLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (finalScore >= 75) finalLevel = 'CRITICAL';
      else if (finalScore >= 50) finalLevel = 'HIGH';
      else if (finalScore >= 25) finalLevel = 'MODERATE';

      return {
        modelVersion: data.modelVersion || 'practice-xgboost-v1',
        modelMode: data.modelMode || 'PRACTICE_XGBOOST',
        modelAvailable: true,
        landslideProbability: data.landslideProbability,
        riskScore: finalScore,
        riskLevel: finalLevel,
        calculatedAt: data.calculatedAt || new Date().toISOString(),
        inputSummary: input,
        disclaimer:
          data.disclaimer ||
          'Practice-only model output. Not a real landslide warning, official warning, or evacuation decision.',
        latencyMs,
        isFallback: false
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      logger.warn(`[MlService] FastAPI prediction failed (${err.message}). Using rule-based fallback.`);

      // Execute labelled rule-based fallback
      return this.fallbackPrediction(input, latencyMs);
    }
  }

  /**
   * Execute landslide risk inference using the demo_xgboost_v1 model (7-feature).
   * Calls /api/v1/risk/predict on the FastAPI service.
   * Falls back to rule-based if unavailable.
   */
  async predictDemo(input: MlDemoPredictInput): Promise<MlPredictOutput> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/risk/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(input),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`FastAPI demo predict HTTP ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as {
        modelVersion: string;
        modelMode: string;
        modelAvailable: boolean;
        landslideProbability: number;
        riskScore: number;
        riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
        evacuationRecommendation: string;
        calculatedAt: string;
        inputSummary: Record<string, any>;
        disclaimer: string;
      };

      const finalScore = Math.round(data.riskScore * 10) / 10;
      let finalLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (finalScore >= 75) finalLevel = 'CRITICAL';
      else if (finalScore >= 50) finalLevel = 'HIGH';
      else if (finalScore >= 25) finalLevel = 'MODERATE';

      return {
        modelVersion: data.modelVersion || 'demo-xgboost-v1',
        modelMode: (data.modelMode || 'DEMO_XGBOOST') as any,
        modelAvailable: true,
        landslideProbability: data.landslideProbability,
        riskScore: finalScore,
        riskLevel: finalLevel,
        evacuationRecommendation: data.evacuationRecommendation || 'NO_ADVICE',
        calculatedAt: data.calculatedAt || new Date().toISOString(),
        inputSummary: input,
        disclaimer:
          data.disclaimer ||
          'Demo/research model output only. Not a real landslide warning, official warning, or evacuation decision.',
        latencyMs,
        isFallback: false
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      logger.warn(`[MlService] Demo XGBoost prediction failed (${err.message}). Using rule-based fallback.`);
      return this.fallbackDemoPrediction(input, latencyMs);
    }
  }

  /**
   * Prototype rule-based output used when the FastAPI service is unavailable.
   * Transparently reports DEMO_RULE_BASED mode and prototype-rule-based-v1 version.
   */
  private fallbackPrediction(input: MlPredictInput, latencyMs: number): MlPredictOutput {
    const normRain = Math.min(100, Math.max(0, (input.rainfall_24h_mm / 200) * 100));
    const normForecast = Math.min(100, Math.max(0, (input.forecast_rainfall_24h_mm / 80) * 100));
    const normSoil = Math.min(100, Math.max(0, input.soil_moisture_percent));
    const normSlope = Math.min(100, Math.max(0, (input.slope_degrees / 45) * 100));
    const normHist = Math.min(100, Math.max(0, input.historical_landslide_density * 100));
    const normReport = Math.min(100, Math.max(0, input.verified_report_count * 10));

    const rawScore =
      0.30 * normRain +
      0.20 * normForecast +
      0.20 * normSoil +
      0.15 * normSlope +
      0.10 * normHist +
      0.05 * normReport;

    const riskScore = Math.round(Math.min(100, Math.max(0, rawScore)));
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (riskScore >= 75) riskLevel = 'CRITICAL';
    else if (riskScore >= 50) riskLevel = 'HIGH';
    else if (riskScore >= 25) riskLevel = 'MODERATE';

    return {
      modelVersion: 'prototype-rule-based-v1',
      modelMode: 'DEMO_RULE_BASED',
      modelAvailable: false,
      landslideProbability: Math.round((riskScore / 100) * 1000) / 1000,
      riskScore,
      riskLevel,
      calculatedAt: new Date().toISOString(),
      inputSummary: input,
      disclaimer:
        'FastAPI unavailable: Prototype rule-based demonstration output used. Not an official landslide warning or evacuation order.',
      latencyMs,
      isFallback: true
    };
  }

  /**
   * Rule-based fallback for the 7-feature demo schema.
   */
  private fallbackDemoPrediction(input: MlDemoPredictInput, latencyMs: number): MlPredictOutput {
    // Simple weighted rule-based score from available features
    const normRain24 = Math.min(100, Math.max(0, (input.rainfall_24h_mm / 200) * 100));
    const normRain7d = Math.min(100, Math.max(0, (input.rainfall_7d_mm / 1000) * 100));
    const normSoil = Math.min(100, Math.max(0, input.soil_moisture_percent));
    const normSlope = Math.min(100, Math.max(0, (input.slope_degrees / 45) * 100));
    const normHist = Math.min(100, Math.max(0, input.historical_landslide_density * 100));

    const rawScore =
      0.30 * normRain24 +
      0.20 * normRain7d +
      0.20 * normSoil +
      0.20 * normSlope +
      0.10 * normHist;

    const riskScore = Math.round(Math.min(100, Math.max(0, rawScore)));
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (riskScore >= 75) riskLevel = 'CRITICAL';
    else if (riskScore >= 50) riskLevel = 'HIGH';
    else if (riskScore >= 25) riskLevel = 'MODERATE';

    const evac = riskScore >= 50 ? 'PREPARE_TO_EVACUATE' : riskScore >= 25 ? 'MONITOR_SITUATION' : 'NO_ADVICE';

    return {
      modelVersion: 'prototype-rule-based-v1',
      modelMode: 'DEMO_RULE_BASED',
      modelAvailable: false,
      landslideProbability: Math.round((riskScore / 100) * 1000) / 1000,
      riskScore,
      riskLevel,
      evacuationRecommendation: evac,
      calculatedAt: new Date().toISOString(),
      inputSummary: input,
      disclaimer:
        'FastAPI unavailable: Rule-based fallback used for demo 7-feature model. Not an official landslide warning or evacuation order.',
      latencyMs,
      isFallback: true
    };
  }
}

export const mlService = new MlService();
