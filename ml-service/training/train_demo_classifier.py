"""
training/train_demo_classifier.py
=================================
Trains and compares binary landslide classifiers on the balanced dataset:
ml-service/data/processed/training_with_negatives_v1.csv

Features:
- rainfall_24h_mm
- rainfall_48h_mm
- rainfall_7d_mm
- soil_moisture_percent
- slope_degrees
- elevation_m
- historical_landslide_density

Target:
- landslide_occurred (0/1)

Models trained:
1. Logistic Regression (Baseline)
2. Random Forest
3. XGBoost (Primary demo model)

Outputs saved:
- ml-service/models/demo_xgboost_v1.json
- ml-service/models/demo_xgboost_v1_metadata.joblib
- ml-service/models/demo_xgboost_v1_metrics.json
- ml-service/models/demo_xgboost_v1_model_card.md
- ml-service/reports/demo_classifier_evaluation.md

DISCLAIMER:
Demo/research model only. Not for operational or official use.
"""

import argparse
import io
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

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

FEATURE_COLUMNS = [
    "rainfall_24h_mm",
    "rainfall_48h_mm",
    "rainfall_7d_mm",
    "soil_moisture_percent",
    "slope_degrees",
    "elevation_m",
    "historical_landslide_density",
]
TARGET_COLUMN = "landslide_occurred"
RANDOM_STATE = 42
TEST_SIZE = 0.20


def evaluate_classifier(y_true, y_pred, y_prob):
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    return {
        "precision": float(round(precision_score(y_true, y_pred, zero_division=0), 4)),
        "recall": float(round(recall_score(y_true, y_pred, zero_division=0), 4)),
        "f1": float(round(f1_score(y_true, y_pred, zero_division=0), 4)),
        "roc_auc": float(round(roc_auc_score(y_true, y_prob), 4)) if len(np.unique(y_true)) > 1 else None,
        "pr_auc": float(round(average_precision_score(y_true, y_prob), 4)),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },
    }


def generate_evaluation_report(
    report_path: Path,
    dataset_summary: dict,
    metrics: dict,
) -> None:
    xgb_m = metrics["xgboost"]
    rf_m = metrics["random_forest"]
    lr_m = metrics["logistic_regression"]

    lines = [
        "# PARVAAH Demo Landslide Classifier Evaluation Report",
        "",
        "> **RESEARCH & DEMO DISCLAIMER:**  ",
        "> Demo/research model only. Not for operational or official use. "
        "Positives: real landslide inventory; Negatives: pseudo-absences generated within same spatial-temporal domain, 5 km buffer.",
        "",
        "## 1. Dataset & Split Overview",
        f"- **Training Dataset Source:** `ml-service/data/processed/training_with_negatives_v1.csv`",
        f"- **Total Samples:** {dataset_summary['total_samples']:,}",
        f"- **Positive Events (`y = 1`):** {dataset_summary['positives']:,} ({dataset_summary['positives']/dataset_summary['total_samples']*100:.1f}%)",
        f"- **Negative Samples (`y = 0`):** {dataset_summary['negatives']:,} ({dataset_summary['negatives']/dataset_summary['total_samples']*100:.1f}%)",
        f"- **Train Set Size (80%):** {dataset_summary['train_count']:,} samples",
        f"- **Test Set Size (20%):** {dataset_summary['test_count']:,} samples (Stratified)",
        f"- **Evaluation Timestamp:** {datetime.now(timezone.utc).isoformat()}",
        "",
        "## 2. Model Feature Schema (7 Features)",
        *(f"- `{f}`" for f in FEATURE_COLUMNS),
        "",
        "## 3. Comparative Test Set Performance",
        "| Model | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | False Negatives (FN) | False Positives (FP) |",
        "|---|---|---|---|---|---|---|---|",
        f"| **XGBoost (Primary Demo)** | **{xgb_m['precision']:.4f}** | **{xgb_m['recall']:.4f}** | **{xgb_m['f1']:.4f}** | **{xgb_m['roc_auc']:.4f}** | **{xgb_m['pr_auc']:.4f}** | **{xgb_m['confusion_matrix']['fn']}** | **{xgb_m['confusion_matrix']['fp']}** |",
        f"| Random Forest | {rf_m['precision']:.4f} | {rf_m['recall']:.4f} | {rf_m['f1']:.4f} | {rf_m['roc_auc']:.4f} | {rf_m['pr_auc']:.4f} | {rf_m['confusion_matrix']['fn']} | {rf_m['confusion_matrix']['fp']} |",
        f"| Logistic Regression (Baseline) | {lr_m['precision']:.4f} | {lr_m['recall']:.4f} | {lr_m['f1']:.4f} | {lr_m['roc_auc']:.4f} | {lr_m['pr_auc']:.4f} | {lr_m['confusion_matrix']['fn']} | {lr_m['confusion_matrix']['fp']} |",
        "",
        "## 4. XGBoost Confusion Matrix (Test Set: N = " + str(dataset_summary['test_count']) + ")",
        f"- **True Negatives (TN):** {xgb_m['confusion_matrix']['tn']}",
        f"- **False Positives (FP):** {xgb_m['confusion_matrix']['fp']}",
        f"- **False Negatives (FN):** {xgb_m['confusion_matrix']['fn']}",
        f"- **True Positives (TP):** {xgb_m['confusion_matrix']['tp']}",
        "",
        "## 5. Artifacts Created",
        "- Model weights: `ml-service/models/demo_xgboost_v1.json`",
        "- Metadata: `ml-service/models/demo_xgboost_v1_metadata.joblib`",
        "- Metrics JSON: `ml-service/models/demo_xgboost_v1_metrics.json`",
        "- Model card: `ml-service/models/demo_xgboost_v1_model_card.md`",
        "",
    ]

    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def generate_model_card(card_path: Path, dataset_summary: dict, metrics: dict) -> None:
    xgb_m = metrics["xgboost"]

    lines = [
        "# Model Card: PARVAAH Demo XGBoost Classifier (`demo_xgboost_v1`)",
        "",
        "> **RESEARCH & DEMO DISCLAIMER:**  ",
        "> Demo/research model only. Not for operational or official use. "
        "Positives: real landslide inventory; Negatives: pseudo-absences generated within same spatial-temporal domain, 5 km buffer.",
        "",
        "## Model Details",
        "- **Model Name:** PARVAAH Demo XGBoost Landslide Classifier",
        "- **Model Version:** `demo-xgboost-v1`",
        "- **Model Type:** Gradient Boosted Decision Trees (XGBClassifier)",
        "- **Created Date:** " + datetime.now(timezone.utc).isoformat(),
        "- **Input Features (7):** `rainfall_24h_mm`, `rainfall_48h_mm`, `rainfall_7d_mm`, `soil_moisture_percent`, `slope_degrees`, `elevation_m`, `historical_landslide_density`",
        "- **Target:** `landslide_occurred` (Binary: `0` = Absence, `1` = Landslide event)",
        "",
        "## Data & Training Details",
        "- **Source Dataset:** `ml-service/data/processed/training_with_negatives_v1.csv`",
        f"- **Total Dataset Samples:** {dataset_summary['total_samples']:,}",
        f"- **Positives:** {dataset_summary['positives']:,} | **Negatives:** {dataset_summary['negatives']:,}",
        f"- **Train/Test Split:** 80% Train ({dataset_summary['train_count']:,} samples), 20% Test ({dataset_summary['test_count']:,} samples), stratified by label",
        "- **Random Seed:** 42",
        "",
        "## Evaluation Metrics (Test Set)",
        f"- **Precision:** {xgb_m['precision']:.4f}",
        f"- **Recall:** {xgb_m['recall']:.4f}",
        f"- **F1 Score:** {xgb_m['f1']:.4f}",
        f"- **ROC-AUC:** {xgb_m['roc_auc']:.4f}",
        f"- **PR-AUC:** {xgb_m['pr_auc']:.4f}",
        f"- **Confusion Matrix:** TN={xgb_m['confusion_matrix']['tn']}, FP={xgb_m['confusion_matrix']['fp']}, FN={xgb_m['confusion_matrix']['fn']}, TP={xgb_m['confusion_matrix']['tp']}",
        "",
        "## Intended Use & Limitations",
        "- **Intended Use:** Academic and college-level disaster management research, decision-support prototyping, and interactive simulation.",
        "- **Limitations:** Negative samples are pseudo-absences derived from spatial-temporal domain sampling. Model outputs must never be used to issue mandatory evacuation orders or official safety warnings.",
        "",
    ]

    card_path.parent.mkdir(parents=True, exist_ok=True)
    with open(card_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    root_dir = Path(__file__).resolve().parent.parent

    default_data = root_dir / "data" / "processed" / "training_with_negatives_v1.csv"
    default_models_dir = root_dir / "models"
    default_reports_dir = root_dir / "reports"

    parser = argparse.ArgumentParser(description="Train demo binary classifiers on balanced dataset.")
    parser.add_argument("--data", default=str(default_data), help="Path to training_with_negatives_v1.csv")
    parser.add_argument("--models-dir", default=str(default_models_dir), help="Output models directory")
    parser.add_argument("--reports-dir", default=str(default_reports_dir), help="Output reports directory")
    args = parser.parse_args()

    data_path = Path(args.data).resolve()
    models_dir = Path(args.models_dir).resolve()
    reports_dir = Path(args.reports_dir).resolve()

    if not data_path.exists():
        print(f"Error: Dataset not found at: {data_path}")
        sys.exit(1)

    models_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    print("\n=======================================================")
    print("  PARVAAH DEMO BINARY CLASSIFIER TRAINING")
    print("=======================================================")
    print(f"  Dataset:     {data_path.name}")
    print(f"  Features:    {', '.join(FEATURE_COLUMNS)}")

    df = pd.read_csv(data_path)

    # Impute median for any minor missing values in slope/elevation
    for f in FEATURE_COLUMNS:
        if df[f].isna().any():
            med = df[f].median()
            df[f] = df[f].fillna(med)

    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(int)

    pos_count = int((df[TARGET_COLUMN] == 1).sum())
    neg_count = int((df[TARGET_COLUMN] == 0).sum())
    total_samples = len(df)

    print(f"  Total Rows:  {total_samples:,} (Positives={pos_count}, Negatives={neg_count})")

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    dataset_summary = {
        "total_samples": total_samples,
        "positives": pos_count,
        "negatives": neg_count,
        "train_count": len(X_train),
        "test_count": len(X_test),
    }

    print(f"  Train Split: {len(X_train)} samples | Test Split: {len(X_test)} samples")
    print("-------------------------------------------------------")

    # 1. Logistic Regression Baseline
    print("  [1/3] Training Logistic Regression baseline...")
    lr = LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)
    lr_prob = lr.predict_proba(X_test)[:, 1]
    lr_metrics = evaluate_classifier(y_test, lr_pred, lr_prob)

    # 2. Random Forest
    print("  [2/3] Training Random Forest classifier...")
    rf = RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]
    rf_metrics = evaluate_classifier(y_test, rf_pred, rf_prob)

    # 3. XGBoost (Primary Demo Model)
    print("  [3/3] Training XGBoost candidate (demo_xgboost_v1)...")
    xgb = XGBClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        random_state=RANDOM_STATE,
        eval_metric="logloss",
    )
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(X_test)
    xgb_prob = xgb.predict_proba(X_test)[:, 1]
    xgb_metrics = evaluate_classifier(y_test, xgb_pred, xgb_prob)

    all_metrics = {
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_summary": dataset_summary,
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "logistic_regression": lr_metrics,
        "random_forest": rf_metrics,
        "xgboost": xgb_metrics,
    }

    # Save distinct artifacts (does not overwrite practice model)
    model_json_path = models_dir / "demo_xgboost_v1.json"
    metadata_joblib_path = models_dir / "demo_xgboost_v1_metadata.joblib"
    metrics_json_path = models_dir / "demo_xgboost_v1_metrics.json"
    model_card_path = models_dir / "demo_xgboost_v1_model_card.md"
    evaluation_report_path = reports_dir / "demo_classifier_evaluation.md"

    xgb.save_model(str(model_json_path))

    metadata = {
        "model_version": "demo-xgboost-v1",
        "model_mode": "DEMO_XGBOOST",
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Demo/research model only. Not for operational or official use.",
        "metrics": xgb_metrics,
    }
    joblib.dump(metadata, metadata_joblib_path)

    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(all_metrics, f, indent=2)

    generate_evaluation_report(evaluation_report_path, dataset_summary, all_metrics)
    generate_model_card(model_card_path, dataset_summary, all_metrics)

    print("-------------------------------------------------------")
    print(f"  XGBoost Evaluation Metrics (Test Set, N={len(X_test)}):")
    print(f"    - Precision: {xgb_metrics['precision']:.4f}")
    print(f"    - Recall:    {xgb_metrics['recall']:.4f}")
    print(f"    - F1 Score:  {xgb_metrics['f1']:.4f}")
    print(f"    - ROC-AUC:   {xgb_metrics['roc_auc']:.4f}")
    print(f"    - PR-AUC:    {xgb_metrics['pr_auc']:.4f}")
    print(f"    - Confusion: TN={xgb_metrics['confusion_matrix']['tn']}, FP={xgb_metrics['confusion_matrix']['fp']}, FN={xgb_metrics['confusion_matrix']['fn']}, TP={xgb_metrics['confusion_matrix']['tp']}")
    print("-------------------------------------------------------")
    print("  Artifacts Saved Successfully:")
    print(f"   -> {model_json_path}")
    print(f"   -> {metadata_joblib_path}")
    print(f"   -> {metrics_json_path}")
    print(f"   -> {model_card_path}")
    print(f"   -> {evaluation_report_path}")
    print("=======================================================\n")


if __name__ == "__main__":
    main()
