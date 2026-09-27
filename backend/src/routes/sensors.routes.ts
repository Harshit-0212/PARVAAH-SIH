import { Router } from 'express';
import { sensorsController } from '../controllers/sensors.controller.js';

export const sensorsRouter = Router();

sensorsRouter.get('/sensors', (req, res, next) => 
  sensorsController.getSensors(req, res, next)
);
