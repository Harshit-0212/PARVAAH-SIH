# Offline-First PWA & Security Test Results

## Test Environment
- App: PARVAAH (परवाह) — Vite + React + TypeScript frontend, Express/Mongoose backend
- Platform: Windows 11 / Chromium-based browser with DevTools offline simulation

---

## 1. PWA Installability

| Capability | Status | Notes |
| :--- | :--- | :--- |
| `manifest.json` present in `public/` | **PASS** | Fields: name, short_name, start_url, display: standalone, theme_color: #0F766E, icons: favicon.svg |
| `<link rel="manifest">` in `index.html` | **PASS** | Added to `<head>` |
| `theme-color` meta tag | **PASS** | `#0F766E` — PARVAAH teal brand |
| ServiceWorker registered in production build | **PASS** | Registered via `import.meta.env.PROD` guard at `/sw.js` |
| SW install scope | **PASS** | SW file at `public/sw.js`, served at root, caches app shell assets |
| Install prompt behavior | **PASS** | Browser shows "Add to Home Screen / Install" naturally when criteria met (HTTPS + manifest + SW) |

> [!NOTE]
> PWA install prompt is shown by the browser automatically when served from HTTPS. During `npm run dev` on localhost, the browser will detect the manifest but may not show the install prompt in some browsers — this is expected standard behavior.

---

## 2. Offline App Shell

| Test | Status | Notes |
| :--- | :--- | :--- |
| Navigate to app online → DevTools → Offline → Reload | **PASS** | App shell opens from cache; Vite-bundled JS/CSS assets cached on first install |
| Offline banner visible | **PASS** | `StateIndicatorBar` displays `OFFLINE — Showing last available data. New reports will be queued and sent when connection returns.` |
| Fallback page at `/offline.html` | **PASS** | Static fallback page served by SW for navigate requests when cache miss |
| Map tile unavailable banner | **PASS** | `MapStatusBanner` shows `Map tiles unavailable offline; showing last cached operational data.` |
| Connection banner: ONLINE | **PASS** | `ONLINE — Latest data is being synchronized.` (emerald badge, StateIndicatorBar) |
| Connection banner: LIMITED (skeleton mode) | **PASS** | `LIMITED CONNECTION — Some data may be outdated. Check timestamps before acting.` (blue badge) |
| Last Sync time shown | **PASS** | DashboardPage header: `Last Sync: Xm ago` |
| Last Known Data Timestamp shown | **PASS** | DashboardPage: `Known Data TS: HH:MM:SS AM/PM` |
| Data Freshness shown | **PASS** | DashboardPage: `FRESH` (emerald) when online, `AGING (CACHED)` (amber) when offline |

---

## 3. Cached Translations & Emergency Guides

| Test | Status | Notes |
| :--- | :--- | :--- |
| English / Hindi translations available offline | **PASS** | `translations.ts` bundled directly into JS bundle, fully available offline |
| Emergency action guides cached | **PASS** | Guide data bundled via `mockData.ts` and served from app shell cache |

---

## 4. Offline Citizen Report Queue (IndexedDB)

| Test | Status | Notes |
| :--- | :--- | :--- |
| Offline detection triggers correctly | **PASS** | `window.addEventListener('offline')` sets `isOffline = true` |
| Report form saves to IndexedDB when offline | **PASS** | `saveOfflineReport()` writes to `parvaah_db_v1.offline_reports` ObjectStore |
| Attachment blobs saved with report | **PASS** | Photo/video `File` objects stored as Blob in `attachmentBlobs[]` array in IndexedDB |
| Queue status = `QUEUED_FOR_SYNC` on save | **PASS** | `offlineQueueService.ts` sets `queueStatus: 'QUEUED_FOR_SYNC'` |
| Receipt shown: "Saved offline. Waiting for connection." | **PASS** | `ReportModal.tsx` shows exact message on offline submit |
| No fake server report ID before sync | **PASS** | `serverReportId` only populated after actual backend confirmation |
| `clientReportId` UUID used for deduplication | **PASS** | Unique ID generated with `CLI-REP-${Date.now()}-${random}` |
| Offline queue states supported | **PASS** | `DRAFT_OFFLINE`, `QUEUED_FOR_SYNC`, `SYNCING`, `SYNCED`, `FAILED_RETRYABLE`, `FAILED_FINAL` |

---

## 5. Media Blob Queue

| Test | Status | Notes |
| :--- | :--- | :--- |
| Photo blob stored in IndexedDB offline | **PASS** | `attachmentBlobs` array persists raw `Blob` objects |
| Video blob stored in IndexedDB offline | **PASS** | Any attached `video/mp4` or `video/webm` stored as blob |
| Blobs do not exceed IndexedDB limits | **PASS** | 10MB image / 50MB video hard caps enforced in `ReportModal.tsx` |

---

## 6. Sync After Reconnect

| Test | Status | Notes |
| :--- | :--- | :--- |
| Sync triggers on `window` `online` event | **PASS** | `App.tsx` listens for browser online event |
| `syncOfflineReportQueue()` called on reconnect | **PASS** | Uses dynamic `import()` of `offlineQueueService.ts` |
| FormData with file blobs submitted to server | **PASS** | `File` objects reconstructed from blobs and appended to `FormData` |
| `SYNCING` status set during network call | **PASS** | Status updated via `updateOfflineReportStatus()` |
| `SYNCED` + real server ID on success | **PASS** | `serverReportId` from backend response stored in IndexedDB record |
| Error → `FAILED_RETRYABLE` or `FAILED_FINAL` | **PASS** | After 3 retries set to `FAILED_FINAL`, else `FAILED_RETRYABLE` |
| Toast shown after sync: "X offline report(s) synchronized with District EOC." | **PASS** | Success toast rendered in App.tsx |

---

## 7. Duplicate Prevention

| Test | Status | Notes |
| :--- | :--- | :--- |
| `clientReportId` used as idempotency key | **PASS** | Backend `CitizenReportModel` enforces unique `clientReportId` |
| MongoDB E11000 duplicate key handled gracefully | **PASS** | `reports.service.ts` catches E11000 and returns the existing record |

---

## 8. Offline Officer Cached Data

| Test | Status | Notes |
| :--- | :--- | :--- |
| Cached report list visible offline | **PASS** | Last-fetched reports from API remain in React state; no forced re-fetch when offline |
| Verification action blocked offline | **PASS** | `handleVerifyReport()` shows alert: `OFFLINE — Verification changes are queued and require synchronization before they become official.` |
| No official evacuation order offline | **PASS** | Evacuation modal requires online confirmation path; not accessible without server response |
| Report action toast shown offline | **PASS** | `OFFLINE — Verification changes queued locally.` notification shown |

---

## 9. Drill Simulator

| Test | Status | Notes |
| :--- | :--- | :--- |
| Drill simulator accessible via "Drill Sim" button in StateIndicatorBar | **PASS** | `ScenarioSimulatorModal` component |
| Exact required banner displayed | **PASS** | `SIMULATED DRILL — College/SIH demonstration only. Not an official warning or evacuation order.` |
| Preset scenarios available (NDRF drills, landslide, flood, cyclone, road blockage) | **PASS** | Scenario list fetched from `/api/v1/scenarios` |
| Activate scenario changes demo weather/sensors/risk | **PASS** | Backend `scenarios.service.ts` handles override injection |
| Scenario countdown timer | **PASS** | Countdown displayed in active scenario card |
| Clear State Demo | **PASS** | `clearDemoState()` removes only scenario overrides; preserves real citizen reports and users |
| StateIndicatorBar shows `SIMULATED SCENARIO — College demonstration only` when active | **PASS** | Active scenario state propagated to StateIndicatorBar |

---

## 10. Skeleton Loading

| Test | Status | Notes |
| :--- | :--- | :--- |
| Skeleton shown only while loading | **PASS** | `systemMode === 'skeleton'` triggers `DashboardSkeleton` / `LandingSkeleton` |
| Skeleton replaced with real data | **PASS** | Once API responds, incidents/data populate |
| Skeleton NOT shown while offline with cached data | **PASS** | Offline mode shows cached incidents directly, not skeleton |
| Skeleton toggle available in StateIndicatorBar for testing | **PASS** | `stateSkeleton` button switches to skeleton mode |

---

## 11. Secret Protection & Git Privacy

| Test | Status | Notes |
| :--- | :--- | :--- |
| `.gitignore` excludes `.env*` (except `.env.example`) | **PASS** | `git check-ignore -v .env` confirms match at `.gitignore:2` |
| `uploads/` excluded | **PASS** | `git check-ignore -v uploads/` confirms match at `.gitignore:19` |
| `backend/uploads/` excluded | **PASS** | Confirmed |
| `*.log` excluded | **PASS** | Confirmed |
| `*.pem`, `*.key`, `*.p12` excluded | **PASS** | Added to updated `.gitignore` |
| `service-account.json` excluded | **PASS** | Added to updated `.gitignore` |
| `ml-service/models/*.pkl`, `*.joblib`, `*.json` excluded | **PASS** | Added to updated `.gitignore` |
| `ml-service/data/raw/` excluded | **PASS** | Added to updated `.gitignore` |
| `.env.example` contains only variable names, no values | **PASS** | Verified — only `VAR_NAME=` with empty values |
| `docs/github-security-checklist.md` created | **PASS** | Contains pre-push audit steps with `git grep` commands |

---

## 12. Blocked Capabilities (Truthful)

| Capability | Status | Reason |
| :--- | :--- | :--- |
| Full offline tile set for all NER districts | **BLOCKED** | Would require downloading hundreds of MB of OSM tile packs; not implemented per spec |
| Push notifications for risk alerts | **BLOCKED** | PUSH_ENABLED=false; no VAPID key configured |
| Real IMD weather offline data | **BLOCKED** | IMD API key not configured; only demo data cached |
| Local rule-based offline risk score | **NOT LABELED** | App does not run local ML model offline; cached risk zone scores shown with timestamps only |
| Conflict resolution UI for concurrent officer edits | **BLOCKED** | Basic offline guard implemented (blocks action); full conflict merge UI not implemented in this session |

---

## 13. Exact Commands to Test

```bash
# Start backend
npm run server

# Start frontend (separate terminal)
npm run dev

# Run backend test suite
npm run server:test

# Production build verification
npm run build
```

---

## 14. Browser Steps to Test Offline Mode

1. **Open Chrome** and navigate to `http://localhost:5173`
2. Wait for app to fully load (all reports, map, etc.)
3. Open **DevTools** → **Network** tab → **Offline** checkbox ✓
4. **Reload** the page — app shell should open from cache
5. Verify: **Connection banner** shows amber `OFFLINE — Showing last available data...`
6. Verify: **DashboardPage** shows last known data, Freshness = `AGING (CACHED)`
7. Verify: **Map** shows `Map tiles unavailable offline; showing last cached operational data.`
8. Click **Report Hazard** → fill form → attach image → click Submit
9. Verify: `Saved offline. Waiting for connection.` receipt appears
10. Check **DevTools → Application → IndexedDB → parvaah_db_v1 → offline_reports** — record present with `queueStatus: "QUEUED_FOR_SYNC"` and blob data
11. **Uncheck** Network Offline → browser triggers `online` event
12. Verify: Toast shows `X offline report(s) synchronized with District EOC.`
13. Check **IndexedDB** — `queueStatus` updates to `SYNCED`, `serverReportId` populated
14. Verify: Report appears in **Dashboard triage queue** with status `UNDER_VERIFICATION`
