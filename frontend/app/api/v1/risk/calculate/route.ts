import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_BASE_URL || 'http://127.0.0.1:8001';
const ML_TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS) || 10000;

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const startTime = Date.now();

  try {
    const body = await req.json();

    // 1. Validate and normalize 6 features
    const rainfall_24h_mm = Number(body.rainfall_24h_mm ?? body.rainfall24hMm ?? 0);
    const forecast_rainfall_24h_mm = Number(body.forecast_rainfall_24h_mm ?? body.forecastRainfall24hMm ?? 0);
    const soil_moisture_percent = Number(body.soil_moisture_percent ?? body.soilMoisturePercent ?? 50);
    const slope_degrees = Number(body.slope_degrees ?? body.slopeDegrees ?? 30);
    let historical_landslide_density = body.historical_landslide_density ?? body.historicalLandslideDensity;
    if (historical_landslide_density === undefined) {
      historical_landslide_density = body.historicalSusceptibility !== undefined ? body.historicalSusceptibility / 100 : 0.5;
    }
    historical_landslide_density = Number(historical_landslide_density);
    const verified_report_count = Number(body.verified_report_count ?? body.verifiedReportCount ?? 0);

    const featurePayload = {
      rainfall_24h_mm,
      forecast_rainfall_24h_mm,
      soil_moisture_percent,
      slope_degrees,
      historical_landslide_density,
      verified_report_count
    };

    // 2. Call FastAPI XGBoost /predict server-to-server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

    let mlOutput: any = null;
    let isFallback = false;

    try {
      const mlRes = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(featurePayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (mlRes.ok) {
        mlOutput = await mlRes.json();
      } else {
        isFallback = true;
      }
    } catch {
      clearTimeout(timeoutId);
      isFallback = true;
    }

    const latencyMs = Date.now() - startTime;

    // 3. If FastAPI is unavailable, use DEMO_RULE_BASED fallback
    if (isFallback || !mlOutput) {
      const normRain = Math.min(100, Math.max(0, (rainfall_24h_mm / 200) * 100));
      const normForecast = Math.min(100, Math.max(0, (forecast_rainfall_24h_mm / 80) * 100));
      const normSoil = Math.min(100, Math.max(0, soil_moisture_percent));
      const normSlope = Math.min(100, Math.max(0, (slope_degrees / 45) * 100));
      const normHist = Math.min(100, Math.max(0, historical_landslide_density * 100));
      const normReport = Math.min(100, Math.max(0, verified_report_count * 10));

      const rawScore = 0.30 * normRain + 0.20 * normForecast + 0.20 * normSoil + 0.15 * normSlope + 0.10 * normHist + 0.05 * normReport;
      const riskScore = Math.round(Math.min(100, Math.max(0, rawScore)));
      const riskLevel = riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MODERATE' : 'LOW';

      return NextResponse.json({
        success: true,
        data: {
          modelVersion: 'prototype-rule-based-v1',
          modelMode: 'DEMO_RULE_BASED',
          modelAvailable: false,
          landslideProbability: Math.round((riskScore / 100) * 1000) / 1000,
          riskScore,
          riskLevel,
          calculatedAt: new Date().toISOString(),
          inputSummary: featurePayload,
          zoneId: body.zoneId,
          evacuationRecommendation: riskScore >= 75 ? 'MANDATORY' : riskScore >= 25 ? 'ADVISORY' : 'NO_ADVICE',
          disclaimer: 'DEMO RULE-BASED FALLBACK: ML microservice was unavailable. Practice simulation only.',
          latencyMs,
          isFallback: true
        }
      }, {
        status: 200,
        headers: { 'X-Request-Id': requestId }
      });
    }

    // 4. Return FastAPI prediction directly without altering modelMode
    return NextResponse.json({
      success: true,
      data: {
        modelVersion: mlOutput.modelVersion || 'practice-xgboost-v1',
        modelMode: 'PRACTICE_XGBOOST',
        modelAvailable: true,
        landslideProbability: mlOutput.landslideProbability,
        riskScore: Math.round(mlOutput.riskScore * 10) / 10,
        riskLevel: mlOutput.riskLevel,
        calculatedAt: mlOutput.calculatedAt || new Date().toISOString(),
        inputSummary: featurePayload,
        zoneId: body.zoneId,
        evacuationRecommendation: mlOutput.riskScore >= 75 ? 'MANDATORY' : mlOutput.riskScore >= 25 ? 'ADVISORY' : 'NO_ADVICE',
        disclaimer: mlOutput.disclaimer,
        latencyMs,
        isFallback: false
      }
    }, {
      status: 200,
      headers: { 'X-Request-Id': requestId }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: 'Invalid risk calculation payload',
      details: err.message
    }, {
      status: 400,
      headers: { 'X-Request-Id': requestId }
    });
  }
}
