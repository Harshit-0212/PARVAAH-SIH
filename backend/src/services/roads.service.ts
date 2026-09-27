import { DEMO_ROADS_GEOJSON } from '../data/demo/roads.js';

export interface RoadFilterOptions {
  status?: string;
  district?: string;
  state?: string;
  bbox?: string;
}

export class RoadsService {
  async getRoadsGeoJSON(options: RoadFilterOptions = {}) {
    let features = [...DEMO_ROADS_GEOJSON.features];

    if (options.status) {
      features = features.filter(f => f.properties.status.toLowerCase() === options.status!.toLowerCase());
    }

    if (options.district && options.district !== 'all') {
      features = features.filter(f => f.properties.district.toLowerCase() === options.district!.toLowerCase());
    }

    if (options.state) {
      features = features.filter(f => f.properties.state.toLowerCase().includes(options.state!.toLowerCase()));
    }

    return {
      type: 'FeatureCollection' as const,
      metadata: {
        ...DEMO_ROADS_GEOJSON.metadata,
        generatedAt: new Date().toISOString(),
        count: features.length
      },
      features
    };
  }
}

export const roadsService = new RoadsService();
