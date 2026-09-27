# PARVAAH Telemetry Test Results

**Date:** 2026-09-19
**Environment:** Windows development mode; Express `5000`, FastAPI `8001`, Vite `5173`.

## Checks Run

| Check                          | Endpoint / action                                               | Result                       | Evidence                                                                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime time and uptime        | `GET /api/v1/integrations/health` twice                         | PASS                         | First response: `serverTime=2026-09-19T10:11:07.578Z`, uptime `174`; second: `10:11:10.184Z`, uptime `176`.                                                                                                 |
| Initial provider truth         | Same endpoint before sync                                       | PASS                         | Open-Meteo `DEGRADED`, null attempt/success; scenario and sensor `DEMO`; IMD `DEMO`; Bhuvan/SMS `NOT_CONFIGURED`; MongoDB `DISCONNECTED`; FastAPI `CONNECTED`.                                              |
| MongoDB readiness              | `POST /api/v1/telemetry/test/mongodb`                           | PASS as a failure-state test | HTTP `200`; result `DISCONNECTED`, validation `PING_FAILED`, latency `0 ms`, safe error `MongoDB connection is not ready.` No URI or credentials exposed.                                                   |
| Open-Meteo server-side success | `POST /api/v1/telemetry/test/open-meteo` on normal backend      | PASS                         | HTTP `200`; `CONNECTED`, validation `REQUIRED_FIELDS_OK`, latency `1708 ms`; subsequent health retained actual `lastAttemptAt=2026-09-19T10:14:15.680Z` and `lastSuccessfulFetch=2026-09-19T10:14:17.387Z`. |
| Open-Meteo invalid endpoint    | Isolated backend on port `5001` with temporary invalid endpoint | PASS                         | HTTP `200`; `DEGRADED`, validation `PROVIDER_FALLBACK`, latency `24 ms`, safe error. Subsequent health retained the actual attempt and `lastError=fetch failed`, with null success time.                    |
| FastAPI healthy probe          | `POST /api/v1/telemetry/test/ml`                                | PASS                         | HTTP `200`; `CONNECTED`, validation `HEALTH_OK_MODEL_LOADED`, latency `5 ms`, model `practice-xgboost-v1`, mode `PRACTICE_XGBOOST`.                                                                         |
| FastAPI stopped                | Stop FastAPI, then `GET /api/v1/integrations/health`            | PASS                         | FastAPI provider became `ERROR`, `isLive=false`, model version `UNKNOWN`, safe unreachable error; no false `CONNECTED`. FastAPI was restarted afterward.                                                    |
| Operational telemetry          | `GET /api/v1/telemetry`                                         | PASS                         | API `UP`, actual process uptime, MongoDB `DISCONNECTED` with readiness metadata, FastAPI health check metadata, Open-Meteo attempt/success fields, null unrecorded operational events.                      |
| Frontend page                  | `http://127.0.0.1:5173/admin/telemetry`                         | PASS                         | UI rendered API Gateway, MongoDB `DISCONNECTED`, FastAPI `PRACTICE_XGBOOST`, diagnostic buttons, source-aware weather state, and `Never` for missing events.                                                |
| Static/source safety           | Response and UI inspection                                      | PASS                         | No URI, password, API key, stack trace, reporter PII, official IMD claim, physical sensor claim, or SMS dispatch claim was observed.                                                                        |

## Runtime Versus Demo Results

- Runtime-measured: Express `serverTime`, `process.uptime()`, FastAPI `/health` status/model/latency, Open-Meteo server request status/latency/timestamps, MongoDB readiness status/latency/error.
- Database-check: MongoDB status and readiness metadata. Current machine has MongoDB configured but unavailable at test time.
- Demo state: scenario engine, IMD-compatible demo dataset, and IoT sensor dataset.
- Not configured: ISRO/Bhuvan and SMS gateway.
- Configuration state: environment, data mode, enabled flags, and configured endpoint presence.

## Exact Verification Endpoints

```text
GET  http://127.0.0.1:5000/api/v1/integrations/health
GET  http://127.0.0.1:5000/api/v1/telemetry
POST http://127.0.0.1:5000/api/v1/telemetry/test/mongodb
POST http://127.0.0.1:5000/api/v1/telemetry/test/open-meteo
POST http://127.0.0.1:5000/api/v1/telemetry/test/ml
POST http://127.0.0.1:5000/api/v1/weather/sync/open-meteo
GET  http://127.0.0.1:8001/health
GET  http://127.0.0.1:5173/admin/telemetry
```

Diagnostic POST routes are development/admin-only and return `attemptedAt`, result status, latency, validation result, and safe error text.

## Exact UI Click Sequence

1. Open `http://127.0.0.1:5173/admin/telemetry`.
2. Read source badges and confirm MongoDB, Open-Meteo, and FastAPI states.
3. Click **Run MongoDB Test**. With MongoDB stopped, expect `DISCONNECTED` and `PING_FAILED`; with MongoDB running, expect `CONNECTED` only after ping succeeds.
4. Click **Run Open-Meteo Test**. Expect `CONNECTED` only after a real server-side fetch and validated response; otherwise expect `DEGRADED`.
5. Click **Run ML Test**. Expect `CONNECTED` only while FastAPI is running and its model is loaded.
6. Click **Refresh** and verify timestamps change only for actual checks/fetches. Unattempted fields remain `Never`.

## Limitations

- MongoDB could not be made available during this run, so a successful MongoDB ping was not observed; the failure behavior was verified.
- Browser automation did not expose raw secrets because the API intentionally does not return them.
- Scenario and sensor records remain synthetic by design and therefore cannot be validated as physical/live infrastructure.

## Final Confirmation

Previously hard-coded or misleading current timestamps, demo `CONNECTED` labels, invented latency/counts, browser-side Open-Meteo fallback, and generic official/agency wording were removed or reclassified. Live checks are now measured at runtime; demo/configuration/not-configured entries are visibly separated. No false `CONNECTED`, `LIVE`, `OFFICIAL`, or agency-access claims remain in the audited telemetry paths.
