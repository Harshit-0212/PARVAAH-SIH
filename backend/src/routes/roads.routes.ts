import { Router } from 'express';
import { roadsController } from '../controllers/roads.controller.js';

export const roadsRouter = Router();

roadsRouter.get('/roads', (req, res, next) => 
  roadsController.getRoads(req, res, next)
);
