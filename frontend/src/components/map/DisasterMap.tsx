/**
 * PARVAAH Primary Disaster & Hazard GIS Map
 * Built with React, TypeScript, Leaflet, and React Leaflet.
 * Features:
 * - Direct REST API integration with retry and AbortController
 * - High-precision WGS84 GeoJSON vector layers (Risk Zones, Road Corridors)
 * - Custom SVG DivIcons for hazard incidents, shelters, and sensors
 * - Truthful operational data mode status banners
 * - Invalidation on drawer transitions
 * - Dev mode diagnostic panel
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { 
  Incident, 
  RiskZoneFeatureCollection, 
  RoadFeatureCollection, 
  ShelterRecord, 
  SensorRecord, 
  CitizenReportRecord,
  Language
} from '../../types';

// API Endpoints
import { fetchIncidents } from '../../api/incidents';
import { fetchRiskZones } from '../../api/risk';
import { fetchRoads } from '../../api/roads';
import { fetchShelters } from '../../api/shelters';
import { fetchSensors } from '../../api/sensors';
import { fetchCitizenReports } from '../../api/reports';
import { API_BASE_URL, ApiError } from '../../api/client';

// Local Demo Fallback Data for Resilient Baseline
import { INITIAL_INCIDENTS, INITIAL_SENSORS, INITIAL_SHELTERS } from '../../data/mockData';

// Map Components
import { NER_DEFAULT_CENTER, NER_DEFAULT_ZOOM, isValidCoordinatePair } from './geoUtils';
import { createUserLocationIcon } from './markerStyles';
import { MapLoadingState } from './MapLoadingState';
import { MapErrorState } from './MapErrorState';
import { MapStatusBanner } from './MapStatusBanner';
import { MapLegend } from './MapLegend';
import { MapLayerControl, type LayerVisibilityState } from './MapLayerControl';
import { MapFitBoundsControl } from './MapFitBoundsControl';
import { MapSelectionHandler } from './MapSelectionHandler';
import { IncidentMarkerLayer } from './IncidentMarkerLayer';
import { RiskZoneLayer } from './RiskZoneLayer';
import { RoadLayer } from './RoadLayer';
import { ShelterLayer } from './ShelterLayer';
import { SensorLayer } from './SensorLayer';
import { CitizenReportLayer } from './CitizenReportLayer';
import { MapDebugPanel } from './MapDebugPanel';

interface DisasterMapProps {
  selectedDistrict: string;
  lang?: Language;
  onSelectIncident?: (incident: any) => void;
  onSelectShelter?: (shelter: any) => void;
  isDrawerOpen?: boolean;
  citizenReportsProp?: CitizenReportRecord[];
}

export const DisasterMap: React.FC<DisasterMapProps> = ({
  selectedDistrict,
  lang: _lang = 'en',
  onSelectIncident,
  onSelectShelter,
  isDrawerOpen = false,
  citizenReportsProp
}) => {

  // Tile Layer Configuration from Environment
  const tileUrl = 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAP_TILE_URL)
      ? import.meta.env.VITE_MAP_TILE_URL
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAP_ATTRIBUTION)
      ? import.meta.env.VITE_MAP_ATTRIBUTION
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const rawDataMode =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DATA_MODE)
      ? import.meta.env.VITE_DATA_MODE
      : 'demo';

  // Component State
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [dataMode, setDataMode] = useState<'demo' | 'live' | 'hybrid' | 'local_fallback'>(
    rawDataMode as any || 'demo'
  );
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [backendLatency, setBackendLatency] = useState<number | undefined>(undefined);
  const [backendHealth, setBackendHealth] = useState<'CONNECTED' | 'ERROR' | 'OFFLINE'>('CONNECTED');
  const [tileError, setTileError] = useState<string | null>(null);

  // Data Collections
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZoneFeatureCollection | null>(null);
  const [roads, setRoads] = useState<RoadFeatureCollection | null>(null);
  const [shelters, setShelters] = useState<ShelterRecord[]>([]);
  const [sensors, setSensors] = useState<SensorRecord[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReportRecord[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Layer Toggles
  const [layers, setLayers] = useState<LayerVisibilityState>({
    incidents: true,
    riskZones: true,
    roads: true,
    shelters: true,
    sensors: true,
    citizenReports: true,
    evacuationZones: true,
    weatherOverlay: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleLayerToggle = (key: keyof LayerVisibilityState, val: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: val }));
  };

  // Convert legacy mock data to typed Incident interface for explicit local demo fallback
  const loadLocalDemoBaseline = useCallback(() => {
    const fallbackIncidents: Incident[] = INITIAL_INCIDENTS.map((inc) => ({
      id: inc.id,
      title: inc.title,
      description: inc.description,
      hazardType: inc.hazardType.toUpperCase() as any,
      status: inc.status,
      verificationStatus: inc.verificationStatus,
      severity: inc.severity as any,
      confidence: inc.confidence,
      source: 'LOCAL FALLBACK BASELINE (Simulated Seed)',
      isDemo: true,
      isLive: false,
      createdAt: inc.createdAt,
      updatedAt: inc.updatedAt,
      coordinates: {
        latitude: inc.latitude ?? inc.coordinates[0],
        longitude: inc.longitude ?? inc.coordinates[1]
      },
      affectedGeometry: inc.affectedGeometry as any,
      district: inc.district,
      state: inc.state,
      roadStatus: inc.roadStatus === 'BLOCKED' ? 'CLOSED' : inc.roadStatus === 'SINGLE_LANE' ? 'PARTIALLY_BLOCKED' : 'OPEN',
      rainfall24hMm: inc.rainfall24h,
      soilMoisturePercent: inc.soilMoisture,
      slopeDegrees: inc.slope,
      riskScore: 85,
      evacuationRecommendation: inc.evacuationLevel,
      officialEvacuationStatus: inc.evacuationOrderStatus,
      nearestShelterId: inc.nearestShelterId,
      recommendedActions: inc.recommendedActions,
      assignedAgency: inc.assignedAgency,
      assignedOfficer: inc.assignedOfficer,
      dataFreshness: 'STALE'
    }));

    const fallbackShelters: ShelterRecord[] = INITIAL_SHELTERS.map((s) => ({
      id: s.id,
      name: s.name,
      district: s.district,
      state: s.state || 'North East India',
      coordinates: { latitude: s.coordinates[0], longitude: s.coordinates[1] },
      capacity: s.capacity,
      occupancy: s.occupied,
      contactPhone: s.contactPhone,
      medicalOfficerAvailable: s.medicalOfficerAvailable ?? true,
      generatorBackup: s.generatorBackup ?? true,
      suppliesStatus: (s.suppliesStatus as any) || 'ADEQUATE',
      isOpen: s.isOpen ?? true,
      accessibilityFeatures: s.accessibilityFeatures || [],
      source: 'Local Emergency Baseline',
      isDemo: true,
      isLive: false,
      updatedAt: new Date().toISOString(),
      dataFreshness: 'STALE'
    }));

    const fallbackSensors: SensorRecord[] = INITIAL_SENSORS.map((s) => ({
      id: s.id,
      stationName: s.stationName,
      district: s.district,
      state: s.state || 'North East India',
      coordinates: { latitude: s.coordinates[0], longitude: s.coordinates[1] },
      sensorType: 'Inclinometer / Piezometer',
      reading: s.inclinometerMm,
      unit: 'mm creep',
      thresholdStatus: s.status === 'CRITICAL' ? 'CRITICAL' : s.status === 'WARNING' ? 'WARNING' : 'NORMAL',
      observedAt: new Date().toISOString(),
      batteryPercent: s.batteryPct ?? 90,
      elevationMeters: s.elevationMeters || 1000,
      source: 'Local Telemetry Baseline',
      isDemo: true,
      isLive: false,
      updatedAt: new Date().toISOString(),
      dataFreshness: 'STALE'
    }));

    setIncidents(fallbackIncidents);
    setShelters(fallbackShelters);
    setSensors(fallbackSensors);
    setIsUsingFallback(true);
    setDataMode('local_fallback');
    setBackendHealth('OFFLINE');
    setLoading(false);
  }, []);

  // Fetch data from backend REST API
  const loadMapData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setApiError(null);
    const startT = performance.now();

    try {
      const [incRes, riskRes, roadRes, shelterRes, sensorRes, reportRes] = await Promise.all([
        fetchIncidents(selectedDistrict, { signal: controller.signal }),
        fetchRiskZones(selectedDistrict, { signal: controller.signal }),
        fetchRoads(selectedDistrict, { signal: controller.signal }),
        fetchShelters(selectedDistrict, { signal: controller.signal }),
        fetchSensors(selectedDistrict, { signal: controller.signal }),
        fetchCitizenReports(selectedDistrict, { signal: controller.signal })
      ]);

      const duration = Math.round(performance.now() - startT);
      setBackendLatency(duration);
      setBackendHealth('CONNECTED');
      setIsUsingFallback(false);
      setDataMode(rawDataMode as any || 'demo');

      setIncidents(incRes.data || []);
      setRiskZones(riskRes);
      setRoads(roadRes);
      setShelters(shelterRes.data || []);
      setSensors(sensorRes.data || []);
      setCitizenReports(reportRes.data || []);
      setLastFetchTime(new Date().toLocaleTimeString());
      setLoading(false);

    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return; // normal cancellation
      }

      console.warn('[DisasterMap] Backend telemetry fetch failed:', err);
      const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
      setBackendHealth('ERROR');
      setApiError(err instanceof ApiError ? err.message : 'Failed to connect to backend telemetry service.');
      setLoading(false);

      // In production or if explicitly configured, engage local demo baseline automatically
      if (!isDev) {
        loadLocalDemoBaseline();
      }
    }
  }, [selectedDistrict, rawDataMode, loadLocalDemoBaseline]);

  useEffect(() => {
    loadMapData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadMapData]);

  // Count invalid coordinates across incidents
  const invalidCoordCount = incidents.filter(
    (i) => !isValidCoordinatePair(i.coordinates?.latitude, i.coordinates?.longitude)
  ).length;

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl flex flex-col select-none">
      
      {/* 1. Operational Data Mode Status Banner */}
      <MapStatusBanner
        dataMode={dataMode}
        lastFetchTime={lastFetchTime}
        isOffline={typeof navigator !== 'undefined' && !navigator.onLine}
      />

      {/* 2. Top Interactive Layer Controls */}
      <div className="absolute top-10 left-4 right-14 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <MapLayerControl
          layers={layers}
          onChange={handleLayerToggle}
          counts={{
            incidents: incidents.length,
            riskZones: riskZones?.features?.length || 0,
            roads: roads?.features?.length || 0,
            shelters: shelters.length,
            sensors: sensors.length,
            citizenReports: citizenReports.length
          }}
        />
      </div>

      {/* 3. Development Diagnostic Debug Panel */}
      <MapDebugPanel
        apiBaseUrl={API_BASE_URL}
        dataMode={dataMode}
        tileUrl={tileUrl}
        tileLoaded={!tileError}
        tileError={tileError}
        incidentCount={incidents.length}
        riskZoneCount={riskZones?.features?.length || 0}
        roadCount={roads?.features?.length || 0}
        shelterCount={shelters.length}
        sensorCount={sensors.length}
        invalidCoordCount={invalidCoordCount}
        lastFetchTime={lastFetchTime}
        backendHealth={backendHealth}
        backendLatencyMs={backendLatency}
      />

      {/* 4. Main Leaflet Map Viewport */}
      <div className="relative flex-1 w-full h-full min-h-[480px]">
        <MapContainer
          center={NER_DEFAULT_CENTER}
          zoom={NER_DEFAULT_ZOOM}
          minZoom={5}
          maxZoom={18}
          scrollWheelZoom={true}
          attributionControl={true}
          style={{ height: '100%', width: '100%', minHeight: '480px' }}
          className="w-full h-full z-10"
        >
          {/* Synchronize container size on drawer animation */}
          <MapSelectionHandler isDrawerOpen={isDrawerOpen} />

          {/* Fit Bounds & Geolocation Controls (Must be inside MapContainer for useMap()) */}
          <MapFitBoundsControl
            incidents={incidents}
            onUserLocationFound={(lat, lng) => setUserLocation({ lat, lng })}
          />

          {/* Base Tile Layer */}
          <TileLayer
            url={tileUrl}
            attribution={tileAttribution}
            maxZoom={19}
            eventHandlers={{
              tileerror: () => {
                setTileError('Raster map tile server returned an error.');
              },
              load: () => {
                setTileError(null);
              }
            }}
          />

          {/* Layer A: Risk-Zone GeoJSON Polygons */}
          {layers.riskZones && (
            <RiskZoneLayer
              data={riskZones}
              onSelectZone={(zone) => {
                if (onSelectIncident) {
                  // Find related incident or trigger drawer
                  const related = incidents.find((i) => i.district === zone.zoneId?.toLowerCase());
                  if (related) onSelectIncident(related);
                }
              }}
            />
          )}

          {/* Layer B: Road Connectivity Lines */}
          {layers.roads && <RoadLayer data={roads} />}

          {/* Layer C: Incident Markers */}
          {layers.incidents && (
            <IncidentMarkerLayer
              incidents={incidents}
              onSelectIncident={(inc) => {
                if (onSelectIncident) onSelectIncident(inc);
              }}
            />
          )}

          {/* Layer D: Safe Shelters */}
          {layers.shelters && (
            <ShelterLayer
              shelters={shelters}
              onSelectShelterDestination={(sh) => {
                if (onSelectShelter) onSelectShelter(sh);
              }}
            />
          )}

          {/* Layer E: Telemetry Sensors */}
          {layers.sensors && <SensorLayer sensors={sensors} />}

          {/* Layer F: Citizen / Field Reports */}
          {layers.citizenReports && <CitizenReportLayer reports={citizenReportsProp || citizenReports} />}


          {/* User Current Geolocation Pin */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon()}
            >
              <Popup>
                <div className="text-xs font-bold text-slate-900 p-1">
                  Your Current Estimated Position
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* 6. Loading Overlay */}
        {loading && <MapLoadingState />}

        {/* 7. Error Overlay with Retry */}
        {!loading && apiError && !isUsingFallback && (
          <MapErrorState
            error={apiError}
            onRetry={loadMapData}
            onUseLocalDemo={loadLocalDemoBaseline}
            isUsingFallback={isUsingFallback}
          />
        )}

        {/* 8. Floating Operational GIS Legend */}
        <MapLegend />
      </div>
    </div>
  );
};
