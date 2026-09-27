# ml-service — XGBoost Practice & Local Inference Workspace

> ⚠️ **SYNTHETIC PRACTICE ONLY**
> This workspace contains a standalone XGBoost learning model and local FastAPI inference microservice using **100% synthetic (computer-generated) data**.
> It is **completely isolated** from the PARVAAH Next.js frontend, Express/Node backend, MongoDB Atlas database, Leaflet map, IMD integration, citizen reporting, and rule-based risk engine.
> Nothing in this directory connects to or modifies those production systems.

---

## What This Workspace Does

```
Synthetic CSV  →  XGBoost training  →  Saved model files  →  FastAPI local microservice (Port 8001)
```

| Component | File / Directory | Purpose |
|---|---|---|
| Data | `data/landslide_training_practice.csv` | 50-row synthetic practice dataset |
| Data Docs | `data/README.md` | Feature definitions & why real data is needed |
| Training | `training/train_model.py` | Load CSV → train XGBoost → save model & metrics |
| Script Prediction | `predict_once.py` | CLI test with sample high-risk & low-risk inputs |
| Models | `models/` | Serialized model (`.json`), metadata (`.joblib`), metrics (`.json`) |
| FastAPI App | `app/main.py`, `app/schemas.py`, `app/model_loader.py` | HTTP microservice running on port `8001` |
| Automated Tests | `tests/test_health.py`, `tests/test_predict.py` | Pytest suite validating health & inference endpoints |

---

## Directory Structure

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py                          ← FastAPI application & endpoints
│   ├── schemas.py                       ← Pydantic request/response schemas
│   └── model_loader.py                  ← Model caching & inference logic
├── data/
│   ├── landslide_training_practice.csv   ← Synthetic practice dataset
│   └── README.md                         ← Feature descriptions
├── models/
│   ├── .gitkeep
│   ├── xgboost_landslide_practice.json   ← Trained model (JSON format)
│   ├── xgboost_landslide_practice_metadata.joblib  ← Feature order & version
│   └── practice_metrics.json            ← Confusion matrix & evaluation metrics
├── tests/
│   ├── test_health.py                   ← Health check tests
│   └── test_predict.py                  ← Prediction validation & edge cases
├── training/
│   └── train_model.py                   ← Offline model training script
├── predict_once.py                      ← Single CLI test prediction
├── requirements.txt                     ← Python package requirements
├── pytest.ini                           ← Pytest configuration
├── .env.example                         ← Environment variables template
├── README.md                            ← This documentation
└── .gitignore
```

---

## Step-by-Step Setup Guide

### 1 — Verify Python Installation

Open a terminal and verify Python:

```bash
python --version
```

Recommended: **Python 3.10 to 3.13**.

---

### 2 — Navigate to ml-service

#### Windows PowerShell
```powershell
cd C:\Users\HP\Downloads\PARVAAH\ml-service
```

#### Windows Command Prompt
```cmd
cd C:\Users\HP\Downloads\PARVAAH\ml-service
```

#### macOS / Linux
```bash
cd ~/Downloads/PARVAAH/ml-service
```

---

### 3 — Create and Activate Virtual Environment

#### Windows PowerShell
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

> **PowerShell Execution Policy Note**: If you see `.venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled`, run this command once:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

#### Windows Command Prompt
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

#### macOS / Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### 4 — Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 5 — Train the Model (If Not Already Trained)

```bash
python training/train_model.py
```

This trains the XGBoost binary classifier on `data/landslide_training_practice.csv` and saves the model artifacts into `models/`.

---

### 6 — Run the FastAPI Server

```powershell
uvicorn app.main:app --reload --port 8001
```

The service will start locally on:
- API Root: `http://127.0.0.1:8001`
- Interactive API Docs (Swagger UI): `http://127.0.0.1:8001/docs`
- Health Check: `http://127.0.0.1:8001/health`

---

### 7 — Test the Endpoints

#### 1. Health Endpoint (`GET /health`)
Open in your browser:
```text
http://127.0.0.1:8001/health
```
Expected response:
```json
{
  "ok": true,
  "service": "PARVAAH XGBoost ML Service",
  "modelLoaded": true,
  "modelAvailable": true,
  "modelVersion": "practice-xgboost-v1",
  "modelMode": "PRACTICE_XGBOOST",
  "serverTime": "2026-09-15T08:36:46.000000Z",
  "disclaimer": "Practice-only synthetic model. Not a real landslide warning or evacuation decision."
}
```

#### 2. Run Single Prediction via cURL (`POST /predict`)
Open a new terminal window and run:

```bash
curl -X POST "http://127.0.0.1:8001/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "rainfall_24h_mm": 115,
    "forecast_rainfall_24h_mm": 128,
    "soil_moisture_percent": 93,
    "slope_degrees": 45,
    "historical_landslide_density": 0.88,
    "verified_report_count": 9
  }'
```

Expected response:
```json
{
  "modelVersion": "practice-xgboost-v1",
  "modelMode": "PRACTICE_XGBOOST",
  "modelAvailable": true,
  "landslideProbability": 0.932,
  "riskScore": 93.2,
  "riskLevel": "CRITICAL",
  "calculatedAt": "2026-09-15T09:12:00.000000Z",
  "inputSummary": {
    "rainfall_24h_mm": 115.0,
    "forecast_rainfall_24h_mm": 128.0,
    "soil_moisture_percent": 93.0,
    "slope_degrees": 45.0,
    "historical_landslide_density": 0.88,
    "verified_report_count": 9
  },
  "disclaimer": "Practice-only synthetic model output. Not a real landslide warning, official warning, or evacuation decision."
}
```

---

### 8 — Run Automated Tests

To execute the full test suite with Pytest:

```powershell
python -m pytest tests
```

Tests cover:
1. Normal health check with model loaded.
2. Safe degraded health response (503) when model is missing.
3. High-risk sample inference (CRITICAL/HIGH label, score 0–100).
4. Low-risk sample inference (LOW label).
5. Validation: Negative rainfall rejection (HTTP 422).
6. Validation: Soil moisture above 100% rejection (HTTP 422).
7. Missing model inference error handling (HTTP 503 without file paths or tracebacks).

---

## Risk Score Calibration (Practice Only)

| Score Range | Risk Level |
|---|---|
| `0 – 24` | **LOW** |
| `25 – 49` | **MODERATE** |
| `50 – 74` | **HIGH** |
| `75 – 100` | **CRITICAL** |

---

## Disclaimer

> **Practice-only synthetic-model result. Not a real landslide warning or evacuation decision.**
>
> All training data and inferences in this service are computer-generated. This service is designed solely as an ML API development exercise. It is **NOT** connected to official India Meteorological Department (IMD) feeds, Geological Survey of India (GSI) inventory, or NDMA/SDMA warning systems. It must **never** be used for real life-safety, public warning, or evacuation decisions.
