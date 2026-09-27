# PARVAAH Telemetry Truth Audit

**Date:** 2026-09-19
**Scope:** Express `/api/v1/integrations/health`, `/api/v1/telemetry`, the integration-health UI, operational telemetry UI, and provider health implementations.

## Classification

- `RUNTIME_MEASURED`: generated from this running process or an actual local runtime event.
- `LIVE_PROVIDER_CHECK`: an actual server-to-server provider request was attempted and validated.
- `DATABASE_CHECK`: a real database readiness/ping operation.
- `CONFIGURATION_STATE`: derived only from enabled flags, URLs, or credentials.
- `DEMO_STATE`: synthetic/static demonstration state.
- `STATIC_COPY`: explanatory text, not a measurement.
- `UNKNOWN`: not safe to present as an operational fact.

## Aggregate Integration Health

| Field                         | Creator                                                 | Category                                                                   | Evidence / safety                                                                                                              | Correction                                     |
| ----------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `status`                      | `integration-health.service.ts:getAllIntegrationHealth` | `RUNTIME_MEASURED`                                                         | Aggregated from provider states and current FastAPI/database checks. Safe when source states are truthful.                     | Do not infer health from configuration alone.  |
| `serverTime`                  | same function                                           | `RUNTIME_MEASURED`                                                         | `new Date().toISOString()` during the request. Safe as response generation time.                                               | None.                                          |
| `uptimeSeconds`               | same function                                           | `RUNTIME_MEASURED`                                                         | `process.uptime()` from the Express process. Safe.                                                                             | None.                                          |
| `environment`, `dataMode`     | same function / `config/env.ts`                         | `CONFIGURATION_STATE`                                                      | Loaded from validated environment configuration. Safe if labelled configuration.                                               | Never call these live status.                  |
| provider `name`, `configured` | provider health / integration service                   | `CONFIGURATION_STATE` or `DEMO_STATE`                                      | Name and enabled flags are local metadata.                                                                                     | Display with source/type badge.                |
| provider `status`, `isLive`   | each provider health implementation                     | `LIVE_PROVIDER_CHECK`, `DATABASE_CHECK`, `DEMO_STATE`, or `NOT_CONFIGURED` | Status is now tied to an actual check for live providers, a ping for MongoDB, and explicit demo/configuration state otherwise. | No fallback to `CONNECTED`.                    |
| `lastSuccessfulFetch`         | Open-Meteo, MongoDB health                              | `LIVE_PROVIDER_CHECK` or `DATABASE_CHECK`                                  | Set only after a successful validated request or ping. Null before first success.                                              | Never populate on page load.                   |
| `lastAttemptAt`               | Open-Meteo, MongoDB diagnostic                          | `LIVE_PROVIDER_CHECK` or `DATABASE_CHECK`                                  | Set only when a request/ping starts. Demo providers leave it null.                                                             | Never use current page-open time.              |
| `dataAgeMinutes`              | Open-Meteo                                              | `LIVE_PROVIDER_CHECK`                                                      | Calculated from the actual last successful fetch. Null before first request.                                                   | Never use `0` for “not attempted.”             |
| `latencyMs`                   | Open-Meteo, MongoDB, ML                                 | `LIVE_PROVIDER_CHECK` or `DATABASE_CHECK`                                  | Measured around the actual request/ping.                                                                                       | None.                                          |
| `lastError`                   | providers and checks                                    | `LIVE_PROVIDER_CHECK` or `DATABASE_CHECK`                                  | Safe, redacted diagnostic text; no URI, credentials, or stack.                                                                 | Keep previous successful timestamp on failure. |
| `sourceType`                  | provider health                                         | `CONFIGURATION_STATE`                                                      | Explicit `LIVE_CHECK`, `DATABASE_CHECK`, `DEMO`, or `NOT_CONFIGURED`.                                                          | Render as a visible badge.                     |

## Provider Audit

### Open-Meteo

**Implementation:** `backend/src/providers/weather/open-meteo.provider.ts`, `OpenMeteoProvider.getCurrentWeather`, `getHealth`, and `syncNow`; `weather.service.ts:syncOpenMeteo`; `routes/weather.routes.ts` and `weather.controller.ts`.

- `CONNECTED` is now possible only after a server-side HTTP success and Zod validation of the required response structure.
- `lastAttemptAt` is recorded immediately before the actual request.
- `lastSuccessfulFetch` changes only after validation and normalized record creation.
- Timeout/network/HTTP/schema errors produce `DEGRADED`, retain the old success time, and expose a safe error.
- Cache reads do not create a fake attempt or success.
- `POST /api/v1/weather/sync/open-meteo` calls `syncNow`, which bypasses the cache and performs a controlled server-side request.
- Copy is explicitly third-party research/demo forecast data and not an official IMD warning.
- Browser direct Open-Meteo fallback was removed from `IntegrationHealthPage`.

### Scenario simulator

**Implementation:** `scenario-weather.provider.ts:getHealth`.

- Always `status: DEMO`, `isLive: false`, and no fetch timestamps.
- `details` includes `initializedAt`, active scenario ID/name, active boolean, `lastActionAt`, and preconfigured scenario count.
- Scenario weather records are synthetic and must remain labelled `DEMO`.

### IMD

**Implementation:** `imd-demo.provider.ts:getHealth`, `imd-live.provider.ts:getHealth`, and `integrations.controller.ts:testImdConnection`.

- With `IMD_ENABLED=false`: `configured:false`, `status:DEMO`, `isLive:false`, no fetch timestamps, and a message separating the demo dataset from official access.
- With live credentials absent: `NOT_CONFIGURED`, no fake timestamps.
- The live provider has no implemented official endpoint/parser and therefore never claims a successful IMD request.

### IoT sensors

**Implementation:** `sensor-demo.provider.ts:getHealth`.

- `status:DEMO`, `isLive:false`, `source:DEMO_SENSOR`, null attempt/success timestamps.
- Message: `Simulated sensor data for college demonstration; no physical sensor network connected.`

### MongoDB

**Implementation:** `config/db.ts:checkDatabaseHealth`, `integration-health.service.ts`, and `telemetry.routes.ts`.

- `NOT_CONFIGURED` only when the URI is absent.
- `CONNECTED` only when Mongoose is ready and `db.command({ ping: 1 })` succeeds.
- `DISCONNECTED` when configured but no ready connection exists; `ERROR` when ping fails.
- Response contains checked time, measured latency, and safe error text. URI, host credentials, and stack traces are never returned.

### ISRO/Bhuvan

**Implementation:** static entry in `integration-health.service.ts`.

- `NOT_CONFIGURED`, `isLive:false`, null timestamps and null data age.
- Message does not claim agency clearance or access.

### SMS gateway

**Implementation:** static entry in `integration-health.service.ts`.

- `NOT_CONFIGURED`, `isLive:false`, null timestamps and null data age.
- Message: `Live alert dispatch disabled in development. Test alerts only; no public messages sent.`

### FastAPI/XGBoost

**Implementation:** `ml.service.ts:checkHealth/getHealthTelemetry`, `integration-health.service.ts`, `telemetry.routes.ts`.

- Every aggregate health request performs a server-to-server `GET /health`.
- `CONNECTED` requires HTTP success, `ok`, and `modelLoaded`.
- Unreachable/stopped service reports `ERROR` in integration health and `UNAVAILABLE` in diagnostic results.
- Model version/mode/loaded state, last check time, and measured latency are included.
- Copy identifies the model as a practice synthetic model, not production or official NER intelligence.

## Telemetry Endpoints and UI

- `GET /api/v1/integrations/health`: provider inventory with source/type metadata.
- `GET /api/v1/telemetry`: API runtime, MongoDB ping state, FastAPI health probe, weather timestamps, operational timestamps, and safe errors.
- `POST /api/v1/weather/sync/open-meteo`: controlled server-side Open-Meteo sync.
- `POST /api/v1/telemetry/test/mongodb`
- `POST /api/v1/telemetry/test/open-meteo`
- `POST /api/v1/telemetry/test/ml`

Diagnostic POST actions are allowed only in development or for a request carrying `x-user-role: admin`. Each returns `attemptedAt`, status, measured latency, validation outcome, and safe error text.

`IntegrationHealthPage` and `OperationalTelemetryPage` no longer claim browser-side provider connectivity. They display `LIVE CHECK`, `DATABASE CHECK`, `CONFIGURATION`, `DEMO`, or `NOT CONFIGURED` badges and show `Never`/null where no real attempt occurred.

## Operational Telemetry Field Inventory

| Field                                                                            | Creator                                      | Category                                            | Evidence / correction                                                                                                        |
| -------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `service`                                                                        | `telemetry.routes.ts`                        | `STATIC_COPY`                                       | Console title only; safe.                                                                                                    |
| `timestamp`                                                                      | `telemetry.routes.ts`                        | `RUNTIME_MEASURED`                                  | Request response time, not provider fetch time. Safe when labelled response time.                                            |
| `apiHealth.status`                                                               | `telemetry.routes.ts`                        | `RUNTIME_MEASURED`                                  | Express handler is executing; safe as API process availability.                                                              |
| `apiHealth.uptimeSeconds`                                                        | `telemetry.routes.ts`                        | `RUNTIME_MEASURED`                                  | `process.uptime()`, never a sample counter.                                                                                  |
| `apiHealth.serverPort`                                                           | `env.ts` / server config                     | `CONFIGURATION_STATE`                               | Configured listening port, not a network probe.                                                                              |
| `database.status`                                                                | `checkDatabaseHealth`                        | `DATABASE_CHECK`                                    | Mongoose ready state plus MongoDB ping.                                                                                      |
| `database.checkedAt`                                                             | `checkDatabaseHealth`                        | `DATABASE_CHECK`                                    | Time of this readiness evaluation.                                                                                           |
| `database.latencyMs`                                                             | `checkDatabaseHealth`                        | `DATABASE_CHECK`                                    | Ping/readiness elapsed time.                                                                                                 |
| `database.lastError`                                                             | `checkDatabaseHealth`                        | `DATABASE_CHECK`                                    | Safe fixed error text; no URI or stack.                                                                                      |
| `database.metrics.totalCitizenReports`                                           | telemetry route                              | `DATABASE_CHECK` or fallback runtime count          | MongoDB count only when ready; otherwise in-memory demo count. UI should show fallback state alongside it.                   |
| `database.metrics.totalPredictionsLogged` and `totalScenarios`                   | telemetry route                              | `DATABASE_CHECK`                                    | MongoDB counts when connected; zero fallback when unavailable. Not presented as durable database counts while disconnected.  |
| `fastApiMl.isAvailable`, `modelLoaded`                                           | `ml.service.ts:checkHealth`                  | `LIVE_PROVIDER_CHECK`                               | Actual server-to-server `GET /health`.                                                                                       |
| `fastApiMl.modelVersion`, `modelMode`, `disclaimer`                              | FastAPI `/health` response                   | `LIVE_PROVIDER_CHECK` plus `STATIC_COPY` disclaimer | Safe model metadata; mode explicitly practice synthetic.                                                                     |
| `fastApiMl.lastHealthCheckAt`, `healthLatencyMs`, `lastHealthError`              | `MlService.getHealthTelemetry`               | `LIVE_PROVIDER_CHECK`                               | Actual probe timestamp/latency/error.                                                                                        |
| `fastApiMl.lastPrediction*`                                                      | `PredictionHistoryModel` record              | `DATABASE_CHECK`                                    | Null when no successful persisted prediction exists.                                                                         |
| `weatherProviders.imd.*`                                                         | IMD demo/live provider health                | `DEMO_STATE` or `CONFIGURATION_STATE`               | No timestamps when disabled; no official claim.                                                                              |
| `weatherProviders.openMeteo.status`, `isLive`                                    | Open-Meteo provider health                   | `LIVE_PROVIDER_CHECK`                               | Actual validated fetch required for `CONNECTED`.                                                                             |
| `weatherProviders.openMeteo.lastSync`, `lastAttemptAt`, `lastError`, `latencyMs` | Open-Meteo provider state                    | `LIVE_PROVIDER_CHECK`                               | Success, attempt, error, and elapsed time have separate meanings and null before attempts.                                   |
| `activeScenario.*`                                                               | `scenarioWeatherProvider.getActiveScenario`  | `DEMO_STATE`                                        | Active drill values are synthetic and carry a demo disclaimer.                                                               |
| `operationalTimestamps.lastWeatherSync`                                          | Open-Meteo successful fetch / explicit event | `LIVE_PROVIDER_CHECK`                               | Null until a real sync occurs.                                                                                               |
| `operationalTimestamps.lastPrediction`                                           | persisted prediction record                  | `DATABASE_CHECK`                                    | Null until a prediction is recorded.                                                                                         |
| `operationalTimestamps.lastCitizenReport`                                        | persisted citizen report record              | `DATABASE_CHECK`                                    | Null until a report exists.                                                                                                  |
| `operationalTimestamps.lastRiskRecalculation`                                    | explicit recalculation event                 | `RUNTIME_MEASURED`                                  | Null until a recalculation event; no current-time substitution.                                                              |
| `recentSafeErrors`                                                               | telemetry route                              | `RUNTIME_MEASURED`                                  | Currently empty because no bounded safe error ring is wired; provider-specific safe errors remain available in their fields. |
| `requestId`                                                                      | request ID middleware                        | `RUNTIME_MEASURED`                                  | Per-request correlation identifier; contains no secret.                                                                      |

## Previously Hard-Coded or Misleading Values

- Integration health stamped scenario, sensor, IMD demo, and MongoDB entries with the current time on every health page request.
- Scenario health reported `CONNECTED` when active.
- MongoDB health used the presence of `MONGODB_URI` and reported demo state rather than ping readiness.
- Open-Meteo returned `CONNECTED` after an earlier success even when a later request failed, and used `0` data age before any request.
- Sensor copy claimed active regional stations despite synthetic data.
- Satellite error copy implied pending agency clearance.
- UI invented `95 ms`, record counts, and “Active (Demo Telemetry)” labels.
- Browser-side Open-Meteo fallback bypassed the server-side health contract.
- Telemetry substituted current time for missing weather/recalculation events.

These values are now runtime checks, explicit configuration state, or labelled demo state. No false `CONNECTED`, `LIVE`, `OFFICIAL`, or agency-access claim is intentionally emitted by these paths.
