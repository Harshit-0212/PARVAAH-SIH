"""
tests/test_health.py
====================
Automated test suite for GET /health endpoint.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.model_loader import model_container


def test_health_when_model_exists():
    """Test health endpoint under normal conditions with loaded model."""
    # Ensure model is loaded
    model_container.load()

    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["service"] == "PARVAAH XGBoost ML Service"
        assert data["modelLoaded"] is True
        assert data["modelAvailable"] is True
        assert data["modelVersion"] == "practice-xgboost-v1"
        assert data["modelMode"] == "PRACTICE_XGBOOST"
        assert "serverTime" in data
        assert "disclaimer" in data
        # Ensure no internal paths or secrets are in the payload
        assert "file" not in str(data).lower()
        assert "path" not in str(data).lower()


def test_health_when_model_missing():
    """Test health endpoint when model is unavailable."""
    original_state = model_container.is_loaded
    try:
        with TestClient(app) as client:
            model_container.is_loaded = False
            response = client.get("/health")
            assert response.status_code == 503
            data = response.json()
            assert data["ok"] is False
            assert data["modelLoaded"] is False
            assert data["modelAvailable"] is False
            assert data["modelMode"] == "MODEL_NOT_AVAILABLE"
            assert "disclaimer" in data
            # Ensure safe output without traceback
            assert "traceback" not in str(data).lower()
    finally:
        model_container.is_loaded = original_state
