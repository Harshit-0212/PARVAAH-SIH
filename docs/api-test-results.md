# PARVAAH API Test Results

**Test Executed:** 2026-09-15T20:54:00+05:30  
**Tester:** Automated node-fetch script + manual curl  
**Backend:** `npm run dev` (tsx watch) on port 5000  
**Frontend:** `npm run dev` (Vite) on port 5173, proxy `/api` → `http://localhost:5000`  
**Environment:** Windows 11, Node.js (project runtime), development mode

---

## Commands Used

```bash
# API root
curl.exe -s http://localhost:5000/api/v1

# Health check
curl.exe -s http://localhost:5000/api/v1/health

# Integrations
curl.exe -s http://localhost:5000/api/v1/integrations/health

# Batch endpoint test
node -e "Promise.all(endpoints.map(...))"

# Parameterized routes with real IDs
node -e "(async () => { const incId = ...; GET /incidents/:id; })()"

# Citizen report POST + GET verification
node -e "(async () => { POST /reports with unique clientReportId; GET /reports; find in response })()"
```

---

## Endpoint Test Results

| Endpoint | Method | Status Code | Result | Notes |
|---|---|---:|---|---|
| `/api/v1` | GET | **200** | ✅ PASS | **Root cause fixed** — was 404; now returns truthful JSON index |
| `/api/v1/health` | GET | **200** | ✅ PASS | Returns `server.status:UP`, `database.status:CONNECTED`, `dataMode:research`, `requestId` |
| `/api/v1/integrations/health` | GET | **200** | ✅ PASS | Open-Meteo CONNECTED; IMD DISABLED; MongoDB CONNECTED |
| `/api/v1/integrations/imd/test` | POST | **200** | ✅ PASS (expected) | `{ success:false, status:'DISABLED', message:'IMD_ENABLED=false' }` — truthful |
| `/api/v1/incidents` | GET | **200** | ✅ PASS | Returns demo incident array with `isDemo:true, isLive:false` |
| `/api/v1/incidents/INC-2026-081` | GET | **200** | ✅ PASS | Real ID from list response used |
| `/api/v1/incidents/INC-2026-081/timeline` | GET | **200** | ✅ PASS | Timeline events returned |
| `/api/v1/weather` | GET | **200** | ✅ PASS | Open-Meteo live data, research mode disclaimer present |
| `/api/v1/weather/forecast` | GET | **200** | ✅ PASS | Multi-day forecast |
| `/api/v1/risk-zones` | GET | **200** | ✅ PASS | GeoJSON FeatureCollection, `dataSource:DEMO_RULE_BASED` |
| `/api/v1/risk-zones/ZONE-SKM-01` | GET | **200** | ✅ PASS | Real ID from list response |
| `/api/v1/risk/calculate` | POST | **200** | ✅ PASS | `riskScore:52, riskLevel:HIGH`, prototype disclaimer present |
| `/api/v1/roads` | GET | **200** | ✅ PASS | GeoJSON FeatureCollection |
| `/api/v1/shelters` | GET | **200** | ✅ PASS | Shelter list, `isDemo:true` |
| `/api/v1/shelters/SHL-01` | GET | **200** | ✅ PASS | Real ID from list response |
| `/api/v1/sensors` | GET | **200** | ✅ PASS | Simulated sensor telemetry, `isDemo:true` |
| `/api/v1/reports` | GET | **200** | ✅ PASS | Returns 6 reports from MongoDB |
| `/api/v1/reports` | POST | **201** | ✅ PASS | Created `REP-MU2TKVRW-61811F`, immediately visible in GET |
| `/api/v1/action-guides/landslide` | GET | **200** | ✅ PASS | SOP guide returned |
| `/api/v1/NOT_A_REAL_ROUTE` | GET | **404** | ✅ PASS (correct) | `{ error: { code:'ROUTE_NOT_FOUND', message:'...', hint:'See GET /api/v1', requestId } }` |

**Total: 20/20 endpoints returned expected responses.**

---

## Database Connection Outcome

| Item | Status |
|---|---|
| MongoDB URI configured | ✅ Yes (`mongodb://127.0.0.1:27017/parvaah_db`) |
| MongoDB connection | ✅ **CONNECTED** (local instance running) |
| Health endpoint DB status | ✅ Reports `CONNECTED` |
| POST /reports persisted to MongoDB | ✅ Confirmed — ID appears in GET response |
| Demo seed reports in MongoDB | ✅ `REP-DEMO-001`, `REP-DEMO-002` present |
| Contact number masking | ✅ `987****210` pattern verified in GET response |

---

## Frontend-Backend Connection Outcome

| Item | Status |
|---|---|
| Vite proxy `/api` → `http://localhost:5000` | ✅ Configured in `vite.config.ts` |
| Frontend API base URL (`VITE_API_BASE_URL`) | ✅ Set to `/api/v1` in root `.env` (same-origin proxy) |
| `fetchIncidents()` uses backend API | ✅ (`src/api/incidents.ts` → `apiClient`) |
| `fetchCitizenReports()` uses backend API | ✅ (`src/api/reports.ts` → `apiClient`) |
| `fetchWeather()` uses backend API | ✅ (`src/api/weather.ts` → `apiClient`) |
| DashboardPage loads reports from API | ✅ `loadCitizenReports()` calls `fetchCitizenReports()` |
| DashboardPage 30-second auto-refresh | ✅ `setInterval(loadCitizenReports, 30000)` present |
| DashboardPage manual Refresh button | ✅ `handleManualSync()` wired to button |
| ApiDebugPanel shows 7 required fields | ✅ API base URL, last request, HTTP status, data mode, records loaded, active filters, last fetch time |

---

## Citizen-to-Officer Report Flow Outcome

| Step | Status |
|---|---|
| Citizen submits report via `ReportModal` | ✅ `submitCitizenReport()` → `POST /api/v1/reports` |
| POST returns HTTP 201 Created | ✅ Verified |
| Default status: `UNDER_VERIFICATION` | ✅ `verificationStatus:"UNDER_VERIFICATION"` in response |
| Report saved to MongoDB | ✅ Confirmed via GET follow-up |
| `GET /api/v1/reports` includes new report | ✅ Found `REP-MU2TKVRW-61811F` in list |
| Officer dashboard (`DashboardPage`) fetches from API | ✅ Not hard-coded arrays |
| `UNDER_VERIFICATION` reports visible to officers | ✅ Default filter shows `UNDER_VERIFICATION` |
| `Cache-Control: no-store` on reports | ✅ Set in `reports.controller.ts` |
| Citizen contact details masked in GET | ✅ `contactNumber` masked as `987****210` |
| Report NOT auto-promoted to incident/warning | ✅ Stays `UNDER_VERIFICATION` until officer action |

---

## IMD Integration Status

**Exactly as detected:** IMD is **DISABLED** (`IMD_ENABLED=false` in `backend/.env`).  
`POST /api/v1/integrations/imd/test` returns `{ success: false, status: 'DISABLED' }`.  
No fake IMD connected/live status was introduced.

---

## ML / XGBoost Status

**Exactly as detected:** The risk calculation endpoint uses a **prototype rule-based model v1** (`modelVersion: "prototype-rule-based-v1"`, `modelMode: "DEMO_RULE_BASED"`).  
There is no XGBoost or ML model deployed or claimed. The disclaimer is present in every `/api/v1/risk/calculate` response:  
> "This is a prototype decision-support advisory. It is not an official warning or evacuation order."

---

## Confirmation: No Fake "Connected/Live/Official" Status Introduced

- ❌ MongoDB **not** claimed CONNECTED unless `isDatabaseConnected()` returns true
- ❌ IMD **not** claimed CONNECTED — correctly shows DISABLED
- ❌ Open-Meteo correctly labelled as `research` / third-party, not official IMD
- ❌ Risk scores **not** labelled as official warnings or evacuation orders
- ❌ Citizen reports **not** auto-promoted to official incidents
- ❌ No secrets (keys, URIs, tokens) in any API response
