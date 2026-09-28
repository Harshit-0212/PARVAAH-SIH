"""
PARVAAH SIH - Hyper-Local Flash Flood Early Warning System (EWS) Core Engine
=============================================================================
Dataset References:
- INDOFLOODS dataset (Kuntla & Saharia 2025, DOI: 10.1175/BAMS-D-24-0008.1, Zenodo: 10.5281/zenodo.14584654)
- Rainfall: IMD Gridded / Open-Meteo Forecast
- Terrain: SRTM/Bhuvan DEM, HydroSHEDS / OSM Stream networks
"""

import json
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd


# ============================================================================
# 1. INDOFLOODS DATASET PROCESSOR
# ============================================================================

class IndoFloodsProcessor:
    """
    Parses and aggregates historical flood events from the INDOFLOODS catalog.
    Computes spatial flood frequency at village/ward or district level.
    """

    def __init__(self, indofloods_csv_path: Optional[str] = None):
        self.csv_path = indofloods_csv_path
        self.frequency_map: Dict[str, int] = {}
        if indofloods_csv_path:
            self.load_dataset(indofloods_csv_path)

    def load_dataset(self, csv_path: str) -> pd.DataFrame:
        """
        Loads the INDOFLOODS CSV. Adapts to common column headers in INDOFLOODS
        (e.g., 'District', 'State', 'Village', 'Ward', 'SubDistrict', 'Latitude', 'Longitude').
        """
        self.csv_path = csv_path
        df = pd.read_csv(csv_path)
        
        # Standardize column names to lowercase
        df.columns = [c.strip().lower() for c in df.columns]
        
        # Determine aggregation key (Ward/Village if present, fallback to SubDistrict/District)
        id_col = None
        for candidate in ["ward_id", "village_code", "village", "ward", "subdistrict", "district"]:
            if candidate in df.columns:
                id_col = candidate
                break
        
        if id_col:
            counts = df[id_col].astype(str).str.strip().str.upper().value_counts()
            self.frequency_map = counts.to_dict()
        else:
            self.frequency_map = {}
            
        return df

    def get_historical_flood_count(self, identifier: str) -> int:
        """
        Returns the number of recorded flood events for a given ward/village/district key.
        """
        key = str(identifier).strip().upper()
        return self.frequency_map.get(key, 0)


# ============================================================================
# 2. GRID-LEVEL FLOOD RISK SCORING
# ============================================================================

def normalize(val: float, min_val: float, max_val: float, invert: bool = False) -> float:
    """
    Clamps and scales a value to [0.0, 1.0].
    If invert=True, lower values yield higher hazard indices (e.g. slope, elevation, distance to stream).
    """
    clipped = max(min_val, min(max_val, val))
    norm = (clipped - min_val) / (max_val - min_val) if max_val > min_val else 0.0
    return 1.0 - norm if invert else norm


def calculate_flood_risk(
    rainfall_24h: float,              # mm (Antecedent soil saturation driver)
    rainfall_forecast_6h: float,      # mm (Imminent flash flood trigger)
    slope: float,                     # degrees (Lower slope = ponding/pooling)
    elevation: float,                 # meters (Lower elevation = valley bottom / flood plain)
    dist_to_stream: float,            # meters (Closer to stream = higher overbank vulnerability)
    historical_flood_count: int,      # Frequency count from INDOFLOODS
    weights: Optional[Dict[str, float]] = None
) -> Tuple[float, str]:
    """
    Computes a composite physical & historical flood risk score (0-100) and risk category.
    
    Weights default:
    - 0.35: Imminent trigger (Forecast rainfall next 6h)
    - 0.20: Antecedent moisture / saturation (Last 24h rainfall)
    - 0.15: Distance to river/stream buffer
    - 0.12: Terrain slope (flatlands promote flash ponding)
    - 0.08: Elevation relative to catchment
    - 0.10: Historical flood recurrence (INDOFLOODS frequency)
    
    *Future note: This rule-based multi-criteria index can be seamlessly replaced
    with an XGBoost or Random Forest regressor trained on historical flood extents.*
    """
    if weights is None:
        weights = {
            "forecast_6h": 0.35,
            "rain_24h": 0.20,
            "dist_stream": 0.15,
            "slope": 0.12,
            "elevation": 0.08,
            "history": 0.10
        }

    # Sub-indices normalization [0, 1]
    # Forecast 6h: 0mm to 100mm+ (IMD heavy/extremely heavy thresholds)
    i_forecast = normalize(rainfall_forecast_6h, 0.0, 100.0)
    
    # Rainfall 24h: 0mm to 200mm+
    i_rain24h = normalize(rainfall_24h, 0.0, 200.0)
    
    # Distance to stream: <= 20m is maximum risk (1.0), >= 1000m is low risk (0.0)
    i_stream = normalize(dist_to_stream, 20.0, 1000.0, invert=True)
    
    # Slope: <= 1 deg (flat basin) is 1.0, >= 25 deg is 0.0
    i_slope = normalize(slope, 1.0, 25.0, invert=True)
    
    # Elevation: <= 10m is 1.0, >= 300m is 0.0 (normalized within local catchment envelope)
    i_elevation = normalize(elevation, 10.0, 300.0, invert=True)
    
    # Historical INDOFLOODS count: 0 events -> 0.0, >= 5 events -> 1.0
    i_history = normalize(float(historical_flood_count), 0.0, 5.0)

    # Composite weighted summation
    raw_score = (
        weights["forecast_6h"] * i_forecast +
        weights["rain_24h"] * i_rain24h +
        weights["dist_stream"] * i_stream +
        weights["slope"] * i_slope +
        weights["elevation"] * i_elevation +
        weights["history"] * i_history
    ) * 100.0

    risk_score = round(float(np.clip(raw_score, 0.0, 100.0)), 2)

    # Categorization
    if risk_score >= 70.0:
        category = "Very High"
    elif risk_score >= 50.0:
        category = "High"
    elif risk_score >= 30.0:
        category = "Medium"
    else:
        category = "Low"

    return risk_score, category


# ============================================================================
# 3. WARD / VILLAGE LEVEL AGGREGATION
# ============================================================================

def aggregate_to_wards(
    grid_risks: pd.DataFrame, 
    ward_boundaries: Optional[pd.DataFrame] = None
) -> pd.DataFrame:
    """
    Aggregates grid-cell level risk scores into ward/village spatial administrative units.
    
    Expected grid_risks columns:
    ['grid_id', 'ward_id', 'ward_name', 'risk_score', 'forecast_6h', 'forecast_12h', 'forecast_24h', 'stream_name']
    """
    results = []

    for ward_id, group in grid_risks.groupby("ward_id"):
        ward_name = group["ward_name"].iloc[0] if "ward_name" in group.columns else f"Ward-{ward_id}"
        
        avg_risk = float(group["risk_score"].mean())
        max_risk = float(group["risk_score"].max())
        
        # Primary stream affecting this ward
        primary_stream = (
            group["stream_name"].mode()[0] 
            if "stream_name" in group.columns and not group["stream_name"].dropna().empty 
            else "Local Drainage Canal"
        )
        
        # Determine ward category based on 70% max + 30% avg to prevent localized flash hotspots from being diluted
        ward_composite_score = round((0.70 * max_risk) + (0.30 * avg_risk), 2)
        
        if ward_composite_score >= 70.0:
            category = "Very High"
        elif ward_composite_score >= 50.0:
            category = "High"
        elif ward_composite_score >= 30.0:
            category = "Medium"
        else:
            category = "Low"

        # Estimate lead time based on when the rainfall peak triggers the threshold
        # If imminent 6h forecast already high -> 3-6h lead time; else 6-12h or 12-24h
        avg_f6 = group["forecast_6h"].mean() if "forecast_6h" in group.columns else 0.0
        avg_f12 = group["forecast_12h"].mean() if "forecast_12h" in group.columns else 0.0

        if category in ["High", "Very High"]:
            if avg_f6 >= 45.0:
                lead_time_hours = 3.0  # Immediate flash alert (3-6 hrs)
            elif avg_f12 >= 55.0:
                lead_time_hours = 8.0  # 6-12 hrs
            else:
                lead_time_hours = 12.0 # 12-24 hrs
        else:
            lead_time_hours = 24.0

        results.append({
            "ward_id": ward_id,
            "ward_name": ward_name,
            "avg_risk_score": round(avg_risk, 2),
            "max_risk_score": round(max_risk, 2),
            "composite_risk_score": ward_composite_score,
            "risk_category": category,
            "estimated_lead_time_hours": lead_time_hours,
            "primary_stream": primary_stream,
            "total_cells": len(group),
            "high_risk_cells": int((group["risk_score"] >= 50.0).sum())
        })

    ward_df = pd.DataFrame(results)
    
    # Merge GIS boundaries / metadata if provided
    if ward_boundaries is not None and "ward_id" in ward_boundaries.columns:
        ward_df = pd.merge(ward_df, ward_boundaries, on="ward_id", how="left")
        
    return ward_df


# ============================================================================
# 4. ACTIONABLE EARLY WARNING GENERATOR
# ============================================================================

@dataclass
class FloodAlert:
    ward_id: str
    ward_name: str
    risk_category: str
    risk_score: float
    lead_time_hours: float
    action_text: str
    recommended_shelter: str
    evacuation_route: str


def generate_early_warnings(
    ward_risks: pd.DataFrame, 
    threshold_high: float = 50.0, 
    threshold_very_high: float = 70.0
) -> List[Dict[str, Any]]:
    """
    Filters wards exceeding threat thresholds and synthesizes hyper-local,
    actionable advisories with streams, evacuation routes, and shelter destinations.
    """
    alerts: List[Dict[str, Any]] = []

    # Safe shelters & route catalog (or dynamic lookup from PostGIS / OSM table)
    SHELTER_MAP = {
        "default": ("Community Cyclone/Flood Shelter", "High-ground Arterial Road 1"),
        "Ward-101": ("Govt Higher Secondary School", "Ward 101 Link Rd -> NH-27"),
        "Ward-102": ("Town Hall & Sports Complex", "Station Bypass Road"),
        "Ward-103": ("District Multi-Purpose Shelter", "State Highway 12"),
    }

    for _, row in ward_risks.iterrows():
        score = row["composite_risk_score"]
        if score < threshold_high:
            continue

        ward_id = str(row["ward_id"])
        ward_name = row.get("ward_name", f"Ward {ward_id}")
        category = "Very High" if score >= threshold_very_high else "High"
        lead_time = row.get("estimated_lead_time_hours", 6.0)
        stream = row.get("primary_stream", "the nearby river channel")
        
        shelter, route = SHELTER_MAP.get(ward_id, SHELTER_MAP["default"])

        if category == "Very High":
            action_text = (
                f"CRITICAL: Extreme flash flood risk ({score}/100) expected within {int(lead_time)} hours. "
                f"IMMEDIATE EVACUATION required for low-lying settlements within 300m of {stream}. "
                f"Move via [{route}] to emergency relief camp at [{shelter}]. Keep livestock unchained."
            )
        else:
            action_text = (
                f"WARNING: High flood risk ({score}/100) anticipated within {int(lead_time)} hours. "
                f"Residents near {stream} should prepare for rapid water level rise. "
                f"Stage evacuation readiness; use [{route}] to reach [{shelter}] if water enters access roads."
            )

        alert = FloodAlert(
            ward_id=ward_id,
            ward_name=ward_name,
            risk_category=category,
            risk_score=score,
            lead_time_hours=lead_time,
            action_text=action_text,
            recommended_shelter=shelter,
            evacuation_route=route
        )
        alerts.append(alert.__dict__)

    return alerts


# ============================================================================
# 5. END-TO-END DEMO EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("PARVAAH EWS - Flash Flood Model & Early Warning Test Run")
    print("=" * 70)

    # 1. Simulate INDOFLOODS historical catalog
    sample_indofloods_data = {
        "flood_id": [1, 2, 3, 4, 5, 6],
        "state": ["Assam", "Assam", "Assam", "Assam", "Assam", "Assam"],
        "district": ["Kamrup", "Kamrup", "Kamrup", "Darrang", "Kamrup", "Kamrup"],
        "ward_id": ["W-01", "W-01", "W-01", "W-02", "W-02", "W-03"],
        "year": [2018, 2019, 2020, 2022, 2023, 2021]
    }
    sample_df = pd.DataFrame(sample_indofloods_data)
    csv_temp_path = "sample_indofloods.csv"
    sample_df.to_csv(csv_temp_path, index=False)

    processor = IndoFloodsProcessor(csv_temp_path)
    print(f"Historical flood frequencies loaded: {processor.frequency_map}")

    # 2. Simulate grid-cell telemetry (e.g. 500m cells across 3 wards)
    np.random.seed(42)
    grid_cells = [
        {"grid_id": "G-1", "ward_id": "W-01", "ward_name": "Silpukhuri Ward", "rain_24h": 120.0, "rain_6h": 65.0, "rain_12h": 85.0, "slope": 2.1, "elevation": 35.0, "dist_stream": 45.0, "stream_name": "Bharalu Stream"},
        {"grid_id": "G-2", "ward_id": "W-01", "ward_name": "Silpukhuri Ward", "rain_24h": 115.0, "rain_6h": 55.0, "rain_12h": 75.0, "slope": 3.4, "elevation": 42.0, "dist_stream": 85.0, "stream_name": "Bharalu Stream"},
        {"grid_id": "G-3", "ward_id": "W-02", "ward_name": "Dispur Valley",   "rain_24h": 80.0,  "rain_6h": 48.0, "rain_12h": 60.0, "slope": 4.5, "elevation": 58.0, "dist_stream": 120.0, "stream_name": "Basistha River"},
        {"grid_id": "G-4", "ward_id": "W-02", "ward_name": "Dispur Valley",   "rain_24h": 75.0,  "rain_6h": 32.0, "rain_12h": 45.0, "slope": 8.0, "elevation": 70.0, "dist_stream": 350.0, "stream_name": "Basistha River"},
        {"grid_id": "G-5", "ward_id": "W-03", "ward_name": "Kamakhya Foothills","rain_24h": 25.0,"rain_6h": 10.0, "rain_12h": 15.0, "slope": 18.0,"elevation": 180.0,"dist_stream": 650.0, "stream_name": "Brahmaputra Tributary"},
    ]

    # Calculate risk score for each cell
    for cell in grid_cells:
        hist_count = processor.get_historical_flood_count(cell["ward_id"])
        score, cat = calculate_flood_risk(
            rainfall_24h=cell["rain_24h"],
            rainfall_forecast_6h=cell["rain_6h"],
            slope=cell["slope"],
            elevation=cell["elevation"],
            dist_to_stream=cell["dist_stream"],
            historical_flood_count=hist_count
        )
        cell["risk_score"] = score
        cell["risk_category"] = cat

    grid_df = pd.DataFrame(grid_cells)
    print("\n--- Grid-level Risk Sample ---")
    print(grid_df[["grid_id", "ward_id", "risk_score", "risk_category"]])

    # 3. Aggregate to Ward level
    ward_summary = aggregate_to_wards(grid_df)
    print("\n--- Ward-level Risk Aggregation ---")
    print(ward_summary[["ward_id", "ward_name", "composite_risk_score", "risk_category", "estimated_lead_time_hours"]])

    # 4. Generate Early Warnings
    alerts = generate_early_warnings(ward_summary, threshold_high=50.0, threshold_very_high=70.0)
    print(f"\n--- Generated Actionable Alerts ({len(alerts)} active) ---")
    for a in alerts:
        print(f"\n[ALERT] {a['ward_name']} ({a['ward_id']}) - {a['risk_category']} ({a['risk_score']}/100)")
        print(f"Lead Time : ~{a['lead_time_hours']} hours")
        print(f"Advisory  : {a['action_text']}")
