import { Router } from 'express';
import { riskController } from '../controllers/risk.controller.js';

export const riskRouter = Router();

riskRouter.get('/risk-zones', (req, res, next) => 
  riskController.getRiskZones(req, res, next)
);

riskRouter.get('/risk-zones/:id', (req, res, next) => 
  riskController.getRiskZoneById(req, res, next)
);

riskRouter.post('/risk/calculate', (req, res, next) => 
  riskController.calculateRisk(req, res, next)
);

/** Demo XGBoost 7-feature endpoint */
riskRouter.post('/risk/predict', (req, res, next) =>
  riskController.calculateXGBoostRisk(req, res, next)
);

riskRouter.post('/risk-zones/:id/recalculate', (req, res, next) =>
  riskController.recalculateZoneRisk(req, res, next)
);

riskRouter.get('/red-zones', (req, res, next) =>
  riskController.getRedZones(req, res, next)
);

riskRouter.get('/safer-sites', (req, res, next) =>
  riskController.getSaferSites(req, res, next)
);


