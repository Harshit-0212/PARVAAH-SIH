"""
ml-service/training/compute_relocation_plan.py
=============================================
Computes carrying capacity and immediate relocation needs for vulnerable habitations
identified as hazard-based Red Zones in alignment with SIH26191.

Outputs:
  ml-service/data/processed/relocation_plan_v1.csv
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Setup paths relative to script
SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parent
DATA_PROCESSED_DIR = BASE_DIR / "data" / "processed"
DATA_SAMPLE_DIR = BASE_DIR / "data" / "sample"

ZONE_SUMMARY_PATH = DATA_PROCESSED_DIR / "zone_risk_summary_v1.csv"
SITES_PATH = DATA_SAMPLE_DIR / "safer_relocation_sites_demo.csv"
OUTPUT_PATH = DATA_PROCESSED_DIR / "relocation_plan_v1.csv"


def load_inputs():
    if not ZONE_SUMMARY_PATH.exists():
        raise FileNotFoundError(
            f"Zone risk summary not found at: {ZONE_SUMMARY_PATH}. "
            "Please run ml-service/training/aggregate_zone_risk.py first."
        )
    if not SITES_PATH.exists():
        raise FileNotFoundError(
            f"Safer relocation sites dataset not found at: {SITES_PATH}."
        )

    zones_df = pd.read_csv(ZONE_SUMMARY_PATH)
    sites_df = pd.read_csv(SITES_PATH)
    return zones_df, sites_df


def assign_priority(zone_risk_level: str) -> str:
    """
    Assign relocation priority:
      - If zone_risk_level == 'CRITICAL' -> 'IMMEDIATE'
      - Else if zone_risk_level == 'HIGH' -> 'SHORT_TERM'
      - Else -> 'MEDIUM_TERM'
    """
    level = str(zone_risk_level).strip().upper()
    if level == "CRITICAL":
        return "IMMEDIATE"
    elif level == "HIGH":
        return "SHORT_TERM"
    else:
        return "MEDIUM_TERM"


def compute_relocation_plan() -> pd.DataFrame:
    print(f"[1/4] Loading zone risk summary and safer relocation sites...")
    zones_df, sites_df = load_inputs()

    # Filter to red zones (red_zone_flag == True)
    red_zones = zones_df[zones_df["red_zone_flag"] == True].copy()
    print(f"[2/4] Processing {len(red_zones)} identified Red Zones for carrying capacity assessment...")

    plan_rows = []

    for _, row in red_zones.iterrows():
        state = str(row["state"]).strip()
        district = str(row["district"]).strip()
        zone_risk_level = str(row["zone_risk_level"]).strip().upper()
        red_zone_flag = bool(row["red_zone_flag"])
        total_points = int(row["total_points"])
        centroid_lat = float(row["centroid_lat"])
        centroid_lon = float(row["centroid_lon"])

        # Estimate population_families = total_points * 5 (proxy)
        population_families = total_points * 5

        # Priority
        priority = assign_priority(zone_risk_level)

        # Compute vulnerability_score (0-100) using only row-level fields:
        # base_score = 50
        # if zone_risk_level == "CRITICAL": base_score += 30
        # elif zone_risk_level == "HIGH": base_score += 15
        # if population_families > 200: base_score += 10
        # if historical_landslide_density > 50: base_score += 10
        # vulnerability_score = min(base_score, 100)
        historical_density = float(row.get("historical_landslide_density", 0.0) or 0.0)
        base_score = 50
        if zone_risk_level == "CRITICAL":
            base_score += 30
        elif zone_risk_level == "HIGH":
            base_score += 15
        if population_families > 200:
            base_score += 10
        if historical_density > 50:
            base_score += 10
        vulnerability_score = min(base_score, 100)

        # Recommend relocation sites:
        # Prefer sites in same district, then same state
        district_sites = sites_df[
            (sites_df["state"].str.lower() == state.lower()) &
            (sites_df["district"].str.lower() == district.lower())
        ]
        state_sites = sites_df[
            (sites_df["state"].str.lower() == state.lower()) &
            (sites_df["district"].str.lower() != district.lower())
        ]
        other_sites = sites_df[
            sites_df["state"].str.lower() != state.lower()
        ]

        candidate_sites = pd.concat([district_sites, state_sites, other_sites]).drop_duplicates(subset=["site_id"])

        selected_site_ids = []
        accumulated_capacity = 0

        for _, site in candidate_sites.iterrows():
            selected_site_ids.append(str(site["site_id"]))
            accumulated_capacity += int(site["capacity_families"])
            if accumulated_capacity >= population_families:
                break

        # Feasibility check: sum(capacity_families) >= population_families
        if accumulated_capacity >= population_families and len(selected_site_ids) > 0:
            relocation_feasibility = "FEASIBLE"
        else:
            relocation_feasibility = "INSUFFICIENT_CAPACITY"

        recommended_site_ids_str = ",".join(selected_site_ids)

        plan_rows.append({
            "state": state,
            "district": district,
            "zone_risk_level": zone_risk_level,
            "red_zone_flag": red_zone_flag,
            "total_points": total_points,
            "population_families": population_families,
            "priority": priority,
            "vulnerability_score": vulnerability_score,
            "recommended_site_ids": recommended_site_ids_str,
            "total_relocation_capacity_families": accumulated_capacity,
            "relocation_feasibility": relocation_feasibility,
            "centroid_lat": centroid_lat,
            "centroid_lon": centroid_lon,
        })

    plan_df = pd.DataFrame(plan_rows)

    # Reorder columns explicitly as specified
    columns = [
        "state",
        "district",
        "zone_risk_level",
        "red_zone_flag",
        "total_points",
        "population_families",
        "priority",
        "vulnerability_score",
        "recommended_site_ids",
        "total_relocation_capacity_families",
        "relocation_feasibility",
        "centroid_lat",
        "centroid_lon",
    ]
    plan_df = plan_df[columns]

    print(f"[3/4] Saving relocation plan to: {OUTPUT_PATH}")
    DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    plan_df.to_csv(OUTPUT_PATH, index=False)

    print(f"[4/4] Successfully generated relocation plan for {len(plan_df)} Red Zones.")
    print("Priority breakdown:", plan_df["priority"].value_counts().to_dict())
    print("Feasibility breakdown:", plan_df["relocation_feasibility"].value_counts().to_dict())

    return plan_df


if __name__ == "__main__":
    compute_relocation_plan()
