import type { Request, Response, NextFunction } from 'express';
import { weatherService } from '../services/weather.service.js';
import { weatherQuerySchema } from '../schemas/weather.schema.js';

export class WeatherController {
  async getWeather(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = weatherQuerySchema.parse(req.query);
      const data = await weatherService.getCurrentWeather(query);

      const records = Array.isArray(data) ? data : [data];
      const primary = records[0];

      res.status(200).json({
        success: true,
        count: records.length,
        provider: primary?.provider || 'RESEARCH',
        sourceType: primary?.sourceType || 'OPEN_METEO_FORECAST',
        isDemo: primary?.isDemo ?? false,
        isLive: primary?.isLive ?? true,
        isOfficialWarning: false,
        disclaimer: primary?.disclaimer || 'Third-party weather forecast data used for research/demo. This is not an official IMD warning.',
        data: records
      });
    } catch (err) {
      next(err);
    }
  }

  async getForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = weatherQuerySchema.parse(req.query);
      const forecast = await weatherService.getForecast(query);

      res.status(200).json({
        success: true,
        data: forecast
      });
    } catch (err) {
      next(err);
    }
  }

  async syncOpenMeteo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = req.body.lat !== undefined ? Number(req.body.lat) : undefined;
      const lng = req.body.lng !== undefined ? Number(req.body.lng) : undefined;
      const synced = await weatherService.syncOpenMeteo(lat, lng);

      res.status(200).json({
        success: true,
        message: 'Open-Meteo weather telemetry synchronized.',
        data: synced
      });
    } catch (err) {
      next(err);
    }
  }
}

export const weatherController = new WeatherController();
