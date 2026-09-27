import { Router } from 'express';
import { incidentsController } from '../controllers/incidents.controller.js';

export const incidentsRouter = Router();

incidentsRouter.get('/incidents', (req, res, next) => 
  incidentsController.getIncidents(req, res, next)
);

incidentsRouter.get('/incidents/:id', (req, res, next) => 
  incidentsController.getIncidentById(req, res, next)
);

incidentsRouter.get('/incidents/:id/timeline', (req, res, next) => 
  incidentsController.getIncidentTimeline(req, res, next)
);
