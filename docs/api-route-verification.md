# PARVAAH API Route Verification

**Generated:** 2026-09-15T20:54:00+05:30  
**Backend:** Express 4 on `http://localhost:5000`  
**Frontend Proxy:** Vite on `http://localhost:5173` → `/api` → `http://localhost:5000`  
**Data Mode:** `research` (Open-Meteo live weather; IMD disabled; MongoDB connected locally)

---

## Route Inventory

| Endpoint | Method | Route file | Tested? | Status code | Result | Data source | Notes |
|---|---|---|---|---:|---|---|---|
| `/api/v1` | GET | `backend/src/routes/index.routes.ts` | Yes | 200 | ✅ PASS | — | **NEW** — was 404 before fix |
| `/api/v1/health` | GET | `backend/src/routes/health.routes.ts` | Yes | 200 | ✅ PASS | — | Returns server UP, database CONNECTED, dataMode |
| `/api/v1/integrations/health` | GET | `backend/src/routes/integrations.routes.ts` | Yes | 200 | ✅ PASS | Mixed (CONNECTED/DEMO/NOT_CONFIGURED) | Open-Meteo CONNECTED; IMD DEMO (disabled); MongoDB CONNECTED |
| `/api/v1/integrations/imd/test` | POST | `backend/src/routes/integrations.routes.ts` | Yes | 200 | ✅ PASS (expected) | — | Returns `{ success:false, status:'DISABLED' }` — truthful; IMD_ENABLED=false |
| `/api/v1/incidents` | GET | `backend/src/routes/incidents.routes.ts` | Yes | 200 | ✅ PASS | PARVAAH Operational REST Backend (Demo Provider) | Returns demo incidents array |
| `/api/v1/incidents/:id` | GET | `backend/src/routes/incidents.routes.ts` | Yes (ID: INC-2026-081) | 200 | ✅ PASS | — | Real ID from list endpoint used |
| `/api/v1/incidents/:id/timeline` | GET | `backend/src/routes/incidents.routes.ts` | Yes (ID: INC-2026-081) | 200 | ✅ PASS | — | Real ID from list endpoint used |
| `/api/v1/weather` | GET | `backend/src/routes/weather.routes.ts` | Yes | 200 | ✅ PASS | Open-Meteo (research mode) | Real weather fetch active |
| `/api/v1/weather/forecast` | GET | `backend/src/routes/weather.routes.ts` | Yes | 200 | ✅ PASS | Open-Meteo | Multi-day forecast |
| `/api/v1/risk-zones` | GET | `backend/src/routes/risk.routes.ts` | Yes | 200 | ✅ PASS | DEMO_RULE_BASED | GeoJSON FeatureCollection |
| `/api/v1/risk-zones/:id` | GET | `backend/src/routes/risk.routes.ts` | Yes (ID: ZONE-SKM-01) | 200 | ✅ PASS | DEMO_RULE_BASED | Real ID from list endpoint used |
| `/api/v1/risk/calculate` | POST | `backend/src/routes/risk.routes.ts` | Yes | 200 | ✅ PASS | RESEARCH_MODEL (prototype-rule-based-v1) | Returns disclaimer: not an official warning |
| `/api/v1/roads` | GET | `backend/src/routes/roads.routes.ts` | Yes | 200 | ✅ PASS | GEOJSON / DEMO_DATA | GeoJSON FeatureCollection |
| `/api/v1/shelters` | GET | `backend/src/routes/shelters.routes.ts` | Yes | 200 | ✅ PASS | DEMO_DATA | Returns shelter list |
| `/api/v1/shelters/:id` | GET | `backend/src/routes/shelters.routes.ts` | Yes (ID: SHL-01) | 200 | ✅ PASS | DEMO_DATA | Real ID from list endpoint used |
| `/api/v1/sensors` | GET | `backend/src/routes/sensors.routes.ts` | Yes | 200 | ✅ PASS | DEMO_DATA | Simulated geotechnical telemetry |
| `/api/v1/reports` | GET | `backend/src/routes/reports.routes.ts` | Yes | 200 | ✅ PASS | MONGODB_CITIZEN_REPORTS | Returns live MongoDB documents |
| `/api/v1/reports` | POST | `backend/src/routes/reports.routes.ts` | Yes | 201 | ✅ PASS | MongoDB | Created REP-MU2TKVRW-61811F, visible in GET |
| `/api/v1/action-guides/landslide` | GET | `backend/src/routes/citizen-actions.routes.ts` | Yes | 200 | ✅ PASS | STATIC_DEMO | Landslide SOP returned |
| `/api/v1/NOT_A_REAL_ROUTE` | GET | `backend/src/middleware/not-found.ts` | Yes | 404 | ✅ PASS (correct error) | — | Returns `{ error: { code: 'ROUTE_NOT_FOUND', ... } }` |

---

## Parameterized Route Details

Real IDs used (extracted from live list endpoints during test run):

| Route | Real ID Used |
|---|---|
| `/api/v1/incidents/:id` | `INC-2026-081` |
| `/api/v1/incidents/:id/timeline` | `INC-2026-081` |
| `/api/v1/risk-zones/:id` | `ZONE-SKM-01` |
| `/api/v1/shelters/:id` | `SHL-01` |

---

## Data Source Labels

| Endpoint | isDemo | isLive | Source |
|---|---|---|---|
| `/api/v1/incidents` | `true` | `false` | Demo baseline |
| `/api/v1/weather` | `false` | `true` | Open-Meteo (research) |
| `/api/v1/risk-zones` | `true` | `false` | Rule-based model |
| `/api/v1/risk/calculate` | — | — | Prototype model v1 — not an official warning |
| `/api/v1/roads` | `true` | `false` | Static demo GeoJSON |
| `/api/v1/shelters` | `true` | `false` | Demo data |
| `/api/v1/sensors` | `true` | `false` | Simulated telemetry |
| `/api/v1/reports` | `true` | `false` | MongoDB (live DB, demo content) |
| `/api/v1/integrations/health` (IMD) | — | `false` | IMD DISABLED (`IMD_ENABLED=false`) |
| `/api/v1/integrations/health` (MongoDB) | — | `true` | CONNECTED locally |

---

## Secret Leakage Audit

- ✅ No MongoDB URI exposed in any response
- ✅ No Gemini API key exposed (`GEMINI_API_KEY` is frontend-only in root `.env`, not passed to any API response)
- ✅ No IMD API key in responses (key is empty string, status shows DISABLED)
- ✅ Citizen `contactNumber` is masked in GET responses (`987****210` pattern)
- ✅ Stack traces only shown in dev console log, not in HTTP responses
