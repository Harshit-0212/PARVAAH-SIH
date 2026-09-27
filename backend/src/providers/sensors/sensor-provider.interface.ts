import type { SensorRecord, IntegrationHealth } from '../../types/index.js';

export interface SensorQuery {
  district?: string;
  state?: string;
}

export interface SensorProvider {
  getReadings(input: SensorQuery): Promise<SensorRecord[]>;
  getHealth(): Promise<IntegrationHealth>;
}
