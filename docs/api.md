# API Endpoints Specification — PARVAAH (SIH26191)

All primary backend endpoints are served under `/api/v1`.

## 1. System & Diagnostic Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service uptime, timestamp, data mode, and environment info |
| `GET` | `/api/v1/integrations/health` | Health & latency statuses for IMD, sensors, and database |
| `POST` | `/api/v1/integrations/imd/test` | Read-only connection probe for IMD credentials |

## 2. Hazard Incidents & Field Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/incidents` | Retrieve filtered incidents (query params: `district`, `severity`, `status`) |
| `GET` | `/api/v1/incidents/:id` | Full details for a single hazard incident record |
| `GET` | `/api/v1/incidents/:id/timeline` | Audit and verification timeline for an incident |
| `POST` | `/api/v1/reports` | Submit citizen/field report (idempotency via `clientReportId`) |
| `GET` | `/api/v1/reports` | Query existing hazard reports |

## 3. Hydrometeorological & Geospatial Telemetry

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/weather` | Normalized real-time weather readings for coordinate or district |
| `GET` | `/api/v1/weather/forecast` | Short-term precipitation & hydrology forecasts |
| `GET` | `/api/v1/sensors` | Slope inclinometer, piezometer, and soil-moisture sensor data |
| `GET` | `/api/v1/roads` | GeoJSON FeatureCollection of highway and mountain road corridor states |
| `GET` | `/api/v1/shelters` | Relief shelter locations and current capacity metrics |

## 4. Red-Zone Risk & Relocation Assessment

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/risk-zones` | GeoJSON FeatureCollection of identified hazard zones |
| `GET` | `/api/v1/risk-zones/:id` | Detailed risk profile, affected settlements, and slope factors |
| `POST` | `/api/v1/risk/calculate` | Compute multi-factor risk score for given terrain & rainfall parameters |

## 5. ML Microservice Endpoints (Port 8001)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | ML service runtime status and model loading state |
| `POST` | `/predict` | Inferences hazard probability given slope, precipitation, and geology |
| `POST` | `/relocation/urgency` | Computes priority index for habitat relocation planning |
