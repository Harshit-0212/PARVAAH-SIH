"""
training/train_from_excel.py
============================
Model training and baseline evaluation script from validated Excel datasets.

Compares:
1. Logistic Regression baseline
2. Random Forest baseline
3. XGBoost candidate

Saves model artifacts only when training succeeds:
- ml-service/models/xgboost_excel_pilot_v1.json
- ml-service/models/xgboost_excel_pilot_v1_metadata.joblib
- ml-service/models/xgboost_excel_pilot_v1_metrics.json
- ml-service/models/xgboost_excel_pilot_v1_model_card.md
"""

import argparse
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Force UTF-8 on Windows
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

CANONICAL_FEATURES = [
    "rainfall_24h_mm",
    "forecast_rainfall_24h_mm",
    "soil_moisture_percent",
    "slope_degrees",
    "historical_landslide_density",
    "verified_report_count",
]
TARGET_COL = "landslide_occurred"


def train_models_from_excel(
    processed_csv_path: Path,
    audit_json_path: Optional[Path] = None,
    output_model_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    if not processed_csv_path.exists():
        raise FileNotFoundError(f"Processed training CSV not found at: {processed_csv_path}")

    root_dir = Path(__file__).resolve().parent.parent
    if output_model_dir is None:
        output_model_dir = root_dir / "models"
    output_model_dir.mkdir(parents=True, exist_ok=True)

    # Load audit provenance metadata if available
    audit_data: Dict[str, Any] = {}
    if audit_json_path and audit_json_path.exists():
        with open(audit_json_path, "r", encoding="utf-8") as f:
            audit_data = json.load(f)

    df = pd.read_csv(processed_csv_path)

    # Verify columns
    missing_cols = [c for c in CANONICAL_FEATURES + [TARGET_COL] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Processed CSV is missing required columns: {missing_cols}")

    X = df[CANONICAL_FEATURES]
    y = df[TARGET_COL]

    # Verify binary target classes
    unique_classes = sorted(list(y.unique()))
    if len(unique_classes) < 2:
        raise ValueError(
            f"Cannot train classifier: Dataset has only class {unique_classes}. "
            "Both positive (1) and negative (0) samples are required."
        )

    class_counts = y.value_counts().to_dict()
    pos_count = int(class_counts.get(1, 0))
    neg_count = int(class_counts.get(0, 0))

    # Stratified Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    # Calculate scale_pos_weight for class imbalance
    scale_pos_weight = max(1.0, float(neg_count / pos_count)) if pos_count > 0 else 1.0

    print(f"Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")
    print(f"Class distribution: 0={neg_count}, 1={pos_count} (scale_pos_weight: {scale_pos_weight:.2f})")

    # 1. Logistic Regression Baseline
    log_reg = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    log_reg.fit(X_train, y_train)
    lr_pred = log_reg.predict(X_test)
    lr_prob = log_reg.predict_proba(X_test)[:, 1]

    # 2. Random Forest Baseline
    rf = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]

    # 3. XGBoost Candidate
    xgb = XGBClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.08,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric="logloss",
    )
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(X_test)
    xgb_prob = xgb.predict_proba(X_test)[:, 1]

    # Metrics helper
    def evaluate_model(y_true, y_pred, y_prob):
        cm = confusion_matrix(y_true, y_pred).tolist()
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        return {
            "precision": float(round(precision_score(y_true, y_pred, zero_division=0), 4)),
            "recall": float(round(recall_score(y_true, y_pred, zero_division=0), 4)),
            "f1": float(round(f1_score(y_true, y_pred, zero_division=0), 4)),
            "roc_auc": float(round(roc_auc_score(y_true, y_prob), 4)) if len(np.unique(y_true)) > 1 else None,
            "pr_auc": float(round(average_precision_score(y_true, y_prob), 4)),
            "confusion_matrix": {
                "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)
            },
            "false_negatives": int(fn),
        }

    metrics_lr = evaluate_model(y_test, lr_pred, lr_prob)
    metrics_rf = evaluate_model(y_test, rf_pred, rf_prob)
    metrics_xgb = evaluate_model(y_test, xgb_pred, xgb_prob)

    all_metrics = {
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "total_dataset_rows": len(df),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "class_counts": {"negative_0": neg_count, "positive_1": pos_count},
        "logistic_regression_baseline": metrics_lr,
        "random_forest_baseline": metrics_rf,
        "xgboost_excel_pilot_v1": metrics_xgb,
    }

    # Save artifacts
    model_json_path = output_model_dir / "xgboost_excel_pilot_v1.json"
    metadata_joblib_path = output_model_dir / "xgboost_excel_pilot_v1_metadata.joblib"
    metrics_json_path = output_model_dir / "xgboost_excel_pilot_v1_metrics.json"
    model_card_path = output_model_dir / "xgboost_excel_pilot_v1_model_card.md"

    xgb.save_model(str(model_json_path))

    metadata = {
        "model_version": "excel-pilot-xgboost-v1",
        "model_mode": "EXCEL_PILOT_XGBOOST",
        "feature_columns": CANONICAL_FEATURES,
        "target_column": TARGET_COL,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Academic decision-support pilot model trained on user-provided dataset. Not an official disaster warning.",
        "metrics": metrics_xgb,
        "provenance": audit_data.get("provenance", {}),
    }
    joblib.dump(metadata, metadata_joblib_path)

    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(all_metrics, f, indent=2)

    # Generate Model Card
    card_content = generate_model_card(metadata, all_metrics, audit_data)
    with open(model_card_path, "w", encoding="utf-8") as f:
        f.write(card_content)

    print("\nTraining completed successfully!")
    print(f"XGBoost Metrics: Precision={metrics_xgb['precision']}, Recall={metrics_xgb['recall']}, F1={metrics_xgb['f1']}, ROC-AUC={metrics_xgb['roc_auc']}, PR-AUC={metrics_xgb['pr_auc']}")
    print(f"Model saved to: {model_json_path}")
    print(f"Model card:     {model_card_path}")

    return {
        "success": True,
        "model_path": str(model_json_path),
        "metadata_path": str(metadata_joblib_path),
        "metrics_path": str(metrics_json_path),
        "model_card_path": str(model_card_path),
        "metrics": all_metrics,
    }


def generate_model_card(metadata: Dict[str, Any], metrics: Dict[str, Any], audit_data: Dict[str, Any]) -> str:
    prov = audit_data.get("provenance", {})
    wb = audit_data.get("workbook", {})
    xgb_m = metrics["xgboost_excel_pilot_v1"]
    rf_m = metrics["random_forest_baseline"]
    lr_m = metrics["logistic_regression_baseline"]

    lines = [
        "# Model Card: PARVAAH Excel Pilot Landslide Classifier (v1)",
        "",
        "> **ACADEMIC DECISION-SUPPORT TOOL — NOT AN OFFICIAL WARNING**",
        "> This pilot model is trained from a user-provided Excel dataset for academic exploration and localized risk simulation. It must never be used to issue mandatory evacuation orders or replace IMD/SDMA advisories.",
        "",
        "## 1. Provenance & Source Dataset",
        f"- **Model Version:** `{metadata['model_version']}`",
        f"- **Model Mode:** `{metadata['model_mode']}`",
        f"- **Training Date:** `{metadata['created_at']}`",
        f"- **Source Workbook Hash (SHA-256):** `{prov.get('file_sha256', 'N/A')}`",
        f"- **Original Filename:** `{prov.get('original_filename', 'N/A')}`",
        f"- **Selected Sheet:** `{wb.get('selected_sheet', 'N/A')}`",
        f"- **Total Dataset Rows:** {metrics['total_dataset_rows']}",
        f"- **Class Counts:** Negative (0): {metrics['class_counts']['negative_0']} | Positive (1): {metrics['class_counts']['positive_1']}",
        "",
        "## 2. Model Architecture & Baselines",
        "- **Candidate Algorithm:** XGBoost Classifier (with `scale_pos_weight` imbalance handling)",
        "- **Baselines:** Logistic Regression, Random Forest",
        "- **Features (6):** `rainfall_24h_mm`, `forecast_rainfall_24h_mm`, `soil_moisture_percent`, `slope_degrees`, `historical_landslide_density`, `verified_report_count`",
        "- **Target:** `landslide_occurred` (0 or 1)",
        "- **Split:** 75% Train, 25% Test (Stratified random split. Time-aware or spatial split was not applicable if spatio-temporal coordinates were unindexed).",
        "",
        "## 3. Evaluation Metrics",
        "| Model | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | False Negatives |",
        "|---|---|---|---|---|---|---|",
        f"| **XGBoost Candidate** | **{xgb_m['precision']}** | **{xgb_m['recall']}** | **{xgb_m['f1']}** | **{xgb_m['roc_auc']}** | **{xgb_m['pr_auc']}** | **{xgb_m['false_negatives']}** |",
        f"| Random Forest Baseline | {rf_m['precision']} | {rf_m['recall']} | {rf_m['f1']} | {rf_m['roc_auc']} | {rf_m['pr_auc']} | {rf_m['false_negatives']} |",
        f"| Logistic Regression | {lr_m['precision']} | {lr_m['recall']} | {lr_m['f1']} | {lr_m['roc_auc']} | {lr_m['pr_auc']} | {lr_m['false_negatives']} |",
        "",
        "### XGBoost Confusion Matrix (Test Set)",
        f"- **True Negatives:** {xgb_m['confusion_matrix']['tn']}",
        f"- **False Positives:** {xgb_m['confusion_matrix']['fp']}",
        f"- **False Negatives:** {xgb_m['confusion_matrix']['fn']}",
        f"- **True Positives:** {xgb_m['confusion_matrix']['tp']}",
        "",
        "## 4. Limitations & Disclaimers",
        "1. **Decision Support Only:** This model provides simulated probability scores for decision support and does not constitute an official landslide warning.",
        "2. **False Negatives:** In landslide hazards, false negatives (missed landslides) carry extreme life-safety risk. Current model has false negatives documented above.",
        "3. **Geographic Scope:** Validated only within the distribution of the training dataset. Out-of-distribution terrain or extreme weather events require human officer assessment.",
        "4. **No Direct Evacuation Ordering:** Automated models must never issue mandatory evacuation orders. All official statuses require human officer authorization.",
        "",
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Train XGBoost model from validated processed CSV.")
    parser.add_argument("--csv", type=str, default=None, help="Path to processed CSV (default: ml-service/data/processed/landslide_training_from_excel_v1.csv)")
    args = parser.parse_args()

    root_dir = Path(__file__).resolve().parent.parent
    csv_path = Path(args.csv).resolve() if args.csv else root_dir / "data" / "processed" / "landslide_training_from_excel_v1.csv"
    audit_path = root_dir / "reports" / "excel_dataset_audit.json"

    print(f"\n=======================================================")
    print(f"  PARVAAH MODEL TRAINING FROM EXCEL")
    print(f"=======================================================")
    train_models_from_excel(csv_path, audit_json_path=audit_path)
    print(f"=======================================================\n")


if __name__ == "__main__":
    main()
