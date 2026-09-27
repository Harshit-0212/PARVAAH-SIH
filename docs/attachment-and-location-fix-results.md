# Attachment Metadata & Location/District Resolution Fix Results

## 1. Exact Root Cause Analysis
- **Empty `attachmentMetadata`**:
  - The Mongoose schema and MongoDB model stored attachment records in the field `attachments`, while the service method `sanitizeReport()` attempted to read `r.attachmentMetadata` (which was `undefined`). As a result, `r.attachmentMetadata || []` evaluated to `[]` for every report record returned in API endpoints.
  - In addition, the submission workflow did not map `attachments` to `attachmentMetadata` on the returned report record object after saving files to local media storage (`/uploads/reports`).
- **Location Routing Bug**:
  - Reports submitted with coordinates outside North East India (e.g. Bhopal MP coordinates `23.3038, 77.3397`) defaulted to `district: "east_sikkim"` because of hardcoded fallback assignments.

## 2. Files Modified
1. `backend/src/utils/geo.ts`:
   - Added macro-boundary validation for North East Region (Lat 21.5–29.8°N, Lng 87.5–97.5°E).
   - Added micro bounding boxes for districts (`east_sikkim`, `north_sikkim`, `south_sikkim`, `west_sikkim`, `east_khasi`, `dima_hasao`, `kamrup`).
   - Implemented `resolveLocation()` returning `locationResolutionStatus` (`RESOLVED`, `OUTSIDE_SERVICE_REGION`, `UNRESOLVED`, `MANUAL_CONFIRMED`), quality flags (`DISTRICT_COORDINATE_MISMATCH`), and human-friendly warnings.
2. `backend/src/models/CitizenReport.model.ts`:
   - Added `locationResolutionStatus`, `qualityFlags`, and `attachmentMetadata` array schema definitions.
3. `backend/src/services/reports.service.ts`:
   - Updated `submitReport()` and `sanitizeReport()` to populate `attachmentMetadata` and `attachments` arrays with file IDs, original filenames, media types, SHA-256 hashes, size in bytes, and media stream URLs.
   - Integrated `resolveLocation()` to automatically tag out-of-boundary locations as `OUTSIDE_SERVICE_REGION` with `district: "UNRESOLVED"` and `DISTRICT_COORDINATE_MISMATCH` quality flags.
4. `backend/src/controllers/reports.controller.ts`:
   - Enforced `multipart/form-data` parsing, saving binary files via `localMediaStorage` provider, and returning HTTP 201 with populated `attachmentMetadata`.
5. `backend/src/types/index.ts`:
   - Updated `CitizenReportRecord` interface to include `locationResolutionStatus`, `qualityFlags`, `userWarning`, `attachmentMetadata`, and `attachments`.
6. `src/components/ReportModal.tsx`:
   - Configured form submission using browser `FormData` with native `File` objects.
   - Added user location warning notice when coordinates fall outside the NER service boundary.
7. `src/pages/DashboardPage.tsx`:
   - Built evidence viewer modal supporting `<img>` preview for images and `<video controls>` for video files with SHA-256 verification badges.

## 3. Test Verification Matrix

| Test Suite / Requirement | Status | Verification Details |
| :--- | :--- | :--- |
| **Image Attachment Test** | **PASS** | `ATTACHMENT-IMAGE-TEST-1774676393976` submitted via `FormData` (`multipart/form-data`). Received HTTP 201 with `attachmentMetadata.length === 1`, stored image binary in `uploads/reports/ATT-MUHYABSP-776C02_741232aa.png`. |
| **Video Attachment Test** | **PASS** | `ATTACHMENT-VIDEO-TEST-1774676393992` submitted with MP4 binary. Received HTTP 201 with `attachmentMetadata.length === 1`, stored video binary in `uploads/reports/ATT-MUHYABT4-7CA423_f52f2797.mp4`. |
| **Database Metadata Test** | **PASS** | Report document persisted in MongoDB with `attachmentMetadata` containing `id`, `mediaType`, `mimeType`, `byteSize`, `sha256`, `uploadStatus: "COMPLETED"`, and `uploadedAt`. |
| **Secure Retrieval Test** | **PASS** | `GET /api/v1/reports/:id/attachments/:attachmentId` and `/media/:attachmentId` validate report ID, check attachment ownership, and stream actual file binary with header `Content-Type: image/png` / `video/mp4`. |
| **Location Validation Test** | **PASS** | Coordinates `23.3038, 77.3397` (Bhopal MP) resolved to `locationResolutionStatus: "OUTSIDE_SERVICE_REGION"`, `district: "UNRESOLVED"`, and `qualityFlags: ["DISTRICT_COORDINATE_MISMATCH"]`. Coordinates `27.1767, 88.5312` (Gangtok) resolved to `RESOLVED` and `district: "east_sikkim"`. |
| **Backend Test Suite** | **PASS** | 17/17 backend integration unit tests passed cleanly. |
| **Frontend Production Build** | **PASS** | `npm run build` executed without TypeScript or bundling errors. |

## 4. Exact API Response Sample

### POST `/api/v1/reports` (Image Report Response)
```json
{
  "success": true,
  "serverReportId": "REP-MUHYABSC-BE9562",
  "clientReportId": "CLI-IMG-1774676393976",
  "hazardType": "LANDSLIDE",
  "description": "ATTACHMENT-IMAGE-TEST-1774676393976",
  "latitude": 27.1767,
  "longitude": 88.5312,
  "district": "east_sikkim",
  "state": "Sikkim",
  "locationResolutionStatus": "RESOLVED",
  "qualityFlags": [],
  "verificationStatus": "UNDER_VERIFICATION",
  "status": "UNDER_VERIFICATION",
  "attachmentMetadata": [
    {
      "id": "ATT-MUHYABSP-776C02",
      "attachmentId": "ATT-MUHYABSP-776C02",
      "originalFilename": "test_image.png",
      "mediaType": "IMAGE",
      "mimeType": "image/png",
      "byteSize": 70,
      "sizeBytes": 70,
      "sha256": "c414cd0e204de974f73753c7e28d7638e7b3691bb8b1a2bab6b25bb7fed7ce77",
      "sha256Hash": "c414cd0e204de974f73753c7e28d7638e7b3691bb8b1a2bab6b25bb7fed7ce77",
      "storageProvider": "LOCAL_FILESYSTEM",
      "storageKey": "ATT-MUHYABSP-776C02",
      "uploadStatus": "COMPLETED",
      "uploadedAt": "2026-09-26T05:29:53.977Z",
      "hasPreview": true,
      "servingUrl": "/api/v1/reports/REP-MUHYABSC-BE9562/media/ATT-MUHYABSP-776C02"
    }
  ],
  "attachments": [
    {
      "id": "ATT-MUHYABSP-776C02",
      "mediaType": "IMAGE",
      "mimeType": "image/png",
      "byteSize": 70,
      "uploadStatus": "COMPLETED"
    }
  ]
}
```

### POST `/api/v1/reports` (Out-of-Boundary Location Response)
```json
{
  "success": true,
  "serverReportId": "REP-MUHYABTB-34D3A1",
  "clientReportId": "CLI-OUT-1774676394001",
  "hazardType": "ROAD_BLOCKAGE",
  "description": "LOCATION-OUTSIDE-NER-TEST-1774676394001",
  "latitude": 23.3038,
  "longitude": 77.3397,
  "district": "UNRESOLVED",
  "state": "North East India",
  "locationResolutionStatus": "OUTSIDE_SERVICE_REGION",
  "qualityFlags": [
    "DISTRICT_COORDINATE_MISMATCH"
  ],
  "userWarning": "This location is currently outside the configured NER monitoring region. Please confirm location or use manual map pin.",
  "verificationStatus": "UNDER_VERIFICATION",
  "status": "UNDER_VERIFICATION",
  "attachmentMetadata": []
}
```

## 5. Remaining Blockers
- **None**: Media persistence, attachment metadata return, secure streaming, location bounding box checks, and officer UI media rendering are completely functional and verified.
