import type { Request, Response, NextFunction } from 'express';
import { sheltersService } from '../services/shelters.service.js';
import { AppError } from '../middleware/error-handler.js';

export class SheltersController {
  async getShelters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { district, state, lat, lng, radiusKm } = req.query as {
        district?: string;
        state?: string;
        lat?: string;
        lng?: string;
        radiusKm?: string;
      };

      const shelters = await sheltersService.getShelters({
        district,
        state,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        radiusKm: radiusKm ? parseFloat(radiusKm) : undefined
      });

      res.status(200).json({
        success: true,
        count: shelters.length,
        isDemo: true,
        isLive: false,
        source: 'DEMO_DATA',
        data: shelters
      });
    } catch (err) {
      next(err);
    }
  }

  async getShelterById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const shelter = await sheltersService.getShelterById(id);

      if (!shelter) {
        throw new AppError(`Shelter with ID '${id}' not found.`, 404);
      }

      res.status(200).json({
        success: true,
        isDemo: shelter.isDemo,
        data: shelter
      });
    } catch (err) {
      next(err);
    }
  }
}

export const sheltersController = new SheltersController();
