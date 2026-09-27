import { Router } from 'express';
import { citizenActionsController } from '../controllers/citizen-actions.controller.js';

export const citizenActionsRouter = Router();

citizenActionsRouter.get('/action-guides', (req, res) => 
  citizenActionsController.getAllActionGuides(req, res)
);

citizenActionsRouter.get('/action-guides/:hazardType', (req, res, next) => 
  citizenActionsController.getActionGuide(req, res, next)
);
