import type { Request, Response, NextFunction } from 'express';
import { incidentsService } from '../services/incidents.service.js';
import { incidentQuerySchema } from '../schemas/incident.schema.js';
import { AppError } from '../middleware/error-handler.js';

export class IncidentsController {
  async getIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = incidentQuerySchema.parse(req.query);
      const incidents = await incidentsService.getIncidents(query);

      res.status(200).json({
        success: true,
        count: incidents.length,
        dataFreshness: 'FRESH',
        isDemo: true,
        isLive: false,
        source: 'PARVAAH Operational REST Backend (Demo Provider)',
        disclaimer: 'DEMO MODE — Simulated data. Not an official IMD warning or evacuation order.',
        data: incidents
      });
    } catch (err) {
      next(err);
    }
  }

  async getIncidentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const incident = await incidentsService.getIncidentById(id);

      if (!incident) {
        throw new AppError(`Incident with ID '${id}' not found.`, 404);
      }

      res.status(200).json({
        success: true,
        isDemo: incident.isDemo,
        isLive: incident.isLive,
        data: incident
      });
    } catch (err) {
      next(err);
    }
  }

  async getIncidentTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const timeline = await incidentsService.getIncidentTimeline(id);

      if (!timeline) {
        throw new AppError(`Incident with ID '${id}' not found.`, 404);
      }

      res.status(200).json({
        success: true,
        incidentId: id,
        count: timeline.length,
        data: timeline
      });
    } catch (err) {
      next(err);
    }
  }
}

export const incidentsController = new IncidentsController();
