# PARVAAH Visible Button Inventory & Operational State

This document catalogs every visible interactive button across all user roles (Citizen, Field Officer, District Officer, Admin/Developer) in the PARVAAH platform.

---

## 1. Status Definitions
- `WORKING`: Connected to verified backend endpoint or functional frontend state with full expected behavior.
- `UI_ONLY`: Triggers local visual state change or modal, but lacks backend connection or persistent effect.
- `BROKEN`: Triggers an error, misdirected route, or unhandled rejection.
- `PENDING`: Backend or adapter implementation required to complete end-to-end flow.
- `NOT_IMPLEMENTED`: Missing from component or UI layout.

---

## 2. Button Inventory Table

| Page / Component | Label / Icon | User Role | Click Handler | API Endpoint | Expected DB / Storage Effect | Current State | Repair Action |
|---|---|---|---|---|---|---|---|
| `Navbar` | Brand Logo / "PARVAAH" | All | `setCurrentPage('landing')` | None | None | `WORKING` | Preserved. |
| `Navbar` | "Overview" / "Landing" | All | `setCurrentPage('landing')` | None | None | `WORKING` | Preserved. |
| `Navbar` | "Dashboard" | All | `setCurrentPage('dashboard')` | None | None | `WORKING` | Preserved. |
| `Navbar` | "Clear Demo" | Admin / Officer | `handleClearDemoState()` | `POST /api/v1/scenarios/clear-state` | Deactivates active scenario override without touching stored reports | `BROKEN` | Replace `window.confirm` with `ClearDemoModal`; check `GET /api/v1/scenarios/active` first; point to `POST /api/v1/scenarios/clear-active`; refetch queries. |
| `Navbar` | "District Risk" | District Officer / Admin | `setCurrentPage('district-risk')` | `GET /api/v1/risk-zones` etc. | Loads live risk zones and synthesis | `NOT_IMPLEMENTED` | Add navigation link for District Officer and Admin; wire to `DistrictOfficerRiskPage`. |
| `Navbar` | "Proof-to-Protection" | District Officer / Admin | `setCurrentPage('proof-to-protection')` | Multi-source audit | Queries report lifecycle, evidence, access impact | `NOT_IMPLEMENTED` | Add navigation link for District Officer and Admin; wire to `ProofToProtectionPage`. |
| `Navbar` | "Telemetry Health" | All / Admin | `setCurrentPage('telemetry')` | `GET /api/v1/telemetry` | Reads system health metrics | `WORKING` | Preserved and enhanced. |
| `Navbar` | "Risk Simulator" | Admin | `setCurrentPage('risk-simulator')` | Local / Backend prediction | Tests model scoring | `WORKING` | Preserved. |
| `Navbar` | "Report Hazard" | Citizen / Officer | `onOpenReportModal()` | None | Opens submission modal | `WORKING` | Preserved. |
| `Navbar` | Role Switcher Pill | All | `setRole(newRole)` | None | Switches local authorization role context | `UI_ONLY` | Add `district_officer` role option alongside citizen, field_officer, and admin. |
| `Navbar` | "हिन्दी / English" Quick Toggle | All | `toggleLanguage()` | None | Updates language preference | `WORKING` | Preserved. |
| `Navbar` | "Change Language" | All | `onOpenLanguageModal()` | None | Opens language selection modal | `WORKING` | Preserved. |
| `Navbar` | "Officer / Admin Login" | All | `setCurrentPage('login')` | None | Navigates to login page | `WORKING` | Preserved. |
| `LandingPage` | "Check Risk Now" (Banner) | Citizen | `setCurrentPage('dashboard')` | None | Navigates to dashboard | `WORKING` | Preserved. |
| `LandingPage` | "Explore Operational Dashboard" | All | `setCurrentPage('dashboard')` | None | Navigates to dashboard | `WORKING` | Preserved. |
| `LandingPage` | "Report Hazard / Geotag Incident" | Citizen | `onOpenReportModal()` | None | Opens ReportModal | `WORKING` | Preserved. |
| `LandingPage` | "Go to Operational Dashboard" | All | `setCurrentPage('dashboard')` | None | Navigates to dashboard | `WORKING` | Preserved. |
| `LandingPage` | "Report Hazard / Incident" (Bottom) | Citizen | `onOpenReportModal()` | None | Opens ReportModal | `WORKING` | Preserved. |
| `StateIndicatorBar` | "Live Telemetry" | Reviewer / All | `setSystemMode('live')` | None | Switches data mode display | `WORKING` | Preserved. |
| `StateIndicatorBar` | "Skeleton Loading" | Reviewer / All | `setSystemMode('skeleton')` | None | Toggles skeleton UI view | `WORKING` | Preserved. |
| `StateIndicatorBar` | "Simulate Offline" | Reviewer / All | `setIsOffline(!isOffline)` | None | Engages offline queue mode | `WORKING` | Preserved. |
| `StateIndicatorBar` | "Error Mode" | Reviewer / All | `setSystemMode('error')` | None | Renders error banner | `WORKING` | Preserved. |
| `StateIndicatorBar` | "Drill Sim" | Admin / Officer | `onOpenScenarioSimulator()` | None | Opens ScenarioSimulatorModal | `WORKING` | Preserved. |
| `StateIndicatorBar` | "Retry" (in Error Banner) | All | `setSystemMode('live')` | None | Restores live mode | `WORKING` | Preserved. |
| `LoginPage` | Quick Fill Citizen | Citizen | `handleQuickFill('citizen')` | None | Pre-fills phone and PIN | `WORKING` | Preserved. |
| `LoginPage` | Quick Fill Field Officer | Field Officer | `handleQuickFill('field_officer')` | None | Pre-fills officer credentials | `WORKING` | Preserved. |
| `LoginPage` | Quick Fill District Officer | District Officer | `handleQuickFill('district_officer')` | None | Pre-fills district officer credentials | `NOT_IMPLEMENTED` | Add District Officer button with demo credentials (`+91 94361 55201`, PIN, ID `DDMA-EAST-SKM-OIC`). |
| `LoginPage` | Quick Fill Admin | Admin | `handleQuickFill('admin')` | None | Pre-fills admin credentials | `WORKING` | Preserved. |
| `LoginPage` | "Sign In to Operations Console" | All | Form submission | `/api/auth/login` | Stores user session in localStorage | `WORKING` | Preserved. |
| `DashboardPage` | District Selector Dropdown | All | `setSelectedDistrict(id)` | `/api/v1/incidents?district=...` | Filters incident and report queries | `WORKING` | Preserved. |
| `DashboardPage` | Force Telemetry Refresh | All | `handleManualSync()` | `/api/v1/reports`, `/weather` | Refetches active records | `WORKING` | Preserved. |
| `DashboardPage` | "Drill Simulator" | Officer / Admin | `onOpenScenarioSimulator()` | None | Opens scenario simulator modal | `WORKING` | Preserved. |
| `DashboardPage` | "Integration Health" | Officer / Admin | `onNavigateToIntegrationHealth()` | None | Navigates to integration health | `WORKING` | Preserved. |
| `DashboardPage` | Queue Filter: "Under Verification" | Officer / Admin | `setVerificationFilter('UNDER_VERIFICATION')` | `GET /api/v1/reports?verificationStatus=UNDER_VERIFICATION` | Filters queue | `WORKING` | Preserved. |
| `DashboardPage` | Queue Filter: "All Reports" | Officer / Admin | `setVerificationFilter('ALL')` | `GET /api/v1/reports` | Shows all reports | `WORKING` | Preserved. |
| `DashboardPage` | Queue Filter: "Verified" | Officer / Admin | `setVerificationFilter('VERIFIED')` | `GET /api/v1/reports?verificationStatus=VERIFIED` | Shows confirmed reports | `WORKING` | Preserved. |
| `DashboardPage` | Queue Filter: "Rejected" | Officer / Admin | `setVerificationFilter('REJECTED')` | `GET /api/v1/reports?verificationStatus=REJECTED` | Shows rejected reports | `WORKING` | Preserved. |
| `DashboardPage` | "Refresh" (Queue) | Officer / Admin | `loadCitizenReports()` | `GET /api/v1/reports` | Refetches reports table | `WORKING` | Preserved. |
| `DashboardPage` | "Verify" (Report Action) | Officer / Admin | `handleVerifyReport(id, 'VERIFIED')` | `PATCH /api/v1/reports/:id/verification` | Updates verification status and creates audit event | `WORKING` | Enhance to prompt for verification note and recalculate affected risk zone. |
| `DashboardPage` | "Reject" (Report Action) | Officer / Admin | `handleVerifyReport(id, 'REJECTED')` | `PATCH /api/v1/reports/:id/verification` | Sets REJECTED status with audit log | `WORKING` | Enhance to require rejection reason. |
| `DashboardPage` | "Dup" (Duplicate Report Action) | Officer / Admin | `handleVerifyReport(id, 'DUPLICATE')` | `PATCH /api/v1/reports/:id/verification` | Marks DUPLICATE with audit log | `WORKING` | Preserved. |
| `DashboardPage` | "View Evidence" (Photo/Video) | Officer / Admin | `handleOpenEvidence(report)` | `GET /api/v1/reports/:id/media/:attachmentId` | Fetches and displays secure media preview modal | `NOT_IMPLEMENTED` | Implement button in table row; open `EvidenceViewerModal` with photo/video player and SHA-256 integrity record. |
| `DashboardPage` | "Assign Field Team" | District Officer / Admin | `handleAssignReport(report)` | `POST /api/v1/reports/:id/assign` | Creates `ReportAssignment` record | `NOT_IMPLEMENTED` | Add assignment dropdown/modal to assign duty officer or SDRF/PWD team. |
| `ReportModal` | "Refresh GPS" / Detect Location | Citizen | `handleManualDetectGps()` | Browser Geolocation API | Updates lat/lng state | `WORKING` | Preserved. |
| `ReportModal` | Photo File Attachment Input | Citizen | `handlePhotoUpload(e)` | Client-side file selection | Stores file in local memory | `UI_ONLY` | Wire file to FormData payload for `POST /api/v1/reports` or IndexedDB when offline. |
| `ReportModal` | Video File Attachment Input | Citizen | `handleVideoUpload(e)` | Client-side file selection | Validates < 50MB and stores in local state | `UI_ONLY` | Wire file to FormData payload for `POST /api/v1/reports` or IndexedDB when offline. |
| `ReportModal` | "Save Offline" | Citizen | `saveReportToOfflineQueue()` | None | Stores report in browser queue | `WORKING` | Upgrade to store media binary Blob in IndexedDB alongside metadata. |
| `ReportModal` | "Transmit Field Report" | Citizen | Form submission | `POST /api/v1/reports` | Saves report and files in MongoDB/storage | `BROKEN` (Media missing) | Send multipart/form-data with photo/video binaries; display Evidence Receipt on success with SHA-256 integrity hash badge. |
| `ReportModal` | Close Modal Button | All | `onClose()` | None | Closes modal | `WORKING` | Preserved. |
| `IncidentDetailDrawer` | Close Drawer Button | All | `onClose()` | None | Closes drawer | `WORKING` | Preserved. |
| `IncidentDetailDrawer` | "Evacuate & Safe Route" | All | `onOpenEvacuationModal(incident)` | None | Opens EvacuationModal | `WORKING` | Preserved. |
| `IncidentDetailDrawer` | "Report Status Update" | Officer | `onOpenReportUpdate()` | None | Opens report modal | `UI_ONLY` | Wire to dedicated incident note update / verification action. |
| `IncidentDetailDrawer` | "Issue Official Emergency Alert" | Admin | `onIssueOfficialAlert()` | Test preview dialog only | Opens preview modal | `WORKING` | Strictly maintained as test-preview-only (no actual public emergency broadcasts). |
| `IncidentDetailDrawer` | "Download Low-Network Text Bulletin" | All | `handleDownloadBulletin()` | Local Blob generator | Triggers download of `.txt` bulletin | `WORKING` | Enhance to include test disclaimer and road verification caveats. |
| `EvacuationModal` | Safe Routes Tab | All | `setActiveTab('routes')` | None | Displays route conditions | `WORKING` | Preserved. |
| `EvacuationModal` | Designated Shelters Tab | All | `setActiveTab('shelters')` | None | Displays shelter capacity | `WORKING` | Preserved. |
| `EvacuationModal` | What to Carry Tab | All | `setActiveTab('checklist')` | None | Displays go-bag list | `WORKING` | Preserved. |
| `EvacuationModal` | Official Order Console Tab | Admin | `setActiveTab('admin')` | None | Displays order transitions | `WORKING` | Preserved. |
| `EvacuationModal` | Evacuation State Option Buttons | Admin | `setConfirmStatusChange(val)` | None | Selects target status | `WORKING` | Preserved. |
| `EvacuationModal` | "Confirm Official Order Change" | Admin | `handleApplyOrderStatus()` | Local incident update | Updates incident evacuation status | `UI_ONLY` | Wire to backend incident update API and audit event. |
| `PreparednessModule` | Hazard Selector Tabs | All | `setSelectedHazard(type)` | None | Switches active hazard guides | `WORKING` | Preserved. |
| `PreparednessModule` | Phase Tabs (Before/During/After) | All | `setActivePhase(phase)` | None | Switches phase content | `WORKING` | Preserved. |
| `PreparednessModule` | Checklist Checkboxes | All | `toggleChecklistItem(id)` | None | Saves state to `localStorage` | `WORKING` | Preserved. |
| `PreparednessModule` | "Share Emergency Advisory" | All | `handleShareAlert()` | Clipboard API | Copies advisory text | `WORKING` | Preserved. |
| `PreparednessModule` | "I Am Safe Check-in" | Citizen | `setShowCheckinModal(true)` | None | Opens checkin dialog | `WORKING` | Preserved. |
| `PreparednessModule` | Submit Safe Check-in | Citizen | Form submit | `localStorage` log | Records check-in | `WORKING` | Preserved. |
| `ScenarioSimulatorModal` | Activate Scenario (Preconfigured) | Admin / Officer | `handleActivate(id)` | `POST /api/v1/scenarios/:id/activate` | Sets active scenario override | `WORKING` | Preserved. |
| `ScenarioSimulatorModal` | Deactivate Scenario | Admin / Officer | `handleDeactivate()` | `POST /api/v1/scenarios/:id/deactivate` | Clears active scenario | `WORKING` | Preserved. |
| `ScenarioSimulatorModal` | "Clear All Scenarios" | Admin | `handleClearState()` | `POST /api/v1/scenarios/clear-active` | Restores baseline and recalculates | `WORKING` | Realign with `POST /api/v1/scenarios/clear-active`. |
| `ClearDemoModal` (New) | "Cancel" | All | `onClose()` | None | Dismisses modal without changes | `NOT_IMPLEMENTED` | Create component and wire to Navbar/Dashboard Clear Demo button. |
| `ClearDemoModal` (New) | "Confirm Clear Scenario" | Admin | `handleConfirmClear()` | `POST /api/v1/scenarios/clear-active` | Deactivates scenario overrides; recalculates affected zones; refetches data | `NOT_IMPLEMENTED` | Create component with required explanation text; handle active check. |
| `DistrictOfficerRiskPage` (New) | "Recalculate Zone Risk" | District Officer / Admin | `handleRecalculate(zoneId)` | `POST /api/v1/risk-zones/:id/recalculate` | Runs XGBoost/rule engine, updates GeoJSON, writes PredictionHistory | `NOT_IMPLEMENTED` | Implement button in zone details card; show loading/success/error. |
| `DistrictOfficerRiskPage` (New) | "Refresh All Layers" | District Officer / Admin | `loadAllSources()` | All 8 required endpoints | Refetches fresh data | `NOT_IMPLEMENTED` | Implement refresh trigger with loading indicator and timestamp. |
| `DistrictOfficerRiskPage` (New) | "Generate Action Bulletin" | District Officer / Admin | `handleGenerateBulletin(zone)` | None (Client/Server generator) | Generates text-first bulletin marked `TEST / DEMO BULLETIN` | `NOT_IMPLEMENTED` | Implement bulletin modal with copy/print action. |
| `ProofToProtectionPage` (New) | "Inspect Evidence Receipt" | District Officer / Admin | `handleSelectReport(id)` | `GET /api/v1/reports/:id` | Displays full evidence receipt | `NOT_IMPLEMENTED` | Implement interactive inspection flow. |
| `ProofToProtectionPage` (New) | "Replay Incident Timeline" | District Officer / Admin | `handleReplay(id)` | Timeline audit query | Step-by-step playback with real timestamps | `NOT_IMPLEMENTED` | Implement interactive incident replay stepper. |
| `ProofToProtectionPage` (New) | "Run Corroboration Detection" | District Officer / Admin | `detectCorroboration(report)` | Clustering algorithm | Highlights nearby corroborating reports | `NOT_IMPLEMENTED` | Implement corroboration cluster view. |
| `OperationalTelemetryPage` | "Refresh Telemetry" | Admin / Developer | `load()` | `GET /api/v1/telemetry` | Loads latest health and metrics | `WORKING` | Preserved and enhanced. |
| `OperationalTelemetryPage` | "Run MongoDB Test" | Admin / Developer | `runTest('mongodb')` | `POST /api/v1/telemetry/test/mongodb` | Executes ping command against DB | `WORKING` | Preserved. |
| `OperationalTelemetryPage` | "Run Open-Meteo Test" | Admin / Developer | `runTest('open-meteo')` | `POST /api/v1/telemetry/test/open-meteo` | Executes live sync probe | `WORKING` | Preserved. |
| `OperationalTelemetryPage` | "Run ML Test" | Admin / Developer | `runTest('ml')` | `POST /api/v1/telemetry/test/ml` | Executes health check against FastAPI | `WORKING` | Preserved. |
