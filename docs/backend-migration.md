# PARVAAH Backend Architecture & Data Migration Report

This document details the architectural migration of the **PARVAAH Disaster Risk Monitoring & Early Warning System for North East India** from client-side hardcoded static data to a decoupled, production-inspired Node.js/Express TypeScript backend with Zod validation, provider abstraction layers, and transparent risk scoring.

---

## 1. Detected Frontend Stack & Baseline State

- **Application Framework**: React 19.2 + TypeScript + Vite 5.4 (SPA architecture)
- **Styling**: Tailwind CSS v4
- **GIS Cartography**: Leaflet 1.9 + React-Leaflet 5.0 (with fallback to MapLibre GL / OpenStreetMap WGS84 tile feeds)
- **Icons & UI Utilities**: Lucide-react, Zod 4.5
- **Pre-migration Backend State**: A rudimentary single-file `server/index.mjs` Node HTTP server that served hardcoded mock datasets and mistakenly labeled synthetic data as "Live Open-Meteo". It lacked TypeScript compilation, Zod schemas, structured error handlers, request correlation IDs, and proper provider separation.

---

## 2. Hardcoded Data Audit & Inventory

### A. Migrated Data Files Found in Frontend
1. `src/data/mockData.ts`:
   - `INITIAL_INCIDENTS`: 4 primary landslide/subsidence incident records.
   - `INITIAL_SENSORS`: Slope sensor records (borehole inclinometers, vibrating wire piezometers, TDR sensors).
   - `INITIAL_SHELTERS`: Community relief shelters with capacity, occupancy, and emergency facilities.
   - `INITIAL_ROADS`: Highway corridor status (NH-10, NH-206, NH-54E, NH-29).
   - `WEATHER_METRICS`: Rainfall stats and threshold saturation percentages.
   - `DISTRICTS`: North East India district metadata.
   - `SYSTEM_ALERTS`: Flash emergency notifications.
2. `server/index.mjs`:
   - In-memory arrays (`INCIDENTS_DATA`, `ROADS_GEOJSON`, `RISK_ZONES_GEOJSON`, `SHELTERS_DATA`, `SENSORS_DATA`, `WEATHER_DATA`).
3. `src/services/api/dataIntegrationService.ts`:
   - Client-side mock fallbacks and direct browser fetch requests.

### B. Consuming Components Updated
- `src/App.tsx`: Now fetches `/api/v1/incidents` dynamically on mount and district change, with local fallback. Synchronizes offline reports with `/api/v1/reports`.
- `src/pages/DashboardPage.tsx`: Connected to dynamic weather telemetry (`/api/v1/weather`) and synchronizes incident lists with backend updates.
- `src/components/incidents/IncidentDetailDrawer.tsx`: Updated to strictly display human-readable title first, ID second, and clear demo attribution (`DEMO DATA (SIMULATED)`).
- `src/pages/IntegrationHealthPage.tsx`: Connected to `GET /api/v1/integrations/health` and `POST /api/v1/integrations/imd/test`.
- `src/components/ReportModal.tsx`: Generates `clientReportId` (UUID) and sends reports to `POST /api/v1/reports`, queuing in localStorage when offline.

---

## 3. Production-Inspired Backend Architecture

```
Frontend SPA (React 19 + Leaflet GIS)
       │
       │  REST API Calls (/api/v1/*) with X-Request-Id & CORS
       ▼
Express 4 + TypeScript Application Layer
       │
       ├── Middleware: Request ID Generator, Safe Redacting Logger, Error Handler, Zod Validator
       │
       ├── Controllers: Health, Integrations, Incidents, Weather, Risk, Roads, Shelters, Sensors, Reports
       │
       ├── Services & Business Logic Layer
       │     ├── IncidentsService: Query filtering (hazard, severity, district, bbox)
       │     ├── WeatherService: Provider dispatching based on DATA_MODE
       │     ├── RiskService: Transparent weighted formula (prototype-rule-based-v1)
       │     ├── RoadsService & SheltersService: Spatial and radius-based querying
       │     ├── ReportsService: Ingestion with status UNDER_VERIFICATION and deduplication
       │     └── IntegrationHealthService: Diagnostic aggregation for all external feeds
       │
       ├── Adaptors & Providers
       │     ├── WeatherProvider: ImdDemoProvider | ImdLiveProvider (Scaffold with safety checks)
       │     ├── SensorProvider: SensorDemoProvider
       │     └── ReportStorageProvider: In-Memory & Local JSON Store with clientReportId indexing
       │
       └── Normalized Truthful Demo Data (`backend/src/data/demo/`)
             (All records tagged: isDemo: true, isLive: false, source: "DEMO_DATA")
```

---

## 4. API Endpoints Reference (`/api/v1`)

| Method | Endpoint | Description | Sample Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/health` | Service health, server time, data mode, version | None |
| `GET` | `/api/v1/integrations/health` | Diagnostics for IMD, sensors, satellite, database, SMS | None |
| `POST` | `/api/v1/integrations/imd/test` | Safe read-only diagnostic probe for IMD | None |
| `GET` | `/api/v1/incidents` | Query incidents with filters | `?district=east_sikkim&severity=CRITICAL` |
| `GET` | `/api/v1/incidents/:id` | Incident detail | `id: INC-2026-081` |
| `GET` | `/api/v1/incidents/:id/timeline` | Incident verification timeline | `id: INC-2026-081` |
| `GET` | `/api/v1/weather` | Normalized weather readings | `?district=east_khasi` or `?lat=27.33&lng=88.60` |
| `GET` | `/api/v1/weather/forecast` | Weather & hazard forecast | `?district=east_sikkim` |
| `GET` | `/api/v1/risk-zones` | GeoJSON FeatureCollection of risk zones | `?district=east_sikkim` |
| `GET` | `/api/v1/risk-zones/:id` | Risk zone factors and affected villages | `id: ZONE-SKM-01` |
| `POST` | `/api/v1/risk/calculate` | Compute dynamic rule-based risk score | JSON with rainfall, moisture, slope |
| `GET` | `/api/v1/roads` | GeoJSON FeatureCollection of road corridors | `?status=CLOSED` |
| `GET` | `/api/v1/shelters` | Relief shelters with radius search | `?lat=27.33&lng=88.61&radiusKm=25` |
| `GET` | `/api/v1/shelters/:id` | Shelter detail by ID | `id: SHL-01` |
| `GET` | `/api/v1/sensors` | Slope sensor telemetry | `?district=east_sikkim` |
| `POST` | `/api/v1/reports` | Submit citizen/field report | Zod validated payload with `clientReportId` |
| `GET` | `/api/v1/reports` | Retrieve submitted reports (sanitized) | `?district=east_sikkim` |
| `GET` | `/api/v1/action-guides/:hazardType` | Safety checklists (landslide, flood, cyclone) | `:hazardType = landslide` |
| `GET` | `/api/v1/scenarios` | List preset & custom college drill scenarios | None |
| `POST` | `/api/v1/scenarios` | Create custom scenario | JSON with rainfall, slope, soil moisture, etc. |
| `POST` | `/api/v1/scenarios/:id/activate` | Activate scenario with auto-expiry | `{ durationMinutes: 30, operator: 'Admin' }` |
| `POST` | `/api/v1/scenarios/:id/deactivate` | Deactivate simulation and restore baseline | None |
| `POST` | `/api/v1/weather/sync/open-meteo` | Trigger server-side sync with Open-Meteo API | `{ lat?: number, lng?: number }` |

---

## 5. Multi-Provider Weather Architecture & Safety Gates

While official India Meteorological Department (IMD) API access credentials and clearance are pending, PARVAAH employs a multi-provider weather engine with strict attribution safeguards:

```
WeatherProvider (Interface)
  ├── ImdDemoProvider         (IMD-compatible baseline demo data)
  ├── ImdLiveProvider         (Real IMD API integration - pending credentials)
  ├── OpenMeteoProvider       (Open-Meteo numerical weather model - research mode)
  └── ScenarioWeatherProvider (In-memory & MongoDB college demonstration simulator)
```

### Safety Rules & Guardrails:
1. **Never Label Non-IMD Data as IMD or Official**:
   - Every provider returns `isOfficialWarning: false` for all Open-Meteo forecasts and simulated scenarios.
   - Alternate data sources are explicitly marked with `sourceType: "OPEN_METEO_FORECAST"` or `sourceType: "SIMULATED_SCENARIO"`.
2. **Standardized Frontend Badges**:
   The user interface displays exactly one of the three verified badges:
   - `SIMULATED SCENARIO — College demonstration only`
   - `THIRD-PARTY WEATHER DATA — Research/demo use; not an IMD warning`
   - `OFFICIAL IMD WEATHER DATA — Check source and validity time`
3. **Server-Side Only Open-Meteo Integration**:
   - Calls to Open-Meteo are executed exclusively on the backend (`OpenMeteoProvider`), never directly from browser clients.
   - Built-in in-memory TTL caching (default 30 min) and last-successful-fetch fallback prevent upstream throttling.
   - Daily 24-hour and 72-hour precipitation values are calculated by summing hourly numerical predictions.
4. **Interactive College Drill Simulator**:
   - 5 pre-configured drill scenarios (Normal, Heavy Rain, Critical Landslide, Flash Flood, Cyclone).
   - Dynamic parameter controls (rainfall, slope angle, soil moisture, road closures).
   - Auto-expiry timer (15, 30, 60 minutes) to automatically revert to baseline after a classroom demonstration.
   - Dynamic risk recalculation: when a scenario is active, the risk engine automatically updates the risk scores and GeoJSON zones for the affected district.

---

## 6. Transparent Risk Engine Formula

The prototype risk scoring engine calculates a 0–100 risk score using a weighted, transparent linear model:

$$\text{Risk Score} = 0.30 \times \text{Rainfall}_{24\text{h}} + 0.20 \times \text{Forecast} + 0.20 \times \text{Soil Moisture} + 0.15 \times \text{Slope} + 0.10 \times \text{Historical Susceptibility} + 0.05 \times \text{Field Reports}$$

- **0–24**: LOW (No immediate action)
- **25–49**: MODERATE (Advisory caution)
- **50–74**: HIGH (Advisory evacuation recommendation)
- **75–100**: CRITICAL (Mandatory evacuation recommendation)

### Operational Safety Guardrail
The risk engine outputs `evacuationRecommendation`. It is **strictly prohibited** from mutating `officialEvacuationStatus` to `MANDATORY_EVACUATION_ORDERED`. Only authorized District Magistrates (DM) and State Disaster Management Authorities (SDMA) have legal authority to issue mandatory evacuation orders.

---

## 7. How to Run Frontend and Backend

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (optional - automatic in-memory demo store fallback active)

### Running the System
```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Run backend automated test suite (verifies all 13 unit & scenario tests)
npm run server:test

# 3. Build backend and frontend
npm run server:build
npm run build

# 4. Start backend in development mode (port 5000)
npm run server

# 5. In a separate terminal, start frontend (port 5173)
npm run dev

# Or run both concurrently
npm run dev:all
```
