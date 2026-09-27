# System Architecture & Design — PARVAAH (SIH26191)

## 1. High-Level Architecture Overview

PARVAAH is an intelligent, multi-service disaster early-warning, hazard zone identification, and relocation planning platform designed specifically for the North Eastern Region of India.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND APPLICATION                            │
│           React 19 + TypeScript + Vite + Tailwind CSS                  │
│       Interactive GIS (Leaflet / WGS84) + Incident Command             │
│            Red-Zone Relocation Dashboard & Simulator                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         REST API   │ HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     NODE.JS / EXPRESS BACKEND                          │
│               TypeScript + Zod Validated REST Engine                   │
│                                                                        │
│   • Middleware: Request Tracing, Logger, Error Boundary                │
│   • Controllers: Health, Incidents, Weather, Risk Scoring, Road Status │
│   • Core Logic: Multi-Factor Weighted Risk Scoring & Citizen Triaging  │
│   • Data Providers: IMD Adaptors, Sensor Feeds, MongoDB / In-Memory    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ HTTP / REST IPC (Port 8001)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PYTHON FASTAPI ML SERVICE                          │
│             Scikit-Learn + XGBoost Classifier & Inference              │
│                                                                        │
│   • Landslide / Hazard Probability Engine                              │
│   • Habitat Vulnerability & Relocation Urgency Estimator               │
│   • Pilot Dataset Ingestion & Feature Preprocessing                    │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Directory Layout & Multi-Service Decoupling

- **`frontend/`**: Vite + React 19 SPA client containing user interfaces for citizens, field officers (BRO/PWD), and district command admins.
- **`backend/`**: Node.js/Express TypeScript backend providing authenticated endpoints, data persistence, and caching.
- **`ml-service/`**: Python FastAPI microservice housing model training pipelines, XGBoost hazard classifiers, and prediction endpoints.
- **`ingestion/`**: Standalone data pipelines, dataset sanitizers, and feature engineering scripts.
- **`docs/`**: Comprehensive architectural, endpoint, data source, and SIH problem alignment documentation.
- **`scripts/`**: Orchestration and seeding scripts for quick development setup.

## 3. Communication Protocols
- Client to Backend: REST API on `http://localhost:5000/api/v1` (with Vite reverse-proxy support).
- Backend to ML Service: REST JSON calls on `http://127.0.0.1:8001`.
- Offline Operations: Local browser storage synchronization with idempotency via `clientReportId`.
