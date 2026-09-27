import type { ShelterRecord } from '../types/index.js';
import { DEMO_SHELTERS } from '../data/demo/shelters.js';
import { calculateDistanceKm } from '../utils/geo.js';

export interface ShelterFilterOptions {
  district?: string;
  state?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export class SheltersService {
  async getShelters(options: ShelterFilterOptions = {}): Promise<ShelterRecord[]> {
    let result = [...DEMO_SHELTERS];

    if (options.district && options.district !== 'all') {
      result = result.filter(s => s.district.toLowerCase() === options.district!.toLowerCase());
    }

    if (options.state) {
      result = result.filter(s => s.state.toLowerCase().includes(options.state!.toLowerCase()));
    }

    if (options.lat !== undefined && options.lng !== undefined && options.radiusKm !== undefined) {
      result = result.filter(s => {
        const dist = calculateDistanceKm(options.lat!, options.lng!, s.coordinates.latitude, s.coordinates.longitude);
        return dist <= options.radiusKm!;
      });
    }

    return result;
  }

  async getShelterById(id: string): Promise<ShelterRecord | null> {
    const found = DEMO_SHELTERS.find(s => s.id.toLowerCase() === id.toLowerCase());
    return found || null;
  }
}

export const sheltersService = new SheltersService();
