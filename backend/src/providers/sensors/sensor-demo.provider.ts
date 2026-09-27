import type { SensorProvider, SensorQuery } from './sensor-provider.interface.js';
import type { SensorRecord, IntegrationHealth } from '../../types/index.js';
import { DEMO_SENSORS } from '../../data/demo/sensors.js';

export class SensorDemoProvider implements SensorProvider {
  async getReadings(input: SensorQuery): Promise<SensorRecord[]> {
    if (input.district && input.district !== 'all') {
      return DEMO_SENSORS.filter(s => s.district.toLowerCase() === input.district!.toLowerCase());
    }
    return DEMO_SENSORS;
  }

  async getHealth(): Promise<IntegrationHealth> {
    return {
      name: 'IoT Geotechnical Borehole Sensors (Piezometers/Inclinometers)',
      configured: true,
      status: 'DEMO',
      isLive: false,
      lastSuccessfulFetch: null,
      lastAttemptAt: null,
      lastError: null,
      dataAgeMinutes: null,
      sourceType: 'DEMO',
      details: { source: 'DEMO_SENSOR' },
      message: 'Simulated sensor data for college demonstration; no physical sensor network connected.'
    };
  }
}
