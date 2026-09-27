"""
ml-service/training/aggregate_zone_risk.py
=========================================
Aggregates historical landslide event data by (state, district) to identify
hazard-based red zones in alignment with SIH26191.

Outputs:
  ml-service/data/processed/zone_risk_summary_v1.csv
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Setup paths relative to script
SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parent
DATA_PROCESSED_DIR = BASE_DIR / "data" / "processed"

POSITIVE_EVENTS_PATH = DATA_PROCESSED_DIR / "positive_events_v1.csv"
TRAINING_PATH = DATA_PROCESSED_DIR / "training_with_negatives_v1.csv"
OUTPUT_PATH = DATA_PROCESSED_DIR / "zone_risk_summary_v1.csv"


def load_dataset() -> pd.DataFrame:
    """Load positive events dataset, with fallback to training dataset."""
    if POSITIVE_EVENTS_PATH.exists():
        print(f"[1/4] Loading positive events from: {POSITIVE_EVENTS_PATH}")
        df = pd.read_csv(POSITIVE_EVENTS_PATH)
    elif TRAINING_PATH.exists():
        print(f"[1/4] Positive events not found; loading training dataset from: {TRAINING_PATH}")
        df = pd.read_csv(TRAINING_PATH)
        if "landslide_occurred" in df.columns:
            df = df[df["landslide_occurred"] == 1.0].copy()
    else:
        raise FileNotFoundError(
            f"Neither {POSITIVE_EVENTS_PATH} nor {TRAINING_PATH} could be found."
        )
    return df


def classify_point_risk(row: pd.Series) -> str:
    """
    Classify individual point risk using available risk_level, or
    approximate using high historical landslide density + steep terrain slope.
    """
    if "risk_level" in row and pd.notnull(row["risk_level"]):
        lvl = str(row["risk_level"]).strip().upper()
        if lvl in ["CRITICAL", "HIGH", "MODERATE", "LOW"]:
            return lvl

    # Approximate using historical density and slope:
    density = float(row.get("historical_landslide_density", 0.0) or 0.0)
    slope = float(row.get("slope_degrees", 0.0) or 0.0)

    # CRITICAL criteria: Very high historical density + steep slope, or severe density
    if (density >= 45.0 and slope >= 14.0) or (density >= 65.0):
        return "CRITICAL"
    # HIGH criteria: Substantial density + moderate-to-steep slope, or very steep slope
    elif ((density >= 25.0 and slope >= 10.0) or (density >= 35.0) or (slope >= 22.0)):
        return "HIGH"
    elif (density >= 12.0 or slope >= 15.0):
        return "MODERATE"
    else:
        return "LOW"


def assign_zone_risk_level(percent_high_or_critical: float) -> str:
    """
    Assign zone_risk_level according to SIH26191 aggregation specification:
      percent >= 0.50 -> CRITICAL
      percent >= 0.25 -> HIGH
      percent >= 0.10 -> MODERATE
      else            -> LOW
    """
    if percent_high_or_critical >= 0.5:
        return "CRITICAL"
    elif percent_high_or_critical >= 0.25:
        return "HIGH"
    elif percent_high_or_critical >= 0.10:
        return "MODERATE"
    else:
        return "LOW"


def aggregate_zone_risk() -> pd.DataFrame:
    df = load_dataset()

    # Clean state and district fields
    # Keep records where district is known for precise district administration
    df = df.dropna(subset=["state", "district"]).copy()
    df["state"] = df["state"].astype(str).str.strip()
    df["district"] = df["district"].astype(str).str.strip()
    df = df[(df["state"] != "") & (df["district"] != "") & (df["district"].str.lower() != "nan")]

    print(f"[2/4] Processing {len(df)} geocoded hazard events across state/district pairs...")

    # Classify each point
    point_risks = [classify_point_risk(row) for _, row in df.iterrows()]
    df["point_risk_level"] = point_risks
    df["is_critical"] = (df["point_risk_level"] == "CRITICAL").astype(int)
    df["is_high"] = (df["point_risk_level"] == "HIGH").astype(int)

    # Group by state and district
    print("[3/4] Grouping by (state, district) and computing centroids, flood risk, and risk indicators...")
    grouped = df.groupby(["state", "district"], as_index=False).agg(
        total_points=("latitude", "count"),
        count_critical=("is_critical", "sum"),
        count_high=("is_high", "sum"),
        centroid_lat=("latitude", "mean"),
        centroid_lon=("longitude", "mean"),
        rainfall_7d_mm=("rainfall_7d_mm", "mean"),
        soil_moisture_percent=("soil_moisture_percent", "mean"),
        elevation_m=("elevation_m", "mean"),
        historical_landslide_density=("historical_landslide_density", "mean"),
    )

    # Compute high/critical percentage
    grouped["percent_high_or_critical"] = (
        (grouped["count_high"] + grouped["count_critical"]) / grouped["total_points"]
    ).round(4)

    # Assign zone risk level
    grouped["zone_risk_level"] = grouped["percent_high_or_critical"].apply(assign_zone_risk_level)

    # Assign red_zone_flag: TRUE if zone_risk_level in ["HIGH", "CRITICAL"], FALSE otherwise
    grouped["red_zone_flag"] = grouped["zone_risk_level"].isin(["HIGH", "CRITICAL"])

    # Compute flood risk score per district using data fields:
    # rainfall_7d_mm, soil_moisture_percent, elevation_m
    # Normalize each to 0-1 based on dataset min/max:
    # flood_risk_score = 0.5*rainfall_7d + 0.3*soil_moisture + 0.2*(1/elevation)
    r_min, r_max = grouped["rainfall_7d_mm"].min(), grouped["rainfall_7d_mm"].max()
    sm_min, sm_max = grouped["soil_moisture_percent"].min(), grouped["soil_moisture_percent"].max()
    elev_inv = 1.0 / grouped["elevation_m"].fillna(grouped["elevation_m"].median()).clip(lower=1.0)
    elev_inv_min, elev_inv_max = elev_inv.min(), elev_inv.max()

    norm_r = (grouped["rainfall_7d_mm"] - r_min) / (r_max - r_min + 1e-9)
    norm_sm = (grouped["soil_moisture_percent"] - sm_min) / (sm_max - sm_min + 1e-9)
    norm_elev = (elev_inv - elev_inv_min) / (elev_inv_max - elev_inv_min + 1e-9)

    grouped["flood_risk_score"] = (0.5 * norm_r + 0.3 * norm_sm + 0.2 * norm_elev).round(4)

    # Classify flood_risk_level dynamically: LOW / MODERATE / HIGH / CRITICAL
    def classify_flood_risk(score: float) -> str:
        if score >= 0.55:
            return "CRITICAL"
        elif score >= 0.40:
            return "HIGH"
        elif score >= 0.25:
            return "MODERATE"
        else:
            return "LOW"

    grouped["flood_risk_level"] = grouped["flood_risk_score"].apply(classify_flood_risk)
    grouped["flood_red_zone_flag"] = grouped["flood_risk_level"].isin(["HIGH", "CRITICAL"])

    # Round centroid coordinates and density for clean presentation
    grouped["centroid_lat"] = grouped["centroid_lat"].round(6)
    grouped["centroid_lon"] = grouped["centroid_lon"].round(6)
    grouped["historical_landslide_density"] = grouped["historical_landslide_density"].round(2)

    # Enforce specified column order
    columns = [
        "state",
        "district",
        "total_points",
        "count_critical",
        "count_high",
        "percent_high_or_critical",
        "zone_risk_level",
        "red_zone_flag",
        "flood_risk_score",
        "flood_risk_level",
        "flood_red_zone_flag",
        "historical_landslide_density",
        "centroid_lat",
        "centroid_lon",
    ]
    summary_df = grouped[columns].sort_values(
        by=["red_zone_flag", "total_points", "percent_high_or_critical"],
        ascending=[False, False, False]
    ).reset_index(drop=True)

    # Save to output CSV
    DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    summary_df.to_csv(OUTPUT_PATH, index=False)
    print(f"[4/4] Successfully saved zone risk summary to: {OUTPUT_PATH}")
    print(f"Total aggregated zones: {len(summary_df)}")
    print(f"Landslide Red zones identified: {summary_df['red_zone_flag'].sum()} ({summary_df['zone_risk_level'].value_counts().to_dict()})")
    print(f"Flood Red zones identified: {summary_df['flood_red_zone_flag'].sum()} ({summary_df['flood_risk_level'].value_counts().to_dict()})")

    return summary_df


if __name__ == "__main__":
    aggregate_zone_risk()
