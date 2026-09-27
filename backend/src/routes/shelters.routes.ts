import { Router } from 'express';
import { sheltersController } from '../controllers/shelters.controller.js';

export const sheltersRouter = Router();

sheltersRouter.get('/shelters', (req, res, next) => 
  sheltersController.getShelters(req, res, next)
);

sheltersRouter.get('/shelters/:id', (req, res, next) => 
  sheltersController.getShelterById(req, res, next)
);
