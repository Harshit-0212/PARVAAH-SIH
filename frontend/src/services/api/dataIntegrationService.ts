/**
 * PARVAAH Data Integration & Reliability Layer
 * Provides robust telemetry fetching, timeout handling, exponential backoff,
 * response validation, last-successful caching, and integration health metrics.
 */

export type IntegrationStatus = 
  | 'CONNECTED' 
  | 'LOADING' 
  | 'RATE_LIMITED' 
  | 'UNAUTHORIZED' 
  | 'TIMEOUT' 
  | 'INVALID_RESPONSE' 
  | 'OFFLINE' 
  | 'STALE' 
  | 'DEMO_FALLBACK';

export interface TelemetryReading<T = number> {
  provider: string;
  metric: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  observedAt: string;
  receivedAt: string;
  value: T;
  unit: string;
  quality: 'HIGH' | 'ESTIMATED' | 'SYNTHETIC';
  sourceUrl: string;
  isLive: boolean;
  isDemo: boolean;
  error?: string;
}

export interface ProviderHealthReport {
  id: string;
  name: string;
  category: 'Weather / Hydrology' | 'Basemap Tiles' | 'Emergency SMS' | 'Database' | 'Satellite Telemetry';
  endpoint: string;
  status: IntegrationStatus;
  latencyMs: number;
  lastSuccessfulSync: string | null;
  recordsReceived: number;
  dataAgeMinutes: number;
  lastError: string | null;
  isLive: boolean;
  configurationGuide: string;
  isConfigured: boolean;
  sourceType?: 'LIVE_CHECK' | 'DATABASE_CHECK' | 'CONFIGURATION' | 'DEMO' | 'NOT_CONFIGURED';
}

// Memory Cache for last successful responses
const telemetryCache: Record<string, { data: any; timestamp: number }> = {};

/**
 * Robust fetch wrapper with timeout, exponential backoff, and offline awareness
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 2,
  timeoutMs = 7000
): Promise<Response> {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error('Device is offline. Using local cached telemetry.');
  }

  let attempt = 0;
  let delay = 500;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        throw new Error('Rate limit exceeded (HTTP 429)');
      }
      if (response.status === 401 || response.status === 403) {
        // Do not retry authorization failures
        return response;
      }
      if (response.ok || attempt === maxRetries) {
        return response;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      if (attempt === maxRetries) {
        throw err;
      }
    }

    attempt++;
    await new Promise(r => setTimeout(r, delay));
    delay *= 2; // exponential backoff
  }

  throw new Error('Maximum retry attempts exhausted.');
}

/**
 * Fetch live hydrology & precipitation observation from Open-Meteo High-Resolution API.
 * This is live, free, real-time data across all coordinates in North East India.
 */
export async function fetchLiveRainfallTelemetry(
  latitude: number,
  longitude: number
): Promise<{ reading: TelemetryReading<{ past24hMm: number; past1hMm: number; temperatureC: number }>; status: IntegrationStatus }> {
  const cacheKey = `rainfall-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  const now = Date.now();

  // Return cached data if younger than 5 minutes
  if (telemetryCache[cacheKey] && now - telemetryCache[cacheKey].timestamp < 300000) {
    return {
      reading: telemetryCache[cacheKey].data,
      status: 'CONNECTED',
    };
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=precipitation,rain&current=precipitation,temperature_2m&timezone=Asia%2FKolkata`;

  try {
    const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } }, 1, 6000);

    if (!res.ok) {
      if (res.status === 429) {
        return handleFallback(cacheKey, 'RATE_LIMITED', 'Rate limited by weather provider');
      }
      return handleFallback(cacheKey, 'INVALID_RESPONSE', `Provider returned HTTP ${res.status}`);
    }

    const payload = await res.json();
    const current = payload.current;
    const hourlyRain: number[] = payload.hourly?.rain?.slice(0, 24) || [];
    const sum24h = hourlyRain.reduce((acc, val) => acc + (val || 0), 0);

    const reading: TelemetryReading<{ past24hMm: number; past1hMm: number; temperatureC: number }> = {
      provider: 'Open-Meteo High-Resolution Hydrology (Live)',
      metric: 'Rainfall & Surface Temperature',
      location: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
      coordinates: [latitude, longitude],
      observedAt: current?.time || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      value: {
        past24hMm: Number(sum24h.toFixed(1)),
        past1hMm: current?.precipitation ?? 0,
        temperatureC: current?.temperature_2m ?? 20,
      },
      unit: 'mm / °C',
      quality: 'HIGH',
      sourceUrl: 'https://open-meteo.com',
      isLive: true,
      isDemo: false,
    };

    telemetryCache[cacheKey] = { data: reading, timestamp: now };
    return { reading, status: 'CONNECTED' };
  } catch (err: any) {
    console.warn(`[DataIntegration] Telemetry fetch notice: ${err.message}`);
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    return handleFallback(
      cacheKey,
      isOffline ? 'OFFLINE' : 'DEMO_FALLBACK',
      err.message || 'Network failure reaching meteorological provider'
    );
  }
}

function handleFallback(
  cacheKey: string,
  fallbackStatus: IntegrationStatus,
  errorMsg: string
) {
  // If we have any cached data even if older, return as STALE
  if (telemetryCache[cacheKey]) {
    return {
      reading: {
        ...telemetryCache[cacheKey].data,
        isDemo: true,
        error: errorMsg,
        quality: 'ESTIMATED' as const,
      },
      status: 'STALE' as IntegrationStatus,
    };
  }

  // Seeded realistic fallback
  const simulatedReading: TelemetryReading<{ past24hMm: number; past1hMm: number; temperatureC: number }> = {
    provider: 'Simulated Hydrological Fallback (Regional Model)',
    metric: 'Rainfall & Surface Temperature',
    location: 'North East India Regional Grid',
    coordinates: [26.90, 88.47],
    observedAt: new Date(Date.now() - 3600000).toISOString(),
    receivedAt: new Date().toISOString(),
    value: {
      past24hMm: 142.5,
      past1hMm: 12.0,
      temperatureC: 19.5,
    },
    unit: 'mm / °C',
    quality: 'SYNTHETIC',
    sourceUrl: 'local://simulated-hydrology',
    isLive: false,
    isDemo: true,
    error: errorMsg,
  };

  return { reading: simulatedReading, status: fallbackStatus };
}

/**
 * Diagnostic health check across all system integrations
 */
export async function testAllIntegrations(): Promise<ProviderHealthReport[]> {
  const reports: ProviderHealthReport[] = [];

  // 1. Open-Meteo Weather API
  const startWeather = performance.now();
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=26.90&longitude=88.47&current=temperature_2m', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const latWeather = Math.round(performance.now() - startWeather);
    reports.push({
      id: 'open-meteo',
      name: 'Open-Meteo Live Hydrological API',
      category: 'Weather / Hydrology',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      status: res.ok ? 'CONNECTED' : 'INVALID_RESPONSE',
      latencyMs: latWeather,
      lastSuccessfulSync: res.ok ? 'Just now' : null,
      recordsReceived: res.ok ? 24 : 0,
      dataAgeMinutes: 1,
      lastError: res.ok ? null : `HTTP ${res.status}`,
      isLive: true,
      isConfigured: true,
      configurationGuide: 'Free open meteorological data. No API key required for non-commercial disaster monitoring.',
    });
  } catch (err: any) {
    reports.push({
      id: 'open-meteo',
      name: 'Open-Meteo Live Hydrological API',
      category: 'Weather / Hydrology',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      status: 'OFFLINE',
      latencyMs: 0,
      lastSuccessfulSync: null,
      recordsReceived: 0,
      dataAgeMinutes: 60,
      lastError: err.message,
      isLive: false,
      isConfigured: true,
      configurationGuide: 'Check internet connection or CORS settings.',
    });
  }

  // 2. OpenStreetMap / MapLibre Tile Server
  const startTile = performance.now();
  try {
    const res = await fetch('https://tile.openstreetmap.org/6/48/28.png', { method: 'HEAD' });
    const latTile = Math.round(performance.now() - startTile);
    reports.push({
      id: 'osm-tiles',
      name: 'OpenStreetMap Tile Gateway (MapLibre Basemap)',
      category: 'Basemap Tiles',
      endpoint: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      status: res.ok ? 'CONNECTED' : 'INVALID_RESPONSE',
      latencyMs: latTile,
      lastSuccessfulSync: res.ok ? 'Just now' : null,
      recordsReceived: res.ok ? 1 : 0,
      dataAgeMinutes: 0,
      lastError: null,
      isLive: true,
      isConfigured: true,
      configurationGuide: 'Ensure VITE_MAP_TILE_URL or VITE_MAP_STYLE_URL is accessible and compliant with tile usage policy.',
    });
  } catch (err: any) {
    reports.push({
      id: 'osm-tiles',
      name: 'OpenStreetMap Tile Gateway (MapLibre Basemap)',
      category: 'Basemap Tiles',
      endpoint: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      status: 'DEMO_FALLBACK',
      latencyMs: 0,
      lastSuccessfulSync: null,
      recordsReceived: 0,
      dataAgeMinutes: 30,
      lastError: err.message,
      isLive: false,
      isConfigured: true,
      configurationGuide: 'System automatically enables offline SVG terrain canvas when tiles are unreachable.',
    });
  }

  // 3. IMD (India Meteorological Department) Gateway
  reports.push({
    id: 'imd-radar',
    name: 'India Meteorological Department (IMD) Gateway',
    category: 'Weather / Hydrology',
    endpoint: 'https://api.imd.gov.in/v1/rainfall',
    status: 'DEMO_FALLBACK',
    latencyMs: 0,
    lastSuccessfulSync: null,
    recordsReceived: 0,
    dataAgeMinutes: 120,
    lastError: 'IMD_API_KEY not configured in environment. Using simulated radar layer.',
    isLive: false,
    isConfigured: false,
    configurationGuide: 'Obtain authorized credentials from IMD Data Center and set IMD_API_KEY and IMD_API_BASE_URL.',
  });

  // 4. CDAC Emergency SMS & National Disaster Gateway
  reports.push({
    id: 'cdac-sms',
    name: 'CDAC Emergency SMS Alert Gateway',
    category: 'Emergency SMS',
    endpoint: 'https://mgov.gov.in/api/sms',
    status: 'DEMO_FALLBACK',
    latencyMs: 0,
    lastSuccessfulSync: null,
    recordsReceived: 0,
    dataAgeMinutes: 0,
    lastError: 'Development Test Mode active: Real live SMS dispatch disabled for safety.',
    isLive: false,
    isConfigured: false,
    configurationGuide: 'Set CDAC_SMS_USERNAME, CDAC_SMS_PASSWORD, and CDAC_SMS_SENDER_ID for official district deployment.',
  });

  // 5. ISRO Bhuvan Spatial Geoportal
  reports.push({
    id: 'isro-bhuvan',
    name: 'ISRO Bhuvan High-Resolution Hill Imagery',
    category: 'Satellite Telemetry',
    endpoint: 'https://bhuvan-app1.nrsc.gov.in/bhuvan2d',
    status: 'DEMO_FALLBACK',
    latencyMs: 0,
    lastSuccessfulSync: null,
    recordsReceived: 0,
    dataAgeMinutes: 240,
    lastError: 'BHUVAN_ISRO_API_KEY awaiting agency clearance.',
    isLive: false,
    isConfigured: false,
    configurationGuide: 'Register on Bhuvan Open Web Services portal for institutional geospatial key.',
  });

  // 6. Local Storage / Device Sync Engine
  const offlineQueueCount = getOfflineReportQueue().length;
  reports.push({
    id: 'device-sync',
    name: 'Field Device Offline Storage & Sync Queue',
    category: 'Database',
    endpoint: 'browser://indexeddb-localstorage-parvaah-queue',
    status: 'CONNECTED',
    latencyMs: 1,
    lastSuccessfulSync: 'Active',
    recordsReceived: offlineQueueCount,
    dataAgeMinutes: 0,
    lastError: null,
    isLive: true,
    isConfigured: true,
    configurationGuide: 'Automatic local persistence with zero-data-loss synchronization on reconnect.',
  });

  return reports;
}

/**
 * Offline citizen & field report queue utilities
 */
export function getOfflineReportQueue(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('parvaah_offline_reports_queue');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReportToOfflineQueue(report: any): void {
  if (typeof window === 'undefined') return;
  const current = getOfflineReportQueue();
  current.push({
    ...report,
    queuedAt: new Date().toISOString(),
    syncStatus: 'PENDING_OFFLINE',
  });
  localStorage.setItem('parvaah_offline_reports_queue', JSON.stringify(current));
}

export function clearOfflineQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('parvaah_offline_reports_queue');
}
