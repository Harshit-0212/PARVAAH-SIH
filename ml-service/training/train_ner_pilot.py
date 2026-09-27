"""Train and compare research-only models for the East Sikkim pilot.

This script never touches the existing practice model files. A selected model is
saved only when a time-based or spatial holdout supports meaningful evaluation.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

try:
    from xgboost import XGBClassifier
except ImportError as exc:  # pragma: no cover - environment-dependent
    XGBClassifier = None
    XGBOOST_IMPORT_ERROR = str(exc)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = ROOT / "data" / "processed" / "landslide_training_v1.csv"
OUTPUT_DIR = ROOT / "models" / "ner_pilot"
FEATURE_COLUMNS = ["rainfall_24h_mm", "rainfall_72h_mm", "soil_moisture_percent", "slope_degrees", "elevation_m", "distance_to_road_m", "distance_to_river_m", "historical_landslide_density"]
DISCLAIMER = "Research-only pilot model for East Sikkim. Not operational, real-time, IMD-validated, or suitable for warnings or evacuation decisions."


def choose_split(frame: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, str] | None:
    ordered = frame.sort_values("timestamp").reset_index()
    cut = max(1, int(len(ordered) * 0.8))
    train_idx = ordered.loc[: cut - 1, "index"].to_numpy()
    test_idx = ordered.loc[cut:, "index"].to_numpy()
    if len(test_idx) and frame.loc[train_idx, "landslide_occurred"].nunique() == 2 and frame.loc[test_idx, "landslide_occurred"].nunique() == 2:
        return train_idx, test_idx, "time-based 80/20 chronological holdout"

    zones = sorted(frame["zone_id"].astype(str).unique())
    if len(zones) >= 2:
        test_zone_count = max(1, int(np.ceil(len(zones) * 0.2)))
        test_zones = set(zones[-test_zone_count:])
        test_mask = frame["zone_id"].astype(str).isin(test_zones)
        train_mask = ~test_mask
        if frame.loc[train_mask, "landslide_occurred"].nunique() == 2 and frame.loc[test_mask, "landslide_occurred"].nunique() == 2:
            return frame.index[train_mask].to_numpy(), frame.index[test_mask].to_numpy(), "spatial zone holdout"
    return None


def metrics(y_true: pd.Series, probability: np.ndarray) -> tuple[dict[str, Any], list[list[int]]]:
    prediction = (probability >= 0.5).astype(int)
    matrix = confusion_matrix(y_true, prediction, labels=[0, 1]).tolist()
    result: dict[str, Any] = {
        "precision": float(precision_score(y_true, prediction, zero_division=0)),
        "recall": float(recall_score(y_true, prediction, zero_division=0)),
        "f1": float(f1_score(y_true, prediction, zero_division=0)),
        "false_negative_count": int(matrix[1][0]),
        "roc_auc": None,
        "pr_auc": None,
    }
    if len(set(y_true)) == 2:
        result["roc_auc"] = float(roc_auc_score(y_true, probability))
        result["pr_auc"] = float(average_precision_score(y_true, probability))
    return result, matrix


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare Logistic Regression, Random Forest, and XGBoost for the pilot dataset.")
    parser.add_argument("dataset", nargs="?", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--pilot-area", default="East Sikkim district")
    args = parser.parse_args()

    if not args.dataset.exists():
        print(f"ERROR: dataset does not exist: {args.dataset}")
        return 2
    frame = pd.read_csv(args.dataset)
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="coerce", utc=True)
    frame[FEATURE_COLUMNS] = frame[FEATURE_COLUMNS].apply(pd.to_numeric, errors="coerce")
    frame["landslide_occurred"] = pd.to_numeric(frame["landslide_occurred"], errors="coerce").astype("Int64")
    frame = frame.dropna(subset=[*FEATURE_COLUMNS, "timestamp", "landslide_occurred"]).copy()
    frame["landslide_occurred"] = frame["landslide_occurred"].astype(int)
    if set(frame["landslide_occurred"].unique()) != {0, 1}:
        print("NOT TRAINABLE: the final CSV must contain both target classes 0 and 1.")
        return 4

    split = choose_split(frame)
    if split is None:
        print("NOT TRAINABLE: no valid time-based or spatial holdout contains both classes.")
        print("No metrics are claimed and no selected model is saved.")
        return 4
    train_idx, test_idx, split_method = split
    x_train, x_test = frame.loc[train_idx, FEATURE_COLUMNS], frame.loc[test_idx, FEATURE_COLUMNS]
    y_train, y_test = frame.loc[train_idx, "landslide_occurred"], frame.loc[test_idx, "landslide_occurred"]
    if y_train.nunique() != 2:
        print("NOT TRAINABLE: training partition contains one class only.")
        return 4

    negative_count = int((frame["landslide_occurred"] == 0).sum())
    positive_count = int((frame["landslide_occurred"] == 1).sum())
    scale_pos_weight = negative_count / positive_count if positive_count else 1.0
    models: dict[str, Any] = {
        "logistic_regression": make_pipeline(StandardScaler(), LogisticRegression(class_weight="balanced", max_iter=2000, random_state=42)),
        "random_forest": RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=42, n_jobs=-1, min_samples_leaf=2),
    }
    if XGBClassifier is not None:
        models["xgboost"] = XGBClassifier(n_estimators=250, max_depth=3, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8, objective="binary:logistic", eval_metric="logloss", scale_pos_weight=scale_pos_weight, random_state=42, n_jobs=2)
    else:
        print(f"WARNING: XGBoost unavailable: {XGBOOST_IMPORT_ERROR}")

    comparison: list[dict[str, Any]] = []
    matrices: dict[str, list[list[int]]] = {}
    trained: dict[str, Any] = {}
    for name, model in models.items():
        try:
            model.fit(x_train, y_train)
            probability = model.predict_proba(x_test)[:, 1]
            result, matrix = metrics(y_test, probability)
            result.update({"model": name, "status": "evaluated", "split_method": split_method})
            comparison.append(result)
            matrices[name] = matrix
            trained[name] = model
        except Exception as exc:  # keep comparison useful if one library/model fails
            comparison.append({"model": name, "status": "failed", "error": str(exc), "split_method": split_method})

    evaluated = [row for row in comparison if row.get("status") == "evaluated"]
    if not evaluated:
        print("NOT TRAINABLE: no model completed a valid evaluation. No selected model is saved.")
        return 5
    selected_row = max(evaluated, key=lambda row: (row["pr_auc"] if row["pr_auc"] is not None else row["f1"], row["recall"]))
    selected_name = selected_row["model"]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(trained[selected_name], OUTPUT_DIR / "selected_model.joblib")
    pd.DataFrame(comparison).to_csv(OUTPUT_DIR / "model_comparison.csv", index=False)
    (OUTPUT_DIR / "confusion_matrices.json").write_text(json.dumps(matrices, indent=2), encoding="utf-8")
    metadata = {
        "model_version": "ner-east-sikkim-pilot-v1",
        "pilot_area": args.pilot_area,
        "source_datasets": [str(args.dataset)],
        "date_range": {"start": frame["timestamp"].min().isoformat(), "end": frame["timestamp"].max().isoformat()},
        "feature_order": FEATURE_COLUMNS,
        "row_counts": {"all": len(frame), "train": len(train_idx), "test": len(test_idx), "positive": positive_count, "negative": negative_count},
        "split_method": split_method,
        "selection_criteria": "Highest PR-AUC when computable, then F1, then recall; this prioritises positive-event retrieval for a research pilot.",
        "selected_model": selected_name,
        "metrics": selected_row,
        "all_model_results": comparison,
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "limitations": ["One-district research pilot only.", "Metrics are holdout estimates, not operational validation.", "Labels depend on event inventory completeness and explicit negative-window confirmation.", "No IMD or government operational validation is claimed."],
        "disclaimer": DISCLAIMER,
    }
    (OUTPUT_DIR / "model_card.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (OUTPUT_DIR / "MODEL_CARD.md").write_text(render_model_card(metadata), encoding="utf-8")

    print(f"Pilot area: {args.pilot_area}")
    print(f"Class balance: positives={positive_count}, negatives={negative_count}")
    print(f"Split: {split_method}")
    print(pd.DataFrame(comparison).to_string(index=False))
    print(f"Selected model: {selected_name}")
    print(f"Saved only to: {OUTPUT_DIR}")
    print(DISCLAIMER)
    return 0


def render_model_card(metadata: dict[str, Any]) -> str:
    metrics_text = json.dumps(metadata["metrics"], indent=2)
    return f"# {metadata['model_version']}\n\n**Pilot area:** {metadata['pilot_area']}\n\n**Selected model:** {metadata['selected_model']}\n\n**Split:** {metadata['split_method']}\n\n## Feature order\n\n" + "\n".join(f"- `{feature}`" for feature in metadata["feature_order"]) + f"\n\n## Rows\n\n```json\n{json.dumps(metadata['row_counts'], indent=2)}\n```\n\n## Selected metrics\n\n```json\n{metrics_text}\n```\n\n## Limitations and disclaimer\n\n- One-district research pilot only.\n- Not operational, real-time, IMD-validated, or suitable for warnings or evacuation decisions.\n- Labels and metrics depend on supplied source quality.\n"


if __name__ == "__main__":
    raise SystemExit(main())
