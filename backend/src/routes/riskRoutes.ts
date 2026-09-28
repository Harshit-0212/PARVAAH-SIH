import { Router } from 'express';
import { riskController } from '../controllers/riskController.js';

export const riskRoutes = Router();

// Ward Flood Risk Evaluation and Early Warning Routes
riskRoutes.get('/wards/risk', (req, res, next) => riskController.getWardRisks(req, res, next));
riskRoutes.get('/alerts', (req, res, next) => riskController.getAlerts(req, res, next));
riskRoutes.get('/ward/:id', (req, res, next) => riskController.getWardById(req, res, next));
