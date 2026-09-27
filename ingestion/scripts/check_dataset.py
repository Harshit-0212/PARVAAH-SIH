"""Validate the final research-only pilot training CSV before training."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = ROOT / "data" / "processed" / "landslide_training_v1.csv"
REQUIRED_COLUMNS = ["zone_id", "timestamp", "latitude", "longitude", "district", "state", "rainfall_24h_mm", "rainfall_72h_mm", "soil_moisture_percent", "slope_degrees", "elevation_m", "distance_to_road_m", "distance_to_river_m", "historical_landslide_density", "landslide_occurred", "event_id", "label_source", "feature_source", "data_quality_notes"]
FEATURE_COLUMNS = ["rainfall_24h_mm", "rainfall_72h_mm", "soil_moisture_percent", "slope_degrees", "elevation_m", "distance_to_road_m", "distance_to_river_m", "historical_landslide_density"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Check whether a pilot CSV is trainable without obvious leakage.")
    parser.add_argument("dataset", nargs="?", type=Path, default=DEFAULT_DATASET)
    args = parser.parse_args()
    if not args.dataset.exists():
        print(f"ERROR: dataset does not exist: {args.dataset}")
        return 2

    frame = pd.read_csv(args.dataset)
    missing_columns = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing_columns:
        print(f"ERROR: missing required columns: {', '.join(missing_columns)}")
        return 2

    print(f"Pilot dataset: {args.dataset}")
    print(f"Rows: {len(frame)}")
    print(f"Features used for training: {', '.join(FEATURE_COLUMNS)}")
    errors: list[str] = []
    warnings: list[str] = []

    blank_columns = [column for column in ["zone_id", "timestamp", "latitude", "longitude", "district", "state", "label_source", "feature_source", "data_quality_notes"] if frame[column].isna().any() or frame[column].astype(str).str.strip().eq("").any()]
    if blank_columns:
        errors.append(f"required fields contain blank values: {', '.join(blank_columns)}")

    parsed_time = pd.to_datetime(frame["timestamp"], errors="coerce", utc=True)
    if parsed_time.isna().any():
        errors.append(f"invalid timestamps: {int(parsed_time.isna().sum())}")

    numeric = {}
    for column in ["latitude", "longitude", *FEATURE_COLUMNS, "landslide_occurred"]:
        numeric[column] = pd.to_numeric(frame[column], errors="coerce")
        missing = int(numeric[column].isna().sum())
        if missing:
            errors.append(f"{column} missing/non-numeric values: {missing}")

    invalid_coordinates = ((numeric["latitude"] < -90) | (numeric["latitude"] > 90) | (numeric["longitude"] < -180) | (numeric["longitude"] > 180)).fillna(False)
    if invalid_coordinates.any():
        errors.append(f"invalid coordinates: {int(invalid_coordinates.sum())}")

    ranges = [("rainfall_24h_mm", 0, 3000), ("rainfall_72h_mm", 0, 9000), ("soil_moisture_percent", 0, 100), ("slope_degrees", 0, 90), ("elevation_m", 0, 10000), ("distance_to_road_m", 0, 1000000), ("distance_to_river_m", 0, 1000000), ("historical_landslide_density", 0, 1)]
    for column, lower, upper in ranges:
        invalid = (numeric[column] < lower) | (numeric[column] > upper)
        if invalid.any():
            errors.append(f"{column} outside [{lower}, {upper}]: {int(invalid.sum())}")

    target_values = set(numeric["landslide_occurred"].dropna().astype(int).unique())
    print(f"Class counts: {frame['landslide_occurred'].value_counts(dropna=False).to_dict()}")
    if not target_values.issubset({0, 1}):
        errors.append(f"target contains values other than 0/1: {sorted(target_values)}")
    if target_values != {0, 1}:
        errors.append("target must contain both 0 and 1 before training")

    duplicate_mask = frame.duplicated(subset=["zone_id", "timestamp"], keep=False)
    if duplicate_mask.any():
        errors.append(f"duplicate zone/timestamp records: {int(duplicate_mask.sum())}")

    blank_provenance = frame[["label_source", "feature_source", "data_quality_notes"]].isna().any(axis=1) | (frame[["label_source", "feature_source", "data_quality_notes"]].astype(str).apply(lambda col: col.str.strip() == "").any(axis=1))
    if blank_provenance.any():
        errors.append(f"rows missing source/quality provenance: {int(blank_provenance.sum())}")

    leakage_columns = [column for column in frame.columns if any(token in column.casefold() for token in ["outcome", "response", "post_event", "after_event", "evacuation", "warning_issued"])]
    if leakage_columns:
        errors.append(f"possible post-event leakage columns present: {', '.join(leakage_columns)}")
    if "landslide_occurred" in FEATURE_COLUMNS:
        errors.append("landslide_occurred is incorrectly included as a feature")
    non_feature_numeric = [column for column in frame.columns if column not in FEATURE_COLUMNS and column not in REQUIRED_COLUMNS]
    if non_feature_numeric:
        warnings.append(f"unrecognised columns are ignored: {', '.join(non_feature_numeric)}")

    if len(frame) < 20:
        warnings.append("fewer than 20 rows: evaluation will likely be unstable")
    if frame["zone_id"].nunique() < 2:
        warnings.append("only one zone is present: spatial generalisation cannot be evaluated")
    if frame["timestamp"].duplicated().any():
        warnings.append("timestamps repeat across zones; use zone-aware interpretation")

    if errors:
        print("\nNOT READY")
        for error in errors:
            print(f"- ERROR: {error}")
        for warning in warnings:
            print(f"- WARNING: {warning}")
        return 3

    print("\nREADY FOR PILOT TRAINING CHECKS")
    for warning in warnings:
        print(f"- WARNING: {warning}")
    print("No obvious schema, range, duplicate, coordinate, class-balance, or leakage errors found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
