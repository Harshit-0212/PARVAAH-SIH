"""
training/train_model.py
=======================
Beginner-friendly XGBoost training script for the PARVAAH ml-service
practice workspace.

PURPOSE
-------
Load a small SYNTHETIC practice CSV, train an XGBoost binary classifier,
evaluate it, and save the model + metadata + metrics to models/.

!! DISCLAIMER
-------------
This script uses 100% synthetic data generated for learning purposes.
Output metrics DO NOT represent real-world landslide prediction accuracy.
This model MUST NOT be used for real warnings, evacuation decisions, or
any operational purpose.
"""

import io
import json
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path

# Force UTF-8 output on Windows (avoids cp1252 UnicodeEncodeError in terminals)
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import joblib
import numpy as np
import pandas as pd
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

warnings.filterwarnings("ignore", category=UserWarning)

# ------------------------------------------------------------------------------
# PATHS  (resolved relative to this script's location)
# ------------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent.resolve()
ROOT_DIR = SCRIPT_DIR.parent  # ml-service/

DATA_PATH = ROOT_DIR / "data" / "landslide_training_practice.csv"
MODEL_DIR = ROOT_DIR / "models"
MODEL_PATH = MODEL_DIR / "xgboost_landslide_practice.json"
METADATA_PATH = MODEL_DIR / "xgboost_landslide_practice_metadata.joblib"
METRICS_PATH = MODEL_DIR / "practice_metrics.json"

# ------------------------------------------------------------------------------
# CONSTANTS
# ------------------------------------------------------------------------------
FEATURE_COLUMNS = [
    "rainfall_24h_mm",
    "forecast_rainfall_24h_mm",
    "soil_moisture_percent",
    "slope_degrees",
    "historical_landslide_density",
    "verified_report_count",
]
TARGET_COLUMN = "landslide_occurred"
MODEL_VERSION = "practice-xgboost-v1"
DISCLAIMER = (
    "SYNTHETIC PRACTICE MODEL ONLY. "
    "Values are computer-generated and do not represent real NER, IMD, "
    "or government-validated landslide data. "
    "This model MUST NOT be used for real warnings, evacuation decisions, "
    "or any operational purpose."
)
TEST_SIZE = 0.25
RANDOM_STATE = 42

# ------------------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------------------

def banner(title: str) -> None:
    """Print a visible section header."""
    line = "-" * 62
    print(f"\n{line}")
    print(f"  {title}")
    print(line)


def step(msg: str) -> None:
    print(f"  > {msg}")


# ------------------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------------------

def main() -> None:
    banner("PARVAAH -- XGBoost Practice Training Script")
    print(f"  Timestamp : {datetime.now(timezone.utc).isoformat()}")
    print(f"  Script    : {__file__}")
    print(f"\n  !! WARNING: {DISCLAIMER}\n")

    # 1. Load data
    banner("Step 1 -- Load CSV")
    step(f"Reading: {DATA_PATH}")

    if not DATA_PATH.exists():
        print(f"\n  ERROR: CSV not found at:\n     {DATA_PATH}")
        print("  Make sure you run this script from inside ml-service/ or that")
        print("  the file data/landslide_training_practice.csv exists.")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH, comment="#")
    step(f"Loaded {len(df)} rows, {len(df.columns)} columns.")
    print(f"\n  Columns found: {list(df.columns)}")

    # 2. Validate columns
    banner("Step 2 -- Validate Columns")
    required = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing = [c for c in required if c not in df.columns]
    if missing:
        print(f"\n  ERROR: Missing required columns: {missing}")
        print("  Please check data/landslide_training_practice.csv.")
        sys.exit(1)
    step("All required columns are present [OK]")

    # 3. Validate target labels
    banner("Step 3 -- Validate Target Labels")
    unique_labels = sorted(df[TARGET_COLUMN].unique().tolist())
    step(f"Unique values in '{TARGET_COLUMN}': {unique_labels}")

    if set(unique_labels) != {0, 1}:
        print(
            f"\n  ERROR: '{TARGET_COLUMN}' must contain exactly {{0, 1}}.\n"
            f"  Found: {unique_labels}"
        )
        sys.exit(1)

    label_counts = df[TARGET_COLUMN].value_counts().to_dict()
    step(f"Class distribution -> 0 (no event): {label_counts.get(0, 0)}  |  "
         f"1 (event): {label_counts.get(1, 0)}")
    step("Both classes present [OK]")

    # 4. Prepare features / target
    banner("Step 4 -- Prepare Features and Target")
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()

    # Check for NaN
    nan_counts = X.isnull().sum()
    if nan_counts.any():
        print(f"\n  WARNING: NaN values detected:\n{nan_counts[nan_counts > 0]}")
        print("  Dropping rows with NaN values for this practice run.")
        mask = X.notnull().all(axis=1)
        X, y = X[mask], y[mask]
        step(f"Rows after dropping NaN: {len(X)}")
    else:
        step("No NaN values found [OK]")

    step(f"Feature matrix shape: {X.shape}")
    step(f"Features (in order): {FEATURE_COLUMNS}")

    # 5. Train / test split
    banner("Step 5 -- Train / Test Split")
    n_samples = len(X)
    min_for_stratify = 4  # need >=2 of each class in both splits

    can_stratify = (
        label_counts.get(0, 0) >= 2
        and label_counts.get(1, 0) >= 2
        and n_samples >= min_for_stratify
    )

    if can_stratify:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
        )
        step(f"Stratified split used (test_size={TEST_SIZE}, random_state={RANDOM_STATE}) [OK]")
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
        )
        step("WARNING: Stratification skipped -- dataset too small for stratified split.")

    train_dist = y_train.value_counts().to_dict()
    test_dist = y_test.value_counts().to_dict()
    step(f"Train  -> {len(X_train)} rows  | class dist: {train_dist}")
    step(f"Test   -> {len(X_test)} rows   | class dist: {test_dist}")

    # 6. Train model
    banner("Step 6 -- Train XGBClassifier")

    # Beginner-safe hyperparameters: small tree, some regularisation
    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        verbosity=0,
    )

    step("Training XGBClassifier ...")
    model.fit(X_train, y_train)
    step("Training complete [OK]")

    # 7. Evaluate
    banner("Step 7 -- Evaluate on Test Set")

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    # Basic metrics (always computable)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    step("Confusion Matrix:")
    print(f"         Predicted 0  Predicted 1")
    print(f"  True 0     {cm[0][0]:>5}        {cm[0][1]:>5}")
    print(f"  True 1     {cm[1][0]:>5}        {cm[1][1]:>5}")
    print()
    step(f"Precision : {precision:.4f}  (of all predicted '1', how many were right)")
    step(f"Recall    : {recall:.4f}  (of all actual '1', how many did we catch)")
    step(f"F1 Score  : {f1:.4f}  (harmonic mean of precision & recall)")

    # ROC-AUC and PR-AUC -- only when both classes present in test set
    both_classes_in_test = len(np.unique(y_test)) == 2
    roc_auc: object
    pr_auc: object

    if both_classes_in_test:
        roc_auc = float(roc_auc_score(y_test, y_prob))
        pr_auc = float(average_precision_score(y_test, y_prob))
        step(f"ROC-AUC   : {roc_auc:.4f}  (area under ROC curve; 1.0 = perfect)")
        step(f"PR-AUC    : {pr_auc:.4f}  (area under Precision-Recall curve)")
    else:
        roc_auc = "Not computable with current practice split"
        pr_auc = "Not computable with current practice split"
        reason = (
            "The test split contains only one class. "
            "ROC-AUC and PR-AUC require predictions for both class 0 and class 1 "
            "in the test set. With a larger dataset or different random_state, "
            "both classes should appear in the test split."
        )
        step(f"ROC-AUC   : {roc_auc}")
        step(f"PR-AUC    : {pr_auc}")
        step(f"Reason    : {reason}")

    # 8. Save outputs
    banner("Step 8 -- Save Model, Metadata and Metrics")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # 8a. Save model in XGBoost native JSON format
    model.save_model(str(MODEL_PATH))
    step(f"Model saved      -> {MODEL_PATH}")

    # 8b. Save metadata with joblib
    training_timestamp = datetime.now(timezone.utc).isoformat()
    metadata = {
        "feature_columns": FEATURE_COLUMNS,           # exact ordered list
        "target_column": TARGET_COLUMN,
        "model_version": MODEL_VERSION,
        "training_timestamp": training_timestamp,
        "dataset_row_count": n_samples,
        "train_row_count": len(X_train),
        "test_row_count": len(X_test),
        "stratified_split": can_stratify,
        "disclaimer": DISCLAIMER,
    }
    joblib.dump(metadata, METADATA_PATH)
    step(f"Metadata saved   -> {METADATA_PATH}")

    # 8c. Save metrics as JSON
    metrics = {
        "model_version": MODEL_VERSION,
        "training_timestamp": training_timestamp,
        "dataset_row_count": n_samples,
        "confusion_matrix": cm.tolist(),
        "precision": round(float(precision), 6),
        "recall": round(float(recall), 6),
        "f1_score": round(float(f1), 6),
        "roc_auc": round(roc_auc, 6) if isinstance(roc_auc, float) else roc_auc,
        "pr_auc": round(pr_auc, 6) if isinstance(pr_auc, float) else pr_auc,
        "disclaimer": DISCLAIMER,
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2)
    step(f"Metrics saved    -> {METRICS_PATH}")

    # 9. Summary
    banner("Training Complete -- Summary")
    roc_display = f"{roc_auc:.4f}" if isinstance(roc_auc, float) else roc_auc
    pr_display = f"{pr_auc:.4f}" if isinstance(pr_auc, float) else pr_auc
    print(f"""
  Model version   : {MODEL_VERSION}
  Rows trained on : {len(X_train)}
  Rows tested on  : {len(X_test)}
  Precision       : {precision:.4f}
  Recall          : {recall:.4f}
  F1 Score        : {f1:.4f}
  ROC-AUC         : {roc_display}
  PR-AUC          : {pr_display}

  Saved files:
    {MODEL_PATH}
    {METADATA_PATH}
    {METRICS_PATH}

  !! {DISCLAIMER}

  Next step -> run:  python predict_once.py
""")


if __name__ == "__main__":
    main()
