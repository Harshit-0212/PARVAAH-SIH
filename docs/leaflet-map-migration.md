# PARVAAH Leaflet Map Migration & Architecture Note

## 1. Existing Map Implementation Found
Prior to migration, the repository contained two map approaches:
- **`src/components/gis/GisMap.tsx`**: A MapLibre GL JS (`maplibre-gl` v6.9.0) vector/raster implementation mounted in both the Citizen Safety View and EOC State Disaster Operations Console of `src/pages/DashboardPage.tsx`.
- **`src/components/MapComponent.tsx`**: An earlier prototype map layout with UI overlay controls.
- **Dependencies**: `leaflet` (^1.9.4) and `react-leaflet` (^5.0.0) with `@types/leaflet` (^1.9.22) were already present in `package.json`, but Leaflet CSS was not imported and Leaflet components were not connected to live or mock REST endpoints.

## 2. Current Data Flow & Hard-Coded Sources Found
The frontend previously read static mock objects directly into React component state:
- **`src/data/mockData.ts`**:
  - `DISTRICTS`: List of North Eastern districts (East Sikkim, East Khasi, Dima Hasao, West Kameng, Kohima, Aizawl, Imphal West).
  - `INITIAL_INCIDENTS`: Array of 5 detailed hazard incidents with embedded polygonal geometries and audit timelines.
  - `INITIAL_SENSORS`: Telemetry records for slope inclinometers and piezometers.
  - `INITIAL_SHELTERS`: Designated relief shelters with capacity, occupancy, and medical readiness.
  - `INITIAL_ROADS`: Highway corridor status records (NH-10, NH-206, NH-54, NH-13, NH-29).
  - `WEATHER_METRICS`: District rainfall totals, threshold limits, and forecast advisories.
  - `SYSTEM_ALERTS`: Emergency warning notices.
- **`src/components/gis/GisMap.tsx`**: Contained hard-coded GeoJSON LineString coordinates (lines 182–258) for NH-10, Melli Detour, NH-206, NH-13, and NH-29.
- **`src/services/api/dataIntegrationService.ts`**: Implemented an Open-Meteo live hydrology fetcher, an integration health evaluator, and an offline IndexedDB/LocalStorage sync queue.

## 3. Backend API Availability
- Draft route handlers were found in `app/api/...` targeting Next.js App Router conventions (e.g. `app/api/incidents/nearby/route.ts`).
- However, the active runtime is a **Vite + React 19** Single Page Application (`vite.config.ts`, `src/main.tsx`), with no Next.js runtime in `package.json`.
- A dedicated, lightweight REST API server (`server/index.mjs`) has been established on port 5000 to deliver standard REST endpoints:
  - `GET /api/v1/incidents`
  - `GET /api/v1/risk-zones` (GeoJSON `FeatureCollection`)
  - `GET /api/v1/roads` (GeoJSON `FeatureCollection`)
  - `GET /api/v1/shelters`
  - `GET /api/v1/weather`
  - `GET /api/v1/integrations/health`
  - `GET /api/v1/sensors`
  - `GET /api/v1/reports`

## 4. Migration Approach & Key Design Decisions
1. **Zero Breaking Changes**: Preserved all existing user flows, the 14-section `IncidentDetailDrawer`, `EvacuationModal`, `PreparednessModule`, and language toggles.
2. **Single CSS Import**: Imported `leaflet/dist/leaflet.css` exactly once in `src/main.tsx`.
3. **Custom HTML/SVG Markers**: Replaced default Leaflet marker assets with custom `DivIcon` and `CircleMarker` implementations. This avoids broken image 404 paths in Vite production builds and provides accessible, high-contrast hazard symbology.
4. **Resilient Data Layer**: Built a typed frontend API client with retry logic, timeout handling, and request cancellation (`AbortController`). If the backend server is temporarily unreachable, the map visibly alerts the operator with an error state, retry action, and an explicit `LOCAL DEMO FALLBACK (Backend Unavailable)` mode.
5. **Coordinate Safety**: Enforced strict WGS84 coordinate boundary validation (`-90 <= lat <= 90`, `-180 <= lng <= 180`). Handled Leaflet `[lat, lng]` vs GeoJSON `[lng, lat]` conversions safely. Invalid records are counted in the Dev Debug Panel and rejected without crashing.
6. **Data Truthfulness**: Records are labeled with explicit data modes (`DEMO`, `LIVE`, `HYBRID`, or `LOCAL FALLBACK`). Model risk zones display the mandatory prototype decision-support disclaimer.
7. **Developer Debug Panel**: Added a collapsible diagnostic panel active only in development mode (`import.meta.env.DEV`), displaying API endpoint status, tile loading metrics, layer item counts, and backend latency without exposing secrets.

## 5. Files Created and Changed

### New Files:
- `docs/leaflet-map-migration.md` (this migration document)
- `server/index.mjs` (Node HTTP REST API server on port 5000)
- `src/types/api.ts`
- `src/types/incident.ts`
- `src/types/geojson.ts`
- `src/types/weather.ts`
- `src/types/road.ts`
- `src/types/shelter.ts`
- `src/api/client.ts`
- `src/api/incidents.ts`
- `src/api/weather.ts`
- `src/api/risk.ts`
- `src/api/roads.ts`
- `src/api/shelters.ts`
- `src/api/sensors.ts`
- `src/api/reports.ts`
- `src/api/integrations.ts`
- `src/components/map/geoUtils.ts`
- `src/components/map/markerStyles.ts`
- `src/components/map/MapLoadingState.tsx`
- `src/components/map/MapErrorState.tsx`
- `src/components/map/MapStatusBanner.tsx`
- `src/components/map/MapLegend.tsx`
- `src/components/map/MapLayerControl.tsx`
- `src/components/map/MapFitBoundsControl.tsx`
- `src/components/map/MapSelectionHandler.tsx`
- `src/components/map/IncidentMarkerLayer.tsx`
- `src/components/map/RiskZoneLayer.tsx`
- `src/components/map/RoadLayer.tsx`
- `src/components/map/ShelterLayer.tsx`
- `src/components/map/SensorLayer.tsx`
- `src/components/map/CitizenReportLayer.tsx`
- `src/components/map/EvacuationZoneLayer.tsx`
- `src/components/map/MapDebugPanel.tsx`
- `src/components/map/DisasterMap.tsx`

### Modified Files:
- `.env.example` & `.env` & `.env.local`
- `package.json`
- `src/main.tsx`
- `src/types/index.ts`
- `src/components/gis/GisMap.tsx`
- `README.md`

## 6. Commands to Run and Test

### 1. Start the Backend REST API Server (Port 5000)
```bash
npm run server
# Responds at http://localhost:5000/api/v1/...
```

### 2. Start the Frontend Vite Dev Server
```bash
npm run dev
# Accessible at http://localhost:5173/ or http://localhost:5174/
```

### 3. Run Automated Tests
```bash
node --experimental-strip-types scripts/verifySystem.ts
```

### 4. Build and Typecheck
```bash
npm run build
```
