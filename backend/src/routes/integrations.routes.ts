import { Router } from 'express';
import { integrationsController } from '../controllers/integrations.controller.js';

export const integrationsRouter = Router();

integrationsRouter.get('/integrations/health', (req, res, next) => 
  integrationsController.getHealth(req, res, next)
);

integrationsRouter.post('/integrations/imd/test', (req, res, next) => 
  integrationsController.testImdConnection(req, res, next)
);
