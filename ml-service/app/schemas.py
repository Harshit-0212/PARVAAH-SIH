"""
app/schemas.py
==============
Pydantic request and response schemas for PARVAAH ML-Service.
"""

from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    ok: bool
    service: str = "PARVAAH XGBoost ML Service"
    modelLoaded: bool
    modelAvailable: bool
    modelVersion: str
    modelMode: str
    serverTime: str
    disclaimer: str = (
        "Practice-only synthetic model. "
        "Not a real landslide warning or evacuation decision."
    )


# ---------------------------------------------------------------------------
# Legacy 6-feature schema (practice / excel-pilot models)
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    rainfall_24h_mm: float = Field(
        ...,
        ge=0.0,
        le=3000.0,
        description="Observed rainfall accumulated over the past 24 hours (0 to 3000 mm)",
        examples=[115.0],
    )
    forecast_rainfall_24h_mm: float = Field(
        ...,
        ge=0.0,
        le=3000.0,
        description="Forecast rainfall for the next 24 hours (0 to 3000 mm)",
        examples=[128.0],
    )
    soil_moisture_percent: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Soil moisture level (0 to 100 %)",
        examples=[93.0],
    )
    slope_degrees: float = Field(
        ...,
        ge=0.0,
        le=90.0,
        description="Terrain slope angle (0 to 90 degrees)",
        examples=[45.0],
    )
    historical_landslide_density: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Historical landslide density (0 to 1 normalized)",
        examples=[0.88],
    )
    verified_report_count: int = Field(
        ...,
        ge=0,
        le=100,
        description="Verified citizen or agency reports count (0 to 100)",
        examples=[9],
    )


# ---------------------------------------------------------------------------
# Demo 7-feature schema (demo_xgboost_v1 trained on balanced dataset)
# ---------------------------------------------------------------------------

class DemoPredictRequest(BaseModel):
    rainfall_24h_mm: float = Field(
        ...,
        ge=0.0,
        le=3000.0,
        description="Observed rainfall accumulated over the past 24 hours (mm)",
        examples=[120.0],
    )
    rainfall_48h_mm: float = Field(
        ...,
        ge=0.0,
        le=5000.0,
        description="Observed rainfall accumulated over the past 48 hours (mm)",
        examples=[220.0],
    )
    rainfall_7d_mm: float = Field(
        ...,
        ge=0.0,
        le=10000.0,
        description="Observed rainfall accumulated over the past 7 days (mm)",
        examples=[580.0],
    )
    soil_moisture_percent: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Soil moisture level (0 to 100 %)",
        examples=[87.0],
    )
    slope_degrees: float = Field(
        ...,
        ge=0.0,
        le=90.0,
        description="Terrain slope angle (0 to 90 degrees)",
        examples=[38.0],
    )
    elevation_m: float = Field(
        ...,
        ge=0.0,
        le=8850.0,
        description="Elevation above mean sea level (metres)",
        examples=[1250.0],
    )
    historical_landslide_density: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Historical landslide density (raw count per grid cell, 0–100; training data range 0–83)",
        examples=[24.3],
    )


# ---------------------------------------------------------------------------
# Shared response schema
# ---------------------------------------------------------------------------

class PredictResponse(BaseModel):
    modelVersion: str
    modelMode: str = "PRACTICE_XGBOOST"
    modelAvailable: bool
    landslideProbability: float
    riskScore: float
    riskLevel: str
    calculatedAt: str
    inputSummary: Dict[str, Any]
    disclaimer: str = (
        "Practice-only synthetic model output. "
        "Not a real landslide warning, official warning, or evacuation decision."
    )


class DemoPredictResponse(BaseModel):
    modelVersion: str
    modelMode: str = "DEMO_XGBOOST"
    modelAvailable: bool
    landslideProbability: float
    riskScore: float
    riskLevel: str
    evacuationRecommendation: str
    calculatedAt: str
    inputSummary: Dict[str, Any]
    disclaimer: str = (
        "Demo/research model output only. "
        "Not a real landslide warning, official warning, or evacuation decision."
    )
