"""
tests/test_predict.py
=====================
Automated test suite for POST /predict endpoint.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.model_loader import model_container

HIGH_RISK_SAMPLE = {
    "rainfall_24h_mm": 115.0,
    "forecast_rainfall_24h_mm": 128.0,
    "soil_moisture_percent": 93.0,
    "slope_degrees": 45.0,
    "historical_landslide_density": 0.88,
    "verified_report_count": 9,
}

LOW_RISK_SAMPLE = {
    "rainfall_24h_mm": 10.0,
    "forecast_rainfall_24h_mm": 6.0,
    "soil_moisture_percent": 32.0,
    "slope_degrees": 11.0,
    "historical_landslide_density": 0.04,
    "verified_report_count": 0,
}


def test_predict_high_risk_success():
    """Predict endpoint returns expected fields, score in 0-100, and valid high/critical label."""
    model_container.load()
    with TestClient(app) as client:
        response = client.post("/predict", json=HIGH_RISK_SAMPLE)
        assert response.status_code == 200
        data = response.json()

        assert data["modelVersion"] == "practice-xgboost-v1"
        assert data["modelMode"] == "PRACTICE_XGBOOST"
        assert data["modelAvailable"] is True
        assert 0.0 <= data["landslideProbability"] <= 1.0
        assert 0.0 <= data["riskScore"] <= 100.0
        assert data["riskLevel"] in ["HIGH", "CRITICAL"]
        assert "calculatedAt" in data
        assert data["inputSummary"]["rainfall_24h_mm"] == 115.0
        assert "Practice-only" in data["disclaimer"]


def test_predict_low_risk_success():
    """Predict endpoint returns LOW risk label for low-risk terrain/weather inputs."""
    model_container.load()
    with TestClient(app) as client:
        response = client.post("/predict", json=LOW_RISK_SAMPLE)
        assert response.status_code == 200
        data = response.json()

        assert 0.0 <= data["landslideProbability"] <= 1.0
        assert 0.0 <= data["riskScore"] <= 100.0
        assert data["riskLevel"] == "LOW"


def test_predict_invalid_negative_rainfall():
    """Negative rainfall should be rejected with 422 Unprocessable Entity."""
    invalid_input = HIGH_RISK_SAMPLE.copy()
    invalid_input["rainfall_24h_mm"] = -10.0

    with TestClient(app) as client:
        response = client.post("/predict", json=invalid_input)
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data


def test_predict_invalid_soil_moisture_above_100():
    """Soil moisture exceeding 100% should be rejected with 422."""
    invalid_input = HIGH_RISK_SAMPLE.copy()
    invalid_input["soil_moisture_percent"] = 105.0

    with TestClient(app) as client:
        response = client.post("/predict", json=invalid_input)
        assert response.status_code == 422


def test_predict_when_model_missing():
    """Predict endpoint must return safe 503 when model is not available."""
    original_state = model_container.is_loaded
    try:
        with TestClient(app) as client:
            model_container.is_loaded = False
            response = client.post("/predict", json=HIGH_RISK_SAMPLE)
            assert response.status_code == 503
            data = response.json()
            assert "unavailable" in data["detail"].lower()
            # Ensure no system paths leaked
            assert "c:\\" not in str(data).lower()
            assert "/users" not in str(data).lower()
    finally:
        model_container.is_loaded = original_state
