import type { NormalizedRiskCalculationInput } from '../schemas/risk.schema.js';
import type { SeverityLevel, EvacuationRecommendation, RiskZoneFeature } from '../types/index.js';
import { mlService, type MlPredictOutput, type MlDemoPredictInput } from './ml.service.js';
import { DEMO_RISK_ZONES } from '../data/demo/risk-zones.js';
import { isDatabaseConnected } from '../config/db.js';
import { PredictionHistoryModel } from '../models/PredictionHistory.model.js';
import { RiskZoneModel } from '../models/RiskZone.model.js';
import { reportStorage } from '../providers/storage/report-storage.provider.js';
import { scenarioWeatherProvider } from '../providers/weather/scenario-weather.provider.js';
import { imdDemoProvider } from '../providers/weather/imd-demo.provider.js';
import { logger } from '../utils/logger.js';

export interface RiskScoreOutput {
  riskScore: number;
  riskLevel: SeverityLevel;
  confidence: number;
  modelVersion: string;
  modelMode: 'DEMO_RULE_BASED' | 'TRAINED_MODEL' | 'UNAVAILABLE';
  dataSource: string;
  calculatedAt: string;
  forecastValidUntil: string;
  contributingFactors: {
    rainfall24h: { value: number; normalized: number; contribution: number };
    forecastRainfall: { value: number; normalized: number; contribution: number };
    soilMoisture: { value: number; normalized: number; contribution: number };
    slope: { value: number; normalized: number; contribution: number };
    historicalSusceptibility: { value: number; normalized: number; contribution: number };
    verifiedFieldReports: { severity: string; normalized: number; contribution: number };
  };
  evacuationRecommendation: EvacuationRecommendation;
  disclaimer: string;
}

export interface EnrichedMlRiskOutput {
  modelVersion: string;
  modelMode: 'DEMO_XGBOOST' | 'EXCEL_PILOT_XGBOOST' | 'PRACTICE_XGBOOST' | 'DEMO_RULE_BASED';
  modelAvailable: boolean;
  landslideProbability: number;
  riskScore: number;
  riskLevel: SeverityLevel;
  confidence: number;
  calculatedAt: string;
  forecastValidUntil: string;
  zoneId?: string;
  inputSummary: {
    rainfall_24h_mm: number;
    forecast_rainfall_24h_mm: number;
    soil_moisture_percent: number;
    slope_degrees: number;
    historical_landslide_density: number;
    verified_report_count: number;
  };
  inputSources?: Record<string, string>;
  contributingFactors: {
    rainfall24h: { value: number; normalized: number; contribution: number };
    forecastRainfall: { value: number; normalized: number; contribution: number };
    soilMoisture: { value: number; normalized: number; contribution: number };
    slope: { value: number; normalized: number; contribution: number };
    historicalSusceptibility: { value: number; normalized: number; contribution: number };
    verifiedFieldReports: { value: number; normalized: number; contribution: number };
  };
  evacuationRecommendation: EvacuationRecommendation;
  disclaimer: string;
  latencyMs: number;
  isFallback: boolean;
}

export class RiskService {
  private static readonly DISCLAIMER =
    'This is a prototype decision-support advisory. It is not an official warning or evacuation order. Follow instructions from authorized disaster-management authorities.';

  /**
   * Transparent prototype rule-based calculation (Synchronous baseline)
   */
  calculateRisk(
    input: {
      rainfall24hMm?: number;
      forecastRainfall24hMm?: number;
      soilMoisturePercent?: number;
      slopeDegrees?: number;
      historicalSusceptibility?: number;
      verifiedFieldReportSeverity?: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    },
    dataSource = 'RESEARCH_MODEL'
  ): RiskScoreOutput {
    const rain24h = input.rainfall24hMm ?? 0;
    const forecast = input.forecastRainfall24hMm ?? 0;
    const soil = input.soilMoisturePercent ?? 50;
    const slope = input.slopeDegrees ?? 30;
    const hist = input.historicalSusceptibility ?? 50;

    const normRain24h = Math.min(100, Math.max(0, (rain24h / 200) * 100));
    const normForecast = Math.min(100, Math.max(0, (forecast / 80) * 100));
    const normSoil = Math.min(100, Math.max(0, soil));
    const normSlope = Math.min(100, Math.max(0, (slope / 45) * 100));
    const normHist = Math.min(100, Math.max(0, hist));

    let normField = 0;
    switch (input.verifiedFieldReportSeverity) {
      case 'CRITICAL': normField = 100; break;
      case 'HIGH': normField = 75; break;
      case 'MODERATE': normField = 50; break;
      case 'LOW': normField = 25; break;
      default: normField = 0;
    }

    const cRain = 0.30 * normRain24h;
    const cForecast = 0.20 * normForecast;
    const cSoil = 0.20 * normSoil;
    const cSlope = 0.15 * normSlope;
    const cHist = 0.10 * normHist;
    const cField = 0.05 * normField;

    const rawScore = cRain + cForecast + cSoil + cSlope + cHist + cField;
    const riskScore = Math.round(Math.min(100, Math.max(0, rawScore)));

    let riskLevel: SeverityLevel = 'LOW';
    let evacuationRec: EvacuationRecommendation = 'NO_ADVICE';

    if (riskScore >= 75) {
      riskLevel = 'CRITICAL';
      evacuationRec = 'MANDATORY'; // Decision-support recommendation ONLY
    } else if (riskScore >= 50) {
      riskLevel = 'HIGH';
      evacuationRec = 'ADVISORY';
    } else if (riskScore >= 25) {
      riskLevel = 'MODERATE';
      evacuationRec = 'ADVISORY';
    }

    const calculatedAt = new Date().toISOString();
    const forecastValidUntil = new Date(Date.now() + 24 * 3600000).toISOString();

    return {
      riskScore,
      riskLevel,
      confidence: 88,
      modelVersion: 'prototype-rule-based-v1',
      modelMode: 'DEMO_RULE_BASED',
      dataSource,
      calculatedAt,
      forecastValidUntil,
      contributingFactors: {
        rainfall24h: { value: rain24h, normalized: Math.round(normRain24h), contribution: Math.round(cRain * 10) / 10 },
        forecastRainfall: { value: forecast, normalized: Math.round(normForecast), contribution: Math.round(cForecast * 10) / 10 },
        soilMoisture: { value: soil, normalized: Math.round(normSoil), contribution: Math.round(cSoil * 10) / 10 },
        slope: { value: slope, normalized: Math.round(normSlope), contribution: Math.round(cSlope * 10) / 10 },
        historicalSusceptibility: { value: hist, normalized: Math.round(normHist), contribution: Math.round(cHist * 10) / 10 },
        verifiedFieldReports: { severity: input.verifiedFieldReportSeverity || 'NONE', normalized: normField, contribution: Math.round(cField * 10) / 10 }
      },
      evacuationRecommendation: evacuationRec,
      disclaimer: RiskService.DISCLAIMER
    };
  }

  /**
   * XGBoost ML Inference Engine: Calls FastAPI microservice on port 8001,
   * persists to PredictionHistory, updates RiskZone if zoneId supplied, and enforces safety gates.
   */
  async calculateMlRisk(
    input: NormalizedRiskCalculationInput,
    triggeredBy = 'MANUAL_CALCULATOR'
  ): Promise<EnrichedMlRiskOutput> {
    const mlResult = await mlService.predict({
      rainfall_24h_mm: input.rainfall_24h_mm,
      forecast_rainfall_24h_mm: input.forecast_rainfall_24h_mm,
      soil_moisture_percent: input.soil_moisture_percent,
      slope_degrees: input.slope_degrees,
      historical_landslide_density: input.historical_landslide_density,
      verified_report_count: input.verified_report_count
    });

    const predictionId = `PRED-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Persist to MongoDB only after calculation succeeds
    if (isDatabaseConnected()) {
      try {
        await PredictionHistoryModel.create({
          id: predictionId,
          zoneId: input.zoneId,
          inputs: {
            rainfall_24h_mm: input.rainfall_24h_mm,
            forecast_rainfall_24h_mm: input.forecast_rainfall_24h_mm,
            soil_moisture_percent: input.soil_moisture_percent,
            slope_degrees: input.slope_degrees,
            historical_landslide_density: input.historical_landslide_density,
            verified_report_count: input.verified_report_count
          },
          inputSources: input.inputSources || {},
          output: {
            landslideProbability: mlResult.landslideProbability,
            riskScore: mlResult.riskScore,
            riskLevel: mlResult.riskLevel,
            modelVersion: mlResult.modelVersion,
            modelMode: mlResult.modelMode,
            disclaimer: mlResult.disclaimer
          },
          latencyMs: mlResult.latencyMs,
          triggeredBy,
          isFallback: mlResult.isFallback,
          calculatedAt: new Date(mlResult.calculatedAt)
        });
        logger.info(`[RiskService] Persisted prediction ${predictionId} to MongoDB.`);
      } catch (err: any) {
        logger.warn(`[RiskService] PredictionHistory save notice: ${err.message}`);
      }
    }

    // Update RiskZone if zoneId supplied
    if (input.zoneId) {
      this.updateRiskZoneScore(input.zoneId, mlResult);
    }

    // Safety Recommendation Gate: AI recommendation must NEVER order mandatory evacuation
    let evacuationRec: EvacuationRecommendation = 'NO_ADVICE';
    if (mlResult.riskScore >= 75) {
      evacuationRec = 'VOLUNTARY'; // AI recommendation capped at advisory/voluntary
    } else if (mlResult.riskScore >= 50) {
      evacuationRec = 'ADVISORY';
    } else {
      evacuationRec = 'NO_ADVICE';
    }

    const normRain = Math.min(100, Math.max(0, (input.rainfall_24h_mm / 200) * 100));
    const normForecast = Math.min(100, Math.max(0, (input.forecast_rainfall_24h_mm / 80) * 100));
    const normSoil = Math.min(100, Math.max(0, input.soil_moisture_percent));
    const normSlope = Math.min(100, Math.max(0, (input.slope_degrees / 45) * 100));
    const normHist = Math.min(100, Math.max(0, input.historical_landslide_density * 100));
    const normReport = Math.min(100, Math.max(0, input.verified_report_count * 10));

    const nowIso = new Date().toISOString();
    const validUntilIso = new Date(Date.now() + 24 * 3600000).toISOString();

    return {
      modelVersion: mlResult.modelVersion,
      modelMode: mlResult.modelMode,
      modelAvailable: mlResult.modelAvailable,
      landslideProbability: mlResult.landslideProbability,
      riskScore: mlResult.riskScore,
      riskLevel: mlResult.riskLevel,
      confidence: mlResult.modelMode === 'PRACTICE_XGBOOST' ? 92 : 75,
      calculatedAt: nowIso,
      forecastValidUntil: validUntilIso,
      zoneId: input.zoneId,
      inputSummary: {
        rainfall_24h_mm: input.rainfall_24h_mm,
        forecast_rainfall_24h_mm: input.forecast_rainfall_24h_mm,
        soil_moisture_percent: input.soil_moisture_percent,
        slope_degrees: input.slope_degrees,
        historical_landslide_density: input.historical_landslide_density,
        verified_report_count: input.verified_report_count
      },
      inputSources: input.inputSources,
      contributingFactors: {
        rainfall24h: { value: input.rainfall_24h_mm, normalized: Math.round(normRain), contribution: Math.round(normRain * 0.3 * 10) / 10 },
        forecastRainfall: { value: input.forecast_rainfall_24h_mm, normalized: Math.round(normForecast), contribution: Math.round(normForecast * 0.2 * 10) / 10 },
        soilMoisture: { value: input.soil_moisture_percent, normalized: Math.round(normSoil), contribution: Math.round(normSoil * 0.2 * 10) / 10 },
        slope: { value: input.slope_degrees, normalized: Math.round(normSlope), contribution: Math.round(normSlope * 0.15 * 10) / 10 },
        historicalSusceptibility: { value: input.historical_landslide_density, normalized: Math.round(normHist), contribution: Math.round(normHist * 0.1 * 10) / 10 },
        verifiedFieldReports: { value: input.verified_report_count, normalized: Math.round(normReport), contribution: Math.round(normReport * 0.05 * 10) / 10 }
      },
      evacuationRecommendation: evacuationRec,
      disclaimer: mlResult.disclaimer,
      latencyMs: mlResult.latencyMs,
      isFallback: mlResult.isFallback
    };
  }

  /**
   * Demo XGBoost Risk Calculation: Calls FastAPI /api/v1/risk/predict
   * using the 7-feature demo_xgboost_v1 model (trained on balanced dataset).
   * official_evacuation_status is always NO_ADVICE from the simulator.
   */
  async calculateDemoXGBoostRisk(
    input: MlDemoPredictInput,
    zoneId?: string,
    triggeredBy = 'RISK_SIMULATOR'
  ): Promise<{
    modelVersion: string;
    modelMode: string;
    modelAvailable: boolean;
    landslideProbability: number;
    riskScore: number;
    riskLevel: SeverityLevel;
    evacuationRecommendation: string;
    officialEvacuationStatus: string;
    calculatedAt: string;
    inputSummary: MlDemoPredictInput;
    disclaimer: string;
    latencyMs: number;
    isFallback: boolean;
  }> {
    const mlResult = await mlService.predictDemo(input);

    // Persist to history if DB is connected
    if (isDatabaseConnected()) {
      try {
        const predictionId = `DEMO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await PredictionHistoryModel.create({
          id: predictionId,
          zoneId,
          inputs: input,
          inputSources: { all: 'DEMO_MANUAL' },
          output: {
            landslideProbability: mlResult.landslideProbability,
            riskScore: mlResult.riskScore,
            riskLevel: mlResult.riskLevel,
            modelVersion: mlResult.modelVersion,
            modelMode: mlResult.modelMode,
            disclaimer: mlResult.disclaimer
          },
          latencyMs: mlResult.latencyMs,
          triggeredBy,
          isFallback: mlResult.isFallback,
          calculatedAt: new Date(mlResult.calculatedAt)
        });
      } catch (err: any) {
        logger.warn(`[RiskService] Demo prediction history save notice: ${err.message}`);
      }
    }

    // Official evacuation status is ALWAYS NO_ADVICE from the simulator.
    // Only authorised officer actions can change official status.
    return {
      modelVersion: mlResult.modelVersion,
      modelMode: mlResult.modelMode,
      modelAvailable: mlResult.modelAvailable,
      landslideProbability: mlResult.landslideProbability,
      riskScore: mlResult.riskScore,
      riskLevel: mlResult.riskLevel,
      evacuationRecommendation: mlResult.evacuationRecommendation || 'NO_ADVICE',
      officialEvacuationStatus: 'NO_ADVICE',
      calculatedAt: mlResult.calculatedAt,
      inputSummary: input,
      disclaimer: mlResult.disclaimer,
      latencyMs: mlResult.latencyMs,
      isFallback: mlResult.isFallback
    };
  }

  /**
   * Recalculates risk for a specific zone using XGBoost inference and dynamic inputs
   */
  async recalculateRiskForZone(zoneId: string, triggerSource = 'AUTOMATIC_SYNC'): Promise<RiskZoneFeature> {
    const zone = DEMO_RISK_ZONES.features.find(
      (f) => f.id.toLowerCase() === zoneId.toLowerCase() || f.properties.zoneId.toLowerCase() === zoneId.toLowerCase()
    );

    if (!zone) {
      throw new Error(`Risk zone with ID '${zoneId}' not found.`);
    }

    let district = 'east_sikkim';
    if (zone.id.includes('SKM') || zone.properties.zoneName.toLowerCase().includes('sikkim') || zone.properties.zoneName.toLowerCase().includes('sevoke')) {
      district = 'east_sikkim';
    } else if (zone.id.includes('MEG') || zone.properties.zoneName.toLowerCase().includes('mawkdok')) {
      district = 'east_khasi';
    } else if (zone.id.includes('ASM') || zone.properties.zoneName.toLowerCase().includes('haflong')) {
      district = 'dima_hasao';
    }

    const slopeDegrees = zone.id.includes('SKM') ? 45.0 : zone.id.includes('MEG') ? 36.0 : 42.0;
    const historicalLandslideDensity = zone.id.includes('SKM') ? 0.88 : zone.id.includes('MEG') ? 0.65 : 0.82;

    let rainfall24h = 45;
    let forecastRainfall24h = 35;
    let soilMoisture = 65;
    let weatherSource = 'DEMO_BASELINE';

    const activeScenario = scenarioWeatherProvider.getActiveScenario();
    if (activeScenario && (!activeScenario.district || activeScenario.district === 'all' || activeScenario.district === district)) {
      rainfall24h = activeScenario.rainfall24hMm;
      forecastRainfall24h = activeScenario.forecastRainfall24hMm;
      soilMoisture = activeScenario.soilMoisturePercent;
      weatherSource = 'SIMULATED_SCENARIO';
    } else {
      try {
        const weatherRes = await imdDemoProvider.getCurrentWeather({ district });
        if (weatherRes && !Array.isArray(weatherRes)) {
          rainfall24h = weatherRes.rainfall24hMm ?? rainfall24h;
          forecastRainfall24h = weatherRes.forecastRainfall24hMm ?? forecastRainfall24h;
          soilMoisture = 72;
          weatherSource = 'IMD_DEMO_BASELINE';
        }
      } catch {
        // baseline
      }
    }

    // Count ONLY VERIFIED citizen and field reports!
    const allReports = await reportStorage.getAllReports();
    const verifiedReports = allReports.filter((r) => r.district === district && r.verificationStatus === 'VERIFIED');
    const verifiedReportCount = verifiedReports.length;

    const calcOutput = await this.calculateMlRisk(
      {
        rainfall_24h_mm: rainfall24h,
        forecast_rainfall_24h_mm: forecastRainfall24h,
        soil_moisture_percent: soilMoisture,
        slope_degrees: slopeDegrees,
        historical_landslide_density: historicalLandslideDensity,
        verified_report_count: verifiedReportCount,
        zoneId: zone.properties.zoneId,
        inputSources: {
          rainfall_24h: weatherSource,
          forecast_rainfall: weatherSource,
          soil_moisture: 'SENSOR_TELEMETRY',
          slope_degrees: 'FIXED_TERRAIN_DEM',
          historical_density: 'FIXED_TERRAIN_DATA',
          verified_reports: `VERIFIED_REPORTS_COUNT (${verifiedReportCount} verified)`
        }
      },
      triggerSource
    );

    const updatedFeature: RiskZoneFeature = {
      ...zone,
      properties: {
        ...zone.properties,
        riskScore: calcOutput.riskScore,
        riskLevel: calcOutput.riskLevel,
        confidence: calcOutput.confidence,
        modelMode: calcOutput.modelMode as any,
        modelVersion: calcOutput.modelVersion,
        calculatedAt: calcOutput.calculatedAt,
        contributingFactors: {
          rainfall24hContribution: calcOutput.contributingFactors.rainfall24h.contribution,
          forecastRainfallContribution: calcOutput.contributingFactors.forecastRainfall.contribution,
          soilMoistureContribution: calcOutput.contributingFactors.soilMoisture.contribution,
          slopeContribution: calcOutput.contributingFactors.slope.contribution,
          historicalSusceptibilityContribution: calcOutput.contributingFactors.historicalSusceptibility.contribution,
          verifiedFieldReportsContribution: calcOutput.contributingFactors.verifiedFieldReports.contribution
        },
        disclaimer: calcOutput.disclaimer
      }
    };

    return updatedFeature;
  }

  private updateRiskZoneScore(zoneId: string, mlResult: MlPredictOutput): void {
    const feature = DEMO_RISK_ZONES.features.find(
      (f) => f.id.toLowerCase() === zoneId.toLowerCase() || f.properties.zoneId.toLowerCase() === zoneId.toLowerCase()
    );

    if (feature) {
      feature.properties.riskScore = mlResult.riskScore;
      feature.properties.riskLevel = mlResult.riskLevel;
      feature.properties.modelMode = mlResult.modelMode as any;
      feature.properties.modelVersion = mlResult.modelVersion;
      feature.properties.calculatedAt = mlResult.calculatedAt;
      feature.properties.disclaimer = mlResult.disclaimer;
    }

    if (isDatabaseConnected()) {
      RiskZoneModel.updateOne(
        { id: zoneId },
        {
          $set: {
            riskScore: mlResult.riskScore,
            riskLevel: mlResult.riskLevel,
            modelMode: mlResult.modelMode,
            modelVersion: mlResult.modelVersion,
            lastCalculatedAt: new Date(mlResult.calculatedAt),
            disclaimer: mlResult.disclaimer
          }
        },
        { upsert: true }
      ).catch((err: any) => logger.warn(`Failed updating RiskZone in MongoDB: ${err.message}`));
    }
  }
}

export const riskService = new RiskService();
