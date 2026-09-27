import { z } from 'zod';

export const riskCalculationInputSchema = z
  .object({
    // Snake_case or camelCase rainfall
    rainfall_24h_mm: z.number().min(0).max(3000).optional(),
    rainfall24hMm: z.number().min(0).max(3000).optional(),

    // Forecast rainfall
    forecast_rainfall_24h_mm: z.number().min(0).max(3000).optional(),
    forecastRainfall24hMm: z.number().min(0).max(3000).optional(),

    // Soil moisture
    soil_moisture_percent: z.number().min(0).max(100).optional(),
    soilMoisturePercent: z.number().min(0).max(100).optional(),

    // Slope
    slope_degrees: z.number().min(0).max(90).optional(),
    slopeDegrees: z.number().min(0).max(90).optional(),

    // Historical density (0 - 1) or susceptibility (0 - 100)
    historical_landslide_density: z.number().min(0).max(1).optional(),
    historicalLandslideDensity: z.number().min(0).max(1).optional(),
    historicalSusceptibility: z.number().min(0).max(100).optional(),

    // Verified report count or severity
    verified_report_count: z.number().int().min(0).max(100).optional(),
    verifiedReportCount: z.number().int().min(0).max(100).optional(),
    verifiedFieldReportSeverity: z
      .enum(['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'])
      .optional(),

    // Optional targeting
    zoneId: z.string().optional(),
    inputSources: z.record(z.string()).optional()
  })
  .transform((data) => {
    // Normalize into canonical 6 XGBoost features
    const rainfall_24h_mm =
      data.rainfall_24h_mm ?? data.rainfall24hMm ?? 0;
    const forecast_rainfall_24h_mm =
      data.forecast_rainfall_24h_mm ?? data.forecastRainfall24hMm ?? 0;
    const soil_moisture_percent =
      data.soil_moisture_percent ?? data.soilMoisturePercent ?? 50;
    const slope_degrees = data.slope_degrees ?? data.slopeDegrees ?? 30;

    let historical_landslide_density =
      data.historical_landslide_density ?? data.historicalLandslideDensity;
    if (historical_landslide_density === undefined) {
      historical_landslide_density =
        data.historicalSusceptibility !== undefined
          ? Math.min(1, Math.max(0, data.historicalSusceptibility / 100))
          : 0.5;
    }

    let verified_report_count =
      data.verified_report_count ?? data.verifiedReportCount;
    if (verified_report_count === undefined) {
      switch (data.verifiedFieldReportSeverity) {
        case 'CRITICAL':
          verified_report_count = 5;
          break;
        case 'HIGH':
          verified_report_count = 3;
          break;
        case 'MODERATE':
          verified_report_count = 2;
          break;
        case 'LOW':
          verified_report_count = 1;
          break;
        default:
          verified_report_count = 0;
      }
    }

    return {
      rainfall_24h_mm,
      forecast_rainfall_24h_mm,
      soil_moisture_percent,
      slope_degrees,
      historical_landslide_density: Math.round(historical_landslide_density * 100) / 100,
      verified_report_count,
      zoneId: data.zoneId,
      inputSources: data.inputSources
    };
  });

export type NormalizedRiskCalculationInput = z.infer<typeof riskCalculationInputSchema>;
