import { Router } from 'express';
import { weatherController } from '../controllers/weather.controller.js';

export const weatherRouter = Router();

weatherRouter.get('/weather', (req, res, next) => 
  weatherController.getWeather(req, res, next)
);

weatherRouter.get('/weather/forecast', (req, res, next) => 
  weatherController.getForecast(req, res, next)
);

weatherRouter.post('/weather/sync/open-meteo', (req, res, next) => 
  weatherController.syncOpenMeteo(req, res, next)
);
