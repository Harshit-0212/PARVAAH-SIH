"""
predict_once.py
===============
Run a single prediction using the saved XGBoost practice model.

PURPOSE
-------
Demonstrates how to load the trained model and metadata, then predict
landslide probability for two manually defined sample inputs.

!! DISCLAIMER
--------------
This script uses a SYNTHETIC PRACTICE MODEL trained on computer-generated data.
Output probabilities and risk labels DO NOT represent real landslide risk.
This tool MUST NOT be used for real warnings, evacuation decisions,
or any operational purpose.

Run this script AFTER training:
  python training/train_model.py
  python predict_once.py
"""

import io
import json
import sys
from pathlib import Path

# Force UTF-8 output on Windows (avoids cp1252 UnicodeEncodeError)
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
from xgboost import XGBClassifier
import joblib

# ──────────────────────────────────────────────────────────────────────────────
# PATHS
# ──────────────────────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent.resolve()  # ml-service/
MODEL_DIR = ROOT_DIR / "models"
MODEL_PATH = MODEL_DIR / "xgboost_landslide_practice.json"
METADATA_PATH = MODEL_DIR / "xgboost_landslide_practice_metadata.joblib"
METRICS_PATH = MODEL_DIR / "practice_metrics.json"

# ──────────────────────────────────────────────────────────────────────────────
# RISK LABEL THRESHOLDS
# ──────────────────────────────────────────────────────────────────────────────
def probability_to_risk(prob: float) -> tuple:
    """
    Convert raw XGBoost probability (0-1) to a 0-100 risk score and label.

    Thresholds (practice-only, not officially calibrated):
      0-24   -> LOW
      25-49  -> MODERATE
      50-74  -> HIGH
      75-100 -> CRITICAL
    """
    score = int(round(prob * 100))
    if score < 25:
        label = "LOW"
    elif score < 50:
        label = "MODERATE"
    elif score < 75:
        label = "HIGH"
    else:
        label = "CRITICAL"
    return score, label


# ──────────────────────────────────────────────────────────────────────────────
# SAMPLE INPUTS
# ──────────────────────────────────────────────────────────────────────────────
# Each dict key must match the exact feature names from training metadata.
SAMPLE_HIGH_RISK = {
    "rainfall_24h_mm": 115.0,
    "forecast_rainfall_24h_mm": 128.0,
    "soil_moisture_percent": 93.0,
    "slope_degrees": 45.0,
    "historical_landslide_density": 0.88,
    "verified_report_count": 9,
}

SAMPLE_LOW_RISK = {
    "rainfall_24h_mm": 10.0,
    "forecast_rainfall_24h_mm": 6.0,
    "soil_moisture_percent": 32.0,
    "slope_degrees": 11.0,
    "historical_landslide_density": 0.04,
    "verified_report_count": 0,
}


# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────
def banner(title: str) -> None:
    line = "-" * 62
    print(f"\n{line}")
    print(f"  {title}")
    print(line)


def predict_sample(
    model: XGBClassifier,
    feature_order: list,
    sample: dict,
    label: str,
) -> None:
    """Run one prediction and print a beginner-friendly result block."""
    # Build feature vector in the exact order the model was trained with
    feature_values = [sample[feat] for feat in feature_order]
    X = np.array(feature_values, dtype=float).reshape(1, -1)

    prob = float(model.predict_proba(X)[0][1])
    score, risk_label = probability_to_risk(prob)

    print(f"\n  -- {label} --")
    print("\n  Input feature values:")
    for feat, val in zip(feature_order, feature_values):
        print(f"    {feat:<35} : {val}")

    print(f"\n  +------------------------------------------+")
    print(f"  |  Landslide Probability : {prob:.4f} ({prob*100:.1f}%)     |")
    print(f"  |  Risk Score (0-100)    : {score:<4}               |")
    print(f"  |  Risk Label            : {risk_label:<8}           |")
    print(f"  +------------------------------------------+")


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────
def main() -> None:
    banner("PARVAAH -- XGBoost Practice Prediction")

    # 1. Load metadata
    if not METADATA_PATH.exists():
        print(f"\n  ERROR: Metadata file not found:\n     {METADATA_PATH}")
        print("  Please run training first:\n    python training/train_model.py")
        sys.exit(1)

    metadata = joblib.load(METADATA_PATH)
    feature_order = metadata["feature_columns"]
    model_version = metadata["model_version"]
    disclaimer = metadata["disclaimer"]

    print(f"\n  Model version      : {model_version}")
    print(f"  Training timestamp : {metadata['training_timestamp']}")
    print(f"  Dataset rows used  : {metadata['dataset_row_count']}")
    print(f"  Feature order      : {feature_order}")

    # 2. Load saved metrics
    if METRICS_PATH.exists():
        with open(METRICS_PATH, encoding="utf-8") as fh:
            saved_metrics = json.load(fh)
        print(f"\n  Saved training metrics:")
        print(f"    Precision : {saved_metrics.get('precision', 'N/A')}")
        print(f"    Recall    : {saved_metrics.get('recall', 'N/A')}")
        print(f"    F1 Score  : {saved_metrics.get('f1_score', 'N/A')}")
        print(f"    ROC-AUC   : {saved_metrics.get('roc_auc', 'N/A')}")
        print(f"    PR-AUC    : {saved_metrics.get('pr_auc', 'N/A')}")
    else:
        print("\n  WARNING: practice_metrics.json not found -- skipping metrics display.")

    # 3. Load model
    if not MODEL_PATH.exists():
        print(f"\n  ERROR: Model file not found:\n     {MODEL_PATH}")
        print("  Please run training first:\n    python training/train_model.py")
        sys.exit(1)

    model = XGBClassifier()
    model.load_model(str(MODEL_PATH))

    # 4. Validate sample keys
    for sample_name, sample in [("HIGH_RISK", SAMPLE_HIGH_RISK), ("LOW_RISK", SAMPLE_LOW_RISK)]:
        missing = [f for f in feature_order if f not in sample]
        if missing:
            print(f"\n  ERROR: SAMPLE_{sample_name} is missing features: {missing}")
            sys.exit(1)

    # 5. Run predictions
    banner("Predictions")
    predict_sample(model, feature_order, SAMPLE_HIGH_RISK, "SAMPLE A -- High-Risk Input")
    predict_sample(model, feature_order, SAMPLE_LOW_RISK, "SAMPLE B -- Low-Risk Input")

    # 6. Risk label legend
    banner("Risk Label Legend (Practice Thresholds Only)")
    print("""
  Score Range  |  Label
  -------------|----------
   0  -  24    |  LOW
   25 -  49    |  MODERATE
   50 -  74    |  HIGH
   75 - 100    |  CRITICAL
""")

    # 7. Final disclaimer
    banner("IMPORTANT Disclaimer")
    print(f"""
  Practice-only synthetic-model result.
  Not a real landslide warning or evacuation decision.

  {disclaimer}

  Model version : {model_version}
""")


if __name__ == "__main__":
    main()
