/**
 * GIS and Geospatial Utilities for WGS84 coordinates
 */

export function isValidLatitude(lat: unknown): lat is number {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng: unknown): lng is number {
  return typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function isValidCoordinates(lat: unknown, lng: unknown): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

/**
 * Calculates haversine distance in kilometers between two lat/lng coordinates
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parses bounding box string "minLng,minLat,maxLng,maxLat"
 */
export function parseBBox(bboxStr: string): { minLng: number; minLat: number; maxLng: number; maxLat: number } | null {
  const parts = bboxStr.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  const [minLng, minLat, maxLng, maxLat] = parts;
  if (!isValidCoordinates(minLat, minLng) || !isValidCoordinates(maxLat, maxLng)) return null;
  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Checks if a point is within bounding box
 */
export function isPointInBBox(
  lat: number,
  lng: number,
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }
): boolean {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
}

export interface LocationResolutionResult {
  locationResolutionStatus: 'RESOLVED' | 'OUTSIDE_SERVICE_REGION' | 'UNRESOLVED' | 'MANUAL_CONFIRMED';
  district: string;
  state: string;
  isWithinNER: boolean;
  qualityFlags: string[];
  userWarning?: string;
}

/**
 * Validates whether coordinates fall in the configured North Eastern Region (NER) service boundary
 * and resolves state/district accurately without using inappropriate defaults.
 */
export function resolveLocation(
  lat: number,
  lng: number,
  providedDistrict?: string,
  providedState?: string
): LocationResolutionResult {
  const qualityFlags: string[] = [];

  // Macro boundary check for North Eastern Region (NER) of India (Lat ~21.5-29.8°N, Lng ~87.5-97.5°E)
  const isWithinNER = lat >= 21.5 && lat <= 29.8 && lng >= 87.5 && lng <= 97.5;

  if (!isWithinNER) {
    if (providedDistrict && providedDistrict !== 'all' && providedDistrict !== 'UNRESOLVED' && providedDistrict.trim() !== '') {
      qualityFlags.push('DISTRICT_COORDINATE_MISMATCH');
    }
    return {
      locationResolutionStatus: 'OUTSIDE_SERVICE_REGION',
      district: 'UNRESOLVED',
      state: providedState || 'Outside Configured NER Boundary',
      isWithinNER: false,
      qualityFlags,
      userWarning: 'This location is currently outside the configured NER monitoring region. Please confirm location or use manual map pin.'
    };
  }

  // Micro district boundary check inside NER
  let resolvedDistrict: string | null = null;
  let resolvedState: string = providedState || 'North East India';

  if (lat >= 27.10 && lat <= 27.45 && lng >= 88.40 && lng <= 88.90) {
    resolvedDistrict = 'east_sikkim';
    resolvedState = 'Sikkim';
  } else if (lat >= 27.45 && lat <= 28.15 && lng >= 88.30 && lng <= 88.90) {
    resolvedDistrict = 'north_sikkim';
    resolvedState = 'Sikkim';
  } else if (lat >= 27.00 && lat <= 27.35 && lng >= 88.30 && lng <= 88.65) {
    resolvedDistrict = 'south_sikkim';
    resolvedState = 'Sikkim';
  } else if (lat >= 27.05 && lat <= 27.45 && lng >= 88.00 && lng <= 88.40) {
    resolvedDistrict = 'west_sikkim';
    resolvedState = 'Sikkim';
  } else if (lat >= 25.00 && lat <= 25.75 && lng >= 91.30 && lng <= 92.20) {
    resolvedDistrict = 'east_khasi';
    resolvedState = 'Meghalaya';
  } else if (lat >= 24.80 && lat <= 25.75 && lng >= 92.50 && lng <= 93.50) {
    resolvedDistrict = 'dima_hasao';
    resolvedState = 'Assam';
  } else if (lat >= 25.90 && lat <= 26.50 && lng >= 91.20 && lng <= 92.00) {
    resolvedDistrict = 'kamrup';
    resolvedState = 'Assam';
  }

  const cleanProvidedDistrict = (providedDistrict && providedDistrict !== 'all' && providedDistrict !== 'UNRESOLVED' && providedDistrict.trim() !== '')
    ? providedDistrict.trim().toLowerCase()
    : undefined;

  if (resolvedDistrict) {
    if (cleanProvidedDistrict && cleanProvidedDistrict !== resolvedDistrict) {
      qualityFlags.push('DISTRICT_COORDINATE_MISMATCH');
      return {
        locationResolutionStatus: 'MANUAL_CONFIRMED',
        district: cleanProvidedDistrict,
        state: resolvedState,
        isWithinNER: true,
        qualityFlags
      };
    }
    return {
      locationResolutionStatus: 'RESOLVED',
      district: resolvedDistrict,
      state: resolvedState,
      isWithinNER: true,
      qualityFlags
    };
  }

  if (cleanProvidedDistrict) {
    return {
      locationResolutionStatus: 'MANUAL_CONFIRMED',
      district: cleanProvidedDistrict,
      state: providedState || 'North East India',
      isWithinNER: true,
      qualityFlags
    };
  }

  return {
    locationResolutionStatus: 'UNRESOLVED',
    district: 'UNRESOLVED',
    state: providedState || 'North East India',
    isWithinNER: true,
    qualityFlags
  };
}
