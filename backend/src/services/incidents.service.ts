import type { IncidentRecord, IncidentTimelineEntry } from '../types/index.js';
import { DEMO_INCIDENTS } from '../data/demo/incidents.js';
import { parseBBox, isPointInBBox } from '../utils/geo.js';

export interface IncidentFilterOptions {
  hazardType?: string;
  severity?: string;
  status?: string;
  district?: string;
  state?: string;
  bbox?: string;
  includeResolved?: boolean;
  limit?: number;
}

export class IncidentsService {
  private incidents: IncidentRecord[] = [...DEMO_INCIDENTS];

  async getIncidents(options: IncidentFilterOptions = {}): Promise<IncidentRecord[]> {
    let result = [...this.incidents];

    if (options.hazardType) {
      result = result.filter(i => i.hazardType.toLowerCase() === options.hazardType!.toLowerCase());
    }

    if (options.severity) {
      result = result.filter(i => i.severity.toLowerCase() === options.severity!.toLowerCase());
    }

    if (options.status) {
      result = result.filter(i => i.status.toLowerCase() === options.status!.toLowerCase());
    }

    if (!options.includeResolved) {
      result = result.filter(i => i.status !== 'RESOLVED' && i.status !== 'ARCHIVED');
    }

    if (options.district && options.district !== 'all') {
      result = result.filter(i => i.district.toLowerCase() === options.district!.toLowerCase());
    }

    if (options.state) {
      result = result.filter(i => i.state.toLowerCase().includes(options.state!.toLowerCase()));
    }

    if (options.bbox) {
      const parsed = parseBBox(options.bbox);
      if (parsed) {
        result = result.filter(i => 
          isPointInBBox(i.coordinates.latitude, i.coordinates.longitude, parsed)
        );
      }
    }

    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  async getIncidentById(id: string): Promise<IncidentRecord | null> {
    const found = this.incidents.find(i => i.id.toLowerCase() === id.toLowerCase());
    return found || null;
  }

  async getIncidentTimeline(id: string): Promise<IncidentTimelineEntry[] | null> {
    const incident = await this.getIncidentById(id);
    if (!incident) return null;
    return incident.timeline;
  }
}

export const incidentsService = new IncidentsService();
