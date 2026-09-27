"""
training/validate_negatives.py
==============================
Validation helper for pseudo-absence negative samples in PARVAAH ML-Service.

Loads:
- ml-service/data/processed/positive_events_v1.csv
- ml-service/data/processed/negative_samples_v1.csv

Prints a concise comparative summary:
- Row counts and class distribution (1 vs 0).
- Feature distributions (min, mean, max) for positives vs negatives:
    rainfall_24h_mm, rainfall_48h_mm, rainfall_7d_mm,
    soil_moisture_percent, slope_degrees, elevation_m,
    historical_landslide_density
- Missing-value counts per feature in negatives.
- Anomaly warnings (e.g., all negatives near zero, high NaNs).

Does NOT modify any files.
Does NOT train any model.
"""

import argparse
import io
import sys
from pathlib import Path
from typing import List

# Force UTF-8 on Windows
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd

SHARED_FEATURES: List[str] = [
    "rainfall_24h_mm",
    "rainfall_48h_mm",
    "rainfall_7d_mm",
    "soil_moisture_percent",
    "slope_degrees",
    "elevation_m",
    "historical_landslide_density",
]


def validate_negatives(
    positive_csv_path: Path,
    negative_csv_path: Path,
) -> None:
    print("=" * 68)
    print("  PARVAAH NEGATIVE SAMPLES VALIDATION HELPER")
    print("=" * 68)

    if not positive_csv_path.exists():
        print(f"ERROR: Positive dataset not found at: {positive_csv_path}")
        sys.exit(1)
    if not negative_csv_path.exists():
        print(f"ERROR: Negative dataset not found at: {negative_csv_path}")
        print("Please run 'python training/build_negative_samples.py' first.")
        sys.exit(1)

    df_pos = pd.read_csv(positive_csv_path)
    df_neg = pd.read_csv(negative_csv_path)

    pos_count = len(df_pos)
    neg_count = len(df_neg)
    total_count = pos_count + neg_count

    print(f"Positive Events (`y = 1`): {pos_count:,}")
    print(f"Negative Samples (`y = 0`): {neg_count:,}")
    print(f"Total Dataset Size:       {total_count:,}")
    print(f"Class Ratio (Neg : Pos):  {neg_count / max(1, pos_count):.2f} : 1")
    print("-" * 68)

    # Missing values in negatives
    print("\n[Missing Values in Negative Samples]")
    missing_flags = []
    for f in SHARED_FEATURES:
        if f in df_neg.columns:
            nulls = int(df_neg[f].isna().sum())
            pct = (nulls / max(1, neg_count)) * 100
            print(f"  {f:28s}: {nulls:4d} nulls ({pct:5.1f}%)")
            if pct > 10.0:
                missing_flags.append(f"High missing rate in {f} ({pct:.1f}%)")
        else:
            print(f"  {f:28s}: MISSING COLUMN")
            missing_flags.append(f"Column '{f}' not present in negative samples")

    print("\n" + "-" * 68)
    print(f"{'Feature':<28} | {'Positives (Min/Mean/Max)':<22} | {'Negatives (Min/Mean/Max)'}")
    print("-" * 68)

    anomalies = []

    for f in SHARED_FEATURES:
        # Positives
        if f in df_pos.columns and pd.api.types.is_numeric_dtype(df_pos[f]):
            s_pos = df_pos[f].dropna()
            pos_str = f"{s_pos.min():.1f} / {s_pos.mean():.1f} / {s_pos.max():.1f}" if not s_pos.empty else "N/A"
            p_mean = s_pos.mean() if not s_pos.empty else 0.0
        else:
            pos_str = "N/A"
            p_mean = 0.0

        # Negatives
        if f in df_neg.columns and pd.api.types.is_numeric_dtype(df_neg[f]):
            s_neg = df_neg[f].dropna()
            neg_str = f"{s_neg.min():.1f} / {s_neg.mean():.1f} / {s_neg.max():.1f}" if not s_neg.empty else "N/A"
            n_mean = s_neg.mean() if not s_neg.empty else 0.0
            n_max = s_neg.max() if not s_neg.empty else 0.0
        else:
            neg_str = "N/A"
            n_mean = 0.0
            n_max = 0.0

        print(f"{f:<28} | {pos_str:<22} | {neg_str}")

        # Anomaly checks
        if "rainfall" in f and n_max == 0.0 and neg_count > 0:
            anomalies.append(f"Warning: All negative samples have 0.0 for {f}.")
        if f == "slope_degrees" and n_mean < 0.5 and neg_count > 0:
            anomalies.append(f"Notice: Extremely flat terrain in negatives (slope mean: {n_mean:.2f}°).")

    print("-" * 68)
    print("\n[Quality & Anomaly Diagnostics]")
    if missing_flags:
        for mf in missing_flags:
            print(f"  ⚠️  {mf}")
    if anomalies:
        for anom in anomalies:
            print(f"  ⚠️  {anom}")
    if not missing_flags and not anomalies:
        print("  ✅ No critical anomalies detected. Features exhibit valid numeric ranges.")

    print("\nNote: Negatives are pseudo-absences based on real environmental data, not verified non-events.")
    print("=" * 68 + "\n")


def main():
    root_dir = Path(__file__).resolve().parent.parent
    default_pos = root_dir / "data" / "processed" / "positive_events_v1.csv"
    default_neg = root_dir / "data" / "processed" / "negative_samples_v1.csv"

    parser = argparse.ArgumentParser(description="Validate generated negative samples against positive events.")
    parser.add_argument("--positives", default=str(default_pos), help="Path to positive_events_v1.csv")
    parser.add_argument("--negatives", default=str(default_neg), help="Path to negative_samples_v1.csv")
    args = parser.parse_args()

    validate_negatives(
        positive_csv_path=Path(args.positives).resolve(),
        negative_csv_path=Path(args.negatives).resolve(),
    )


if __name__ == "__main__":
    main()
