"""
app/model_loader.py
===================
Model loading, caching, and inference utilities for PARVAAH ML-Service.
"""

import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import joblib
import numpy as np
from xgboost import XGBClassifier

logger = logging.getLogger("ml_service.model_loader")

# Base paths (ml-service/)
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
DEMO_MODEL_PATH = MODEL_DIR / "demo_xgboost_v1.json"
DEMO_METADATA_PATH = MODEL_DIR / "demo_xgboost_v1_metadata.joblib"
EXCEL_PILOT_MODEL_PATH = MODEL_DIR / "xgboost_excel_pilot_v1.json"
EXCEL_PILOT_METADATA_PATH = MODEL_DIR / "xgboost_excel_pilot_v1_metadata.joblib"
DEFAULT_MODEL_PATH = MODEL_DIR / "xgboost_landslide_practice.json"
DEFAULT_METADATA_PATH = MODEL_DIR / "xgboost_landslide_practice_metadata.joblib"

DISCLAIMER_PREDICT = (
    "Academic decision-support model output. "
    "Not a real landslide warning, official warning, or evacuation decision."
)


def probability_to_risk_level(score: float) -> str:
    """
    Map a 0-100 risk score to its corresponding risk category.

    Thresholds:
      0-24   -> LOW
      25-49  -> MODERATE
      50-74  -> HIGH
      75-100 -> CRITICAL
    """
    if score < 25.0:
        return "LOW"
    elif score < 50.0:
        return "MODERATE"
    elif score < 75.0:
        return "HIGH"
    else:
        return "CRITICAL"


class ModelContainer:
    """Singleton container to load and hold the XGBoost model and metadata."""

    def __init__(
        self,
        model_path: Optional[Path] = None,
        metadata_path: Optional[Path] = None,
    ):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.model: Optional[XGBClassifier] = None
        self.metadata: Optional[Dict[str, Any]] = None
        self.feature_columns: List[str] = []
        self.model_version: str = "UNKNOWN"
        self.model_mode: str = "MODEL_NOT_AVAILABLE"
        self.is_loaded: bool = False

    def load(self) -> bool:
        """
        Loads the XGBoost model and metadata from disk.
        Prioritizes validated Excel pilot model, falling back to practice model.
        Returns True if loaded successfully, False otherwise.
        """
        try:
            # Priority: demo_xgboost_v1 > excel_pilot > practice
            if DEMO_MODEL_PATH.exists() and DEMO_METADATA_PATH.exists():
                self.model_path = DEMO_MODEL_PATH
                self.metadata_path = DEMO_METADATA_PATH
                self.model_mode = "DEMO_XGBOOST"
            elif EXCEL_PILOT_MODEL_PATH.exists() and EXCEL_PILOT_METADATA_PATH.exists():
                self.model_path = EXCEL_PILOT_MODEL_PATH
                self.metadata_path = EXCEL_PILOT_METADATA_PATH
                self.model_mode = "EXCEL_PILOT_XGBOOST"
            elif DEFAULT_MODEL_PATH.exists() and DEFAULT_METADATA_PATH.exists():
                self.model_path = DEFAULT_MODEL_PATH
                self.metadata_path = DEFAULT_METADATA_PATH
                self.model_mode = "PRACTICE_XGBOOST"
            else:
                logger.warning("No model or metadata file exists on disk.")
                self.is_loaded = False
                self.model_mode = "MODEL_NOT_AVAILABLE"
                return False

            # Load metadata
            self.metadata = joblib.load(self.metadata_path)
            self.feature_columns = self.metadata.get("feature_columns", [])
            self.model_version = self.metadata.get("model_version", "practice-xgboost-v1")
            if "model_mode" in self.metadata:
                self.model_mode = self.metadata["model_mode"]

            # Load XGBoost model
            model = XGBClassifier()
            model.load_model(str(self.model_path))
            self.model = model
            self.is_loaded = True
            logger.info("Successfully loaded XGBoost model (version: %s, mode: %s)", self.model_version, self.model_mode)
            return True

        except Exception as err:
            logger.error("Failed to load model or metadata: %s", type(err).__name__)
            self.model = None
            self.metadata = None
            self.is_loaded = False
            self.model_mode = "MODEL_NOT_AVAILABLE"
            return False

    def predict(self, input_dict: Dict[str, Any]) -> Tuple[float, float, str]:
        """
        Run inference using the loaded model.
        Features are ordered strictly according to self.feature_columns.

        Returns:
            (landslide_probability, risk_score, risk_level)
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("MODEL_NOT_AVAILABLE")

        # Guarantee exact feature order from training metadata
        ordered_values = [float(input_dict[col]) for col in self.feature_columns]
        feature_matrix = np.array(ordered_values, dtype=float).reshape(1, -1)

        probabilities = self.model.predict_proba(feature_matrix)
        landslide_prob = float(probabilities[0][1])

        # Risk score 0 to 100 with 1 decimal precision
        risk_score = round(landslide_prob * 100.0, 1)
        risk_level = probability_to_risk_level(risk_score)

        return landslide_prob, risk_score, risk_level


# Global container instance
model_container = ModelContainer()
