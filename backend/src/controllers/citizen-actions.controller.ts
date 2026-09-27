import type { Request, Response, NextFunction } from 'express';
import { CITIZEN_ACTION_GUIDES } from '../services/citizen-actions.service.js';
import { AppError } from '../middleware/error-handler.js';

export class CitizenActionsController {
  getActionGuide(req: Request, res: Response, next: NextFunction): void {
    try {
      const { hazardType } = req.params;
      const guide = CITIZEN_ACTION_GUIDES[hazardType.toLowerCase()];

      if (!guide) {
        throw new AppError(`Action guide for hazard '${hazardType}' not found. Available: landslide, flood, cyclone`, 404);
      }

      res.status(200).json({
        success: true,
        data: guide
      });
    } catch (err) {
      next(err);
    }
  }

  getAllActionGuides(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: CITIZEN_ACTION_GUIDES
    });
  }
}

export const citizenActionsController = new CitizenActionsController();
