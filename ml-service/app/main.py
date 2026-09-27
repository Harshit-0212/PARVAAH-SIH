"""
app/main.py
===========
FastAPI application entry point for PARVAAH XGBoost ML Service.
"""

import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import (
    HealthResponse,
    PredictRequest,
    PredictResponse,
    DemoPredictRequest,
    DemoPredictResponse,
)
from app.model_loader import model_container, probability_to_risk_level

# Configure structured application logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ml_service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager: loads the ML model once on startup."""
    logger.info("Initializing PARVAAH ML-Service...")
    loaded = model_container.load()
    if loaded:
        logger.info("Model loaded successfully on startup.")
    else:
        logger.warning("Startup completed without model: MODEL_NOT_AVAILABLE")
    yield
    logger.info("Shutting down PARVAAH ML-Service.")


app = FastAPI(
    title="PARVAAH XGBoost ML Service",
    description="Local inference microservice for PARVAAH landslide risk assessment practice.",
    version="1.0.0",
    lifespan=lifespan,
)

# ------------------------------------------------------------------------------
# CORS Middleware
# ------------------------------------------------------------------------------
# Default to local development origin; restrict wildcards
env_origins = os.getenv("CORS_ORIGINS", "")
allowed_origins: List[str] = [
    origin.strip() for origin in env_origins.split(",") if origin.strip()
]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------------------
@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health & Model Readiness Check",
    tags=["System"],
)
async def health_check():
    """
    Returns system status, readiness, and loaded model metadata.
    Does not expose server paths, environment variables, or secrets.
    """
    server_time = datetime.now(timezone.utc).isoformat()
    disclaimer = (
        "Practice-only synthetic model. "
        "Not a real landslide warning or evacuation decision."
    )

    if model_container.is_loaded:
        return HealthResponse(
            ok=True,
            service="PARVAAH XGBoost ML Service",
            modelLoaded=True,
            modelAvailable=True,
            modelVersion=model_container.model_version,
            modelMode=model_container.model_mode,
            serverTime=server_time,
            disclaimer=disclaimer,
        )
    else:
        content = {
            "ok": False,
            "service": "PARVAAH XGBoost ML Service",
            "modelLoaded": False,
            "modelAvailable": False,
            "modelVersion": "UNKNOWN",
            "modelMode": "MODEL_NOT_AVAILABLE",
            "serverTime": server_time,
            "disclaimer": disclaimer,
        }
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=content,
        )


@app.post(
    "/predict",
    response_model=PredictResponse,
    summary="Run Landslide Risk Inference (Legacy 6-feature)",
    tags=["Inference"],
)
async def predict_risk(payload: PredictRequest):
    """
    Calculates landslide probability and risk score from the legacy 6-feature schema.
    Inputs are strictly validated via Pydantic.
    """
    if not model_container.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is currently unavailable or not loaded.",
        )

    input_data = payload.model_dump()

    try:
        prob, score, level = model_container.predict(input_data)
    except Exception as err:
        logger.error("Inference execution failure: %s", type(err).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed due to an internal calculation error.",
        )

    return PredictResponse(
        modelVersion=model_container.model_version,
        modelMode=model_container.model_mode,
        modelAvailable=True,
        landslideProbability=prob,
        riskScore=score,
        riskLevel=level,
        calculatedAt=datetime.now(timezone.utc).isoformat(),
        inputSummary=input_data,
        disclaimer=(
            "Practice-only synthetic model output. "
            "Not a real landslide warning, official warning, or evacuation decision."
        ),
    )


def _evac_recommendation(score: float) -> str:
    """Derive AI evacuation recommendation from risk score. Never issues mandatory orders."""
    if score >= 75:
        return "PREPARE_TO_EVACUATE"
    if score >= 50:
        return "PREPARE_TO_EVACUATE"
    if score >= 25:
        return "MONITOR_SITUATION"
    return "NO_ADVICE"


@app.post(
    "/api/v1/risk/predict",
    response_model=DemoPredictResponse,
    summary="Run Landslide Risk Inference (Demo XGBoost 7-feature)",
    tags=["Inference"],
)
async def predict_risk_demo(payload: DemoPredictRequest):
    """
    Calculates landslide probability and risk score using the demo_xgboost_v1 model
    trained on the balanced dataset (561 positive + 561 negative events).

    Features: rainfall_24h_mm, rainfall_48h_mm, rainfall_7d_mm,
              soil_moisture_percent, slope_degrees, elevation_m,
              historical_landslide_density (0–1 normalized).

    Returns risk_score (0–100), risk_level, model_mode = DEMO_XGBOOST,
    and evacuation_recommendation. Official evacuation_status is always NO_ADVICE
    unless changed by an authorised officer action.
    """
    if not model_container.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is currently unavailable or not loaded.",
        )

    input_data = payload.model_dump()

    try:
        prob, score, level = model_container.predict(input_data)
    except KeyError as err:
        # Feature mismatch – model may be the legacy practice model, not demo
        logger.error(
            "Feature mismatch for /api/v1/risk/predict: %s. "
            "Loaded model is '%s', expected DEMO_XGBOOST.",
            err,
            model_container.model_mode,
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Feature mismatch: loaded model ({model_container.model_mode}) "
                "does not accept the 7-feature demo schema. "
                "Ensure demo_xgboost_v1.json and its metadata are present in ml-service/models/."
            ),
        )
    except Exception as err:
        logger.error("Inference execution failure: %s", type(err).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed due to an internal calculation error.",
        )

    evac = _evac_recommendation(score)

    return DemoPredictResponse(
        modelVersion=model_container.model_version,
        modelMode=model_container.model_mode,
        modelAvailable=True,
        landslideProbability=prob,
        riskScore=score,
        riskLevel=level,
        evacuationRecommendation=evac,
        calculatedAt=datetime.now(timezone.utc).isoformat(),
        inputSummary=input_data,
        disclaimer=(
            "Demo/research model output only. "
            "Not a real landslide warning, official warning, or evacuation decision."
        ),
    )


# ------------------------------------------------------------------------------
# SIH26191 Alignment: Hazard-Based Red Zones & Carrying Capacity Endpoints
# ------------------------------------------------------------------------------

@app.get(
    "/api/v1/red-zones",
    summary="Get Aggregated Hazard-Based Red Zones",
    tags=["SIH26191 Alignment"],
)
async def get_red_zones():
    """
    Loads zone_risk_summary_v1.csv and joins with relocation_plan_v1.csv (or proxy calculation).
    Returns JSON array with exact fields:
      state, district, zone_risk_level, red_zone_flag,
      total_points, population_families, priority,
      centroid_lat, centroid_lon
    """
    import pandas as pd
    from pathlib import Path

    base_dir = Path(__file__).resolve().parent.parent
    summary_path = base_dir / "data" / "processed" / "zone_risk_summary_v1.csv"
    plan_path = base_dir / "data" / "processed" / "relocation_plan_v1.csv"

    if summary_path.exists():
        try:
            zones_df = pd.read_csv(summary_path)
            if plan_path.exists():
                plan_df = pd.read_csv(plan_path)
                plan_cols = [c for c in ["state", "district", "population_families", "priority", "vulnerability_score", "recommended_site_ids", "relocation_feasibility"] if c in plan_df.columns]
                merged = zones_df.merge(
                    plan_df[plan_cols],
                    on=["state", "district"],
                    how="left",
                )
            else:
                merged = zones_df.copy()
                merged["population_families"] = (merged["total_points"] * 5).astype(int)
                merged["priority"] = merged["zone_risk_level"].apply(
                    lambda lvl: "IMMEDIATE" if lvl == "CRITICAL" else ("SHORT_TERM" if lvl == "HIGH" else "MEDIUM_TERM")
                )
                merged["vulnerability_score"] = merged["zone_risk_level"].apply(
                    lambda lvl: 80 if lvl == "CRITICAL" else (65 if lvl == "HIGH" else 50)
                )

            # Fill missing values for non-red zones
            merged["population_families"] = merged["population_families"].fillna((merged["total_points"] * 5)).astype(int)
            merged["priority"] = merged["priority"].fillna(
                merged["zone_risk_level"].apply(
                    lambda lvl: "IMMEDIATE" if lvl == "CRITICAL" else ("SHORT_TERM" if lvl == "HIGH" else "MEDIUM_TERM")
                )
            )
            merged["vulnerability_score"] = merged["vulnerability_score"].fillna(
                merged["zone_risk_level"].apply(
                    lambda lvl: 80 if lvl == "CRITICAL" else (65 if lvl == "HIGH" else 50)
                )
            ).astype(int)

            if "flood_risk_level" not in merged.columns:
                merged["flood_risk_level"] = "LOW"
            if "flood_red_zone_flag" not in merged.columns:
                merged["flood_red_zone_flag"] = False

            # Select output fields
            output_fields = [
                "state",
                "district",
                "zone_risk_level",
                "red_zone_flag",
                "total_points",
                "population_families",
                "priority",
                "vulnerability_score",
                "flood_risk_level",
                "flood_red_zone_flag",
                "centroid_lat",
                "centroid_lon",
            ]
            if "recommended_site_ids" in merged.columns:
                output_fields.append("recommended_site_ids")
            if "relocation_feasibility" in merged.columns:
                output_fields.append("relocation_feasibility")
            if "flood_risk_score" in merged.columns:
                output_fields.append("flood_risk_score")

            merged_subset = merged[output_fields]
            return JSONResponse(content=merged_subset.to_dict(orient="records"))
        except Exception as e:
            logger.warning("Failed parsing zone summary CSV: %s", e)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Zone risk summary data not found. Please run aggregate_zone_risk.py first."
    )



@app.get(
    "/api/v1/safer-sites",
    summary="Get Safe Relocation Sites for Carrying Capacity Assessment",
    tags=["SIH26191 Alignment"],
)
async def get_safer_sites():
    """
    Returns safer relocation sites dataset for carrying capacity assessment.
    Includes site_id, site_name, state, district, safe_from_landslides,
    capacity_families, capacity_people, latitude, longitude.
    """
    import pandas as pd
    from pathlib import Path

    base_dir = Path(__file__).resolve().parent.parent
    sites_path = base_dir / "data" / "sample" / "safer_relocation_sites_demo.csv"
    sample_json = base_dir / "data" / "sample" / "safer_sites_demo.json"

    if sites_path.exists():
        try:
            sites_df = pd.read_csv(sites_path)
            return JSONResponse(content=sites_df.to_dict(orient="records"))
        except Exception as e:
            logger.warning("Failed parsing safer sites CSV, falling back to static JSON: %s", e)

    if sample_json.exists():
        import json
        with open(sample_json, "r", encoding="utf-8") as f:
            return JSONResponse(content=json.load(f))

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Safer relocation sites dataset not found."
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)

