import type { Request, Response, NextFunction } from 'express';
import { SensorDemoProvider } from '../providers/sensors/sensor-demo.provider.js';

export class SensorsController {
  private sensorProvider = new SensorDemoProvider();

  async getSensors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const district = req.query.district as string | undefined;
      const readings = await this.sensorProvider.getReadings({ district });

      res.status(200).json({
        success: true,
        count: readings.length,
        isDemo: true,
        isLive: false,
        source: 'DEMO_DATA',
        data: readings
      });
    } catch (err) {
      next(err);
    }
  }
}

export const sensorsController = new SensorsController();
