# PARVAAH System Wiring & Architecture Audit

This audit documents the complete baseline system wiring, frameworks, data models, routes, and broken connections identified across the PARVAAH repository prior to repair execution.

---

## 1. Environment & Architecture Summary

- **Frontend Framework**: React 19.2.8 + TypeScript 5.7 / ~6.0 + Vite 5.4.21 SPA (Single Page Application).
- **Styling**: Tailwind CSS v4.3.3.
- **GIS Mapping**: Leaflet 1.9.4 + React-Leaflet 5.0.0 (WGS84 projection, OpenStreetMap tile server).
- **Backend Framework**: Node.js + Express 4.21.2 + TypeScript (in `backend/src/`, running on port 5000).
- **Secondary / Legacy Scaffold**: Unbundled Next.js App Router files in `app/` and `lib/` (partially developed, but active development and build pipeline uses Vite SPA on port 5173 + Express REST API on port 5000).
- **Database & ODM**: MongoDB Atlas / Local MongoDB (`mongodb://127.0.0.1:27017/parvaah_db`) + Mongoose 9.10.0 (in `backend/src/config/db.ts` with connection readiness checks and graceful in-memory baseline fallback).
- **Machine Learning**: FastAPI + Python (in `ml-service/`, port 8001) for practice XGBoost landslide prediction with rule-based fallback.
- **Storage**: Currently lacks binary storage provider in Express backend; `uploads/` directory with `MediaStorageProvider` interface required.
- **Offline / PWA Engine**: IndexedDB + localStorage queue with `clientReportId` deduplication and online reconnect synchronization.

---

## 2. Core System Wiring Audit Table

| Area | Current file(s) | Existing behavior | Backend/API used | Database/storage used | Broken/missing wiring | Proposed repair |
|---|---|---|---|---|---|---|
| **Citizen Hazard Reporting** | `src/components/ReportModal.tsx`<br>`src/api/reports.ts`<br>`backend/src/routes/reports.routes.ts`<br>`backend/src/controllers/reports.controller.ts` | Form accepts text inputs, GPS coordinates, and media selection. Submits JSON only to `POST /api/v1/reports`. | `POST /api/v1/reports` | Mongoose `CitizenReportModel` | Selected photo and video attachments are never sent to backend; no multipart/form-data handler; media blobs discarded; no SHA-256 integrity hash generated; offline queue only stores text in localStorage. | Implement multipart upload and two-step attachment upload in Express backend; create `ReportAttachment` model; compute SHA-256 hash; store files in `uploads/` via `LocalMediaStorageProvider`; save blobs in IndexedDB when offline; return evidence receipt. |
| **Media Proof Storage & Serving** | `lib/services/mediaStorageService.ts`<br>`backend/src/providers/storage/` | Only drafted for Next.js App Router (`/api/reports/media/direct-upload`). No media routes or storage adapter in Express backend. | None in Express backend | None | Binary photo/video files cannot be stored or securely served by Express backend; officers cannot preview photos or play videos. | Create `MediaStorageProvider` interface and `LocalMediaStorageProvider` in Express; implement `GET /api/v1/reports/:id/media/:attachmentId` with authorization; ignore `uploads/` in git; serve via secure stream with no path leakage. |
| **Officer Triage & Media Proof** | `src/pages/DashboardPage.tsx`<br>`backend/src/controllers/reports.controller.ts` | Displays incoming report list in table; buttons for Verify/Reject/Duplicate update verification status. | `GET /api/v1/reports`<br>`PATCH /api/v1/reports/:id/verification` | MongoDB / In-memory fallback | No column or action to view attached photo/video evidence; no attachment count; no file integrity badges; no modal to preview photo or stream video; no assignment action to dispatch field team. | Add media preview thumbnail and "View Evidence" modal with photo viewer and video player; show file integrity badge with shortened SHA-256; add assignment action wired to `POST /api/v1/reports/:id/assign`. |
| **District Officer Risk Page** | `src/pages/DashboardPage.tsx`<br>`src/types/index.ts`<br>`src/components/Navbar.tsx` | No dedicated District Officer Risk page or route exists. `UserRole` in frontend only includes `citizen`, `field_officer`, `admin`. Switching role does not load district risk decision synthesis. | Fragmented calls to `/incidents` and `/weather` | None unified | Blank or non-existent District Officer Risk page; missing `district_officer` in `UserRole`; missing `district-risk` in `PageState`; missing risk recalculation trigger and evidence integration. | Add `district_officer` to `UserRole` and `district-risk` to `PageState`; create dedicated `DistrictOfficerRiskPage.tsx` loading all 8 required sources (`/risk-zones`, `/incidents`, `/reports`, `/roads`, `/shelters`, `/weather`, `/integrations/health`, ML endpoint); include loading/empty/error states; wire "Recalculate Zone Risk". |
| **Proof-to-Protection Chain** | `src/types/index.ts`<br>`src/pages/` | Not implemented. Workflow exists only conceptually in README/docs. | None | None | No end-to-end auditable chain connecting citizen report -> evidence receipt -> confidence score -> corroboration cluster -> dynamic access impact -> why now -> incident replay -> offline bulletin. | Implement dedicated `/district-officer/proof-to-protection` page and workflow engine with all 7 differentiator stages, real audit timestamps, and printable test bulletin. |
| **Clear Demo / Clear State** | `src/components/Navbar.tsx`<br>`src/App.tsx`<br>`src/api/scenarios.ts`<br>`backend/src/controllers/scenarios.controller.ts` | Clicking Clear Demo runs `window.confirm` and calls `POST /api/v1/scenarios/clear-state`, or redirects to `EmptyStatePage` which is an incident filter page. | `POST /api/v1/scenarios/clear-state` | In-memory scenario map | Missing confirmation modal component; does not check `GET /api/v1/scenarios/active` first; missing `POST /api/v1/scenarios/clear-active`; no `ScenarioOverride` model; returns error if no scenario active instead of clear status; confusing redirection to empty page. | Create `ScenarioOverride` model; implement `POST /api/v1/scenarios/clear-active` and `GET /api/v1/scenarios/active`; create interactive `ClearDemoModal.tsx` modal; check active scenario; de-escalate only scenario overrides; recalculate affected zones; refresh frontend queries. |
| **Operational Telemetry** | `src/pages/OperationalTelemetryPage.tsx`<br>`backend/src/routes/telemetry.routes.ts` | Page displays tiles for API, MongoDB, and FastAPI ML with diagnostic buttons. | `GET /api/v1/telemetry`<br>`POST /api/v1/telemetry/test/*` | MongoDB ping command | Telemetry tiles lack explicit categorization badges (`LIVE CHECK`, `DATABASE CHECK`, `CONFIGURATION`, `DEMO`, `NOT CONFIGURED`, `ERROR`); storage provider state and media upload telemetry missing; error states not categorized. | Enhance telemetry with categorized badges, storage provider health, media upload success/failure counters, last recalculation time, and safe error details. |
| **Database Resilience** | `backend/src/config/db.ts`<br>`backend/src/services/reports.service.ts` | `connectDatabase()` connects to `MONGODB_URI`. If MongoDB is not running, `submitReport` throws hard error: `Database connection unavailable: Cannot guarantee persistent save.` | Internal Mongoose | MongoDB on `localhost:27017` | When running offline or without local MongoDB server started, report creation fails completely rather than storing in-memory with clear demo labelling. | Implement unified storage repository: write to MongoDB Atlas/local when connected; gracefully store in memory with `source: IN_MEMORY_FALLBACK` when disconnected, ensuring zero crash during offline college demonstrations. |
| **Incident Detail Drawer Actions** | `src/components/incidents/IncidentDetailDrawer.tsx`<br>`src/pages/DashboardPage.tsx` | Drawer renders 14 sections. Bottom action "Report Status Update" calls `onOpenReportModal()`. "Issue Official Emergency Alert" renders preview modal. | None | None | "Report Status Update" opened generic report creation rather than an incident update workflow; official alert preview is correctly restricted to test preview only. | Keep official alert restricted to test-preview-only (no actual emergency broadcasts); improve status update workflow and bulletin download. |
| **Map Layer Controls & GIS Sizing** | `src/components/map/DisasterMap.tsx`<br>`src/components/map/RiskZoneLayer.tsx` | Leaflet map with GeoJSON layers for risk zones, roads, shelters, and incidents. | `/api/v1/risk-zones`<br>`/api/v1/roads`<br>`/api/v1/shelters`<br>`/api/v1/sensors` | Demo GeoJSON and REST endpoints | Map container sometimes does not resize after drawer open/close; under-verification reports need distinct marker styling; invalid GeoJSON can cause leaflet errors. | Add `invalidateSize` trigger on drawer toggle; add distinct dashed marker for `UNDER_VERIFICATION` citizen reports; add GeoJSON feature validation. |

---

## 3. Active File & Model Inventory

### Existing Models (`backend/src/models/`):
- `CitizenReport.model.ts` (Existing, needs media and confidence enhancements)
- `PredictionHistory.model.ts` (Existing)
- `RiskZone.model.ts` (Existing)
- `Scenario.model.ts` (Existing)
- `WeatherSnapshot.model.ts` (Existing)

### Models to Add:
- `ReportAttachment.model.ts` (Detached media metadata: filename, SHA-256, mimeType, size, storage key, upload status)
- `ReportAssignment.model.ts` (Officer/team task assignments)
- `VerificationAuditEvent.model.ts` (Immutable audit trail of status transitions)
- `ScenarioOverride.model.ts` (Active scenario override tracking)

### Existing API Routes (`backend/src/routes/`):
- `index.routes.ts`: `GET /api/v1`
- `health.routes.ts`: `GET /api/v1/health`
- `integrations.routes.ts`: `GET /api/v1/integrations/health`, `POST /api/v1/integrations/imd/test`
- `incidents.routes.ts`: `GET /api/v1/incidents`, `GET /api/v1/incidents/:id`, `GET /api/v1/incidents/:id/timeline`
- `weather.routes.ts`: `GET /api/v1/weather`, `GET /api/v1/weather/forecast`, `POST /api/v1/weather/sync/open-meteo`
- `risk.routes.ts`: `GET /api/v1/risk-zones`, `GET /api/v1/risk-zones/:id`, `POST /api/v1/risk/calculate`, `POST /api/v1/risk-zones/:id/recalculate`
- `roads.routes.ts`: `GET /api/v1/roads`
- `shelters.routes.ts`: `GET /api/v1/shelters`, `GET /api/v1/shelters/:id`
- `sensors.routes.ts`: `GET /api/v1/sensors`
- `reports.routes.ts`: `POST /api/v1/reports`, `GET /api/v1/reports`, `GET /api/v1/reports/:id`, `PATCH /api/v1/reports/:id/verification`
- `citizen-actions.routes.ts`: `GET /api/v1/action-guides/:hazardType`
- `scenarios.routes.ts`: `GET /api/v1/scenarios`, `POST /api/v1/scenarios`, `POST /api/v1/scenarios/:id/activate`, `POST /api/v1/scenarios/:id/deactivate`, `POST /api/v1/scenarios/clear-state`
- `telemetry.routes.ts`: `GET /api/v1/telemetry`, `POST /api/v1/telemetry/test/*`

### API Endpoints to Add / Align:
- `POST /api/v1/reports` (Multipart form-data and attachment support)
- `GET /api/v1/reports/:id/media/:attachmentId` (Secure file serving with authorization)
- `POST /api/v1/reports/:id/assign` (Officer assignment)
- `POST /api/v1/reports/:id/attachments` (Two-step attachment upload)
- `GET /api/v1/scenarios/active` (Active scenario lookup)
- `POST /api/v1/scenarios/clear-active` (Clear active scenario endpoint)
