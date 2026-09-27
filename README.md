# PARVAAH • SIH26191
> **Intelligent Red-Zone Identification & Relocation Planning for the North Eastern Region**

PARVAAH (परवाह) is an institutional-grade, multi-service disaster early-warning, hazard zone identification, and relocation planning platform designed specifically for the complex geological and meteorological conditions of the North Eastern Region of India (Assam, Arunachal Pradesh, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, and Sikkim).

---

## 🏗️ Repository Architecture

The project is organized into modular, independently deployable services:

```
parvaah-sih26191/
├── frontend/           # React 19 + TypeScript + Vite + Tailwind CSS GIS Client
├── backend/            # Express + TypeScript + Zod Validation REST API (Port 5000)
├── ml-service/         # FastAPI + XGBoost Hazard Inference Microservice (Port 8001)
├── ingestion/          # ETL data pipelines & dataset preparation scripts
├── docs/               # Architecture, API specifications, and SIH alignment docs
├── scripts/            # Development automation and data seeding utilities
├── .gitignore          # Root-level ignore rules across Node, Python & outputs
├── README.md           # Master documentation and quickstart instructions
└── THIRD_PARTY_NOTICES.md # Open-source licenses and attribution
```

---

## ⚡ Tech Stack Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet GIS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Zod Schema Validation, Mongoose (MongoDB)
- **Machine Learning**: Python 3.10+, FastAPI, XGBoost, Scikit-Learn, Pandas, NumPy
- **Data Ingestion**: Python ETL pipelines for GIS and landslide hazard catalogs
- **Resilience**: Offline-first reporting queue with browser caching & automatic reconnect sync

---

## 🚀 Quick Start Guide

### 1. Backend Service
```bash
cd backend
npm install
cp .env.example .env

# Run development server (Port 5000)
npm run dev

# Run test suite
npm test
```

### 2. Frontend Application
```bash
cd frontend
npm install
cp .env.example .env

# Run development server (Port 5173)
npm run dev

# Build production bundle
npm run build
```

### 3. ML Service (Optional / Microservice)
```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run inference service on Port 8001
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### 4. Running Concurrently
You can launch both frontend and backend using our helper script:
```bash
bash scripts/run-dev.sh
```

---

## 📚 Documentation & Specifications

Explore in-depth documentation in the [`docs/`](docs/) directory:
- [System Architecture](docs/architecture.md) — Comprehensive technical design & IPC flow
- [API Documentation](docs/api.md) — REST endpoints, parameters, and payloads
- [Data Sources](docs/data-sources.md) — IMD, GSI, and terrain datasets description
- [SIH Presentation Mapping](docs/sih_presentation.md) — SIH26191 problem alignment matrix

---

## 🛡️ Operational Data Governance
All prototype hazard telemetry is simulated for testing and mock disaster drills unless explicitly labeled as verified by an authorized state disaster management agency.
