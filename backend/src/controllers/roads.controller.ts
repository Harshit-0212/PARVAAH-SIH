import type { Request, Response, NextFunction } from 'express';
import { roadsService } from '../services/roads.service.js';

export class RoadsController {
  async getRoads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, district, state, bbox } = req.query as {
        status?: string;
        district?: string;
        state?: string;
        bbox?: string;
      };

      const collection = await roadsService.getRoadsGeoJSON({
        status,
        district,
        state,
        bbox
      });

      res.status(200).json(collection);
    } catch (err) {
      next(err);
    }
  }
}

export const roadsController = new RoadsController();
