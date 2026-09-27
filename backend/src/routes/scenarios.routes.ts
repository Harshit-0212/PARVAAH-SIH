import { Router } from 'express';
import { scenariosController } from '../controllers/scenarios.controller.js';

export const scenariosRouter = Router();

// GET /api/v1/scenarios
scenariosRouter.get('/scenarios', (req, res, next) => 
  scenariosController.getScenarios(req, res, next)
);

// POST /api/v1/scenarios (admin/dev only)
scenariosRouter.post('/scenarios', (req, res, next) => 
  scenariosController.createScenario(req, res, next)
);

// POST /api/v1/scenarios/:id/activate (admin/dev only)
scenariosRouter.post('/scenarios/:id/activate', (req, res, next) => 
  scenariosController.activateScenario(req, res, next)
);

// POST /api/v1/scenarios/:id/deactivate (admin/dev only)
scenariosRouter.post('/scenarios/:id/deactivate', (req, res, next) => 
  scenariosController.deactivateScenario(req, res, next)
);

// GET /api/v1/scenarios/active — returns current active scenario or null
scenariosRouter.get('/scenarios/active', (req, res, next) =>
  scenariosController.getActiveScenario(req, res, next)
);

// POST /api/v1/scenarios/clear-active — deactivates current scenario, restores baseline
scenariosRouter.post('/scenarios/clear-active', (req, res, next) =>
  scenariosController.clearActiveScenario(req, res, next)
);

// POST /api/v1/scenarios/clear-state (alias for backward compatibility)
scenariosRouter.post('/scenarios/clear-state', (req, res, next) =>
  scenariosController.clearActiveScenario(req, res, next)
);
