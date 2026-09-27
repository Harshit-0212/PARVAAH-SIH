# ML Dashboard Wiring Test Results

**Date:** 2026-09-19

## Files Added or Modified

- Added `src/pages/RiskSimulatorPage.tsx`.
- Added `src/pages/OperationalTelemetryPage.tsx`.
- Wired `src/App.tsx` and `src/components/Navbar.tsx` for dashboard page states and admin deep links.
- Wired Clear State confirmation and backend reset call in `src/App.tsx`.
- Replaced the admin browser alert claim with a local test-alert preview in `src/pages/DashboardPage.tsx`.
- Removed unused declarations that blocked the existing production build.
- Updated `docs/ml-dashboard-wiring-audit.md`.

## Automated Verification

| Check                                                            | Result                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `npm run build`                                                  | PASS: TypeScript and Vite production build completed |
| `npm.cmd --prefix backend test`                                  | PASS: automated backend suite completed successfully |
| `python ml-service/predict_once.py` with system Python           | Blocked before repair: `numpy` was missing           |
| `ml-service/.venv/Scripts/python.exe ml-service/predict_once.py` | PASS                                                 |

## Practice Model Output

- Critical sample: probability `0.9320`, score `93`, level `CRITICAL`.
- Low sample: probability `0.0472`, score `5`, level `LOW`.
- Model version: `practice-xgboost-v1`.
- Disclaimer: synthetic practice output only; not a real warning or evacuation decision.

## Final Functional States

- Risk Simulator: functional; presets, six inputs, API calculation, factor bars, model metadata, safety recommendation, scenario save, and Leaflet preview are wired.
- Telemetry Health: functional; API, MongoDB, FastAPI ML, weather provider, active scenario, counts, and operational timestamps are displayed without secrets or reporter PII.
- Citizen report submission: existing POST path returns `201` and uses `UNDER_VERIFICATION`.
- Officer verification: existing dashboard actions call the report verification API.
- Clear State: confirmation plus `POST /api/v1/scenarios/clear-state`; stored reports and official records are preserved by the backend response contract.
- Emergency alert: local test preview only; no public broadcast is claimed.

## Manual E2E Items

The following require both FastAPI on `127.0.0.1:8001` and Express on `5000` running together: browser screenshot verification, live map color observation, MongoDB persistence observation, and a real citizen-to-officer report handoff. The automated backend suite covers the corresponding HTTP contracts.
