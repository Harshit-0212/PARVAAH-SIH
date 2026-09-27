"""Prepare a research-only East Sikkim pilot training dataset.

This script reads user-supplied CSV files only. It never downloads data and never
creates measurements. Positive labels come from accepted event inventory rows;
negative labels require an explicit no_landslide_observed field in the rainfall
file so that absence is not silently treated as truth.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "data" / "processed" / "landslide_training_v1.csv"
PILOT_AREA = "East Sikkim district"
PILOT_DISTRICT = "East Sikkim"
EVENT_COLUMNS = ["event_id", "event_time", "latitude", "longitude", "district", "state", "event_type", "source", "reliability"]
ZONE_COLUMNS = ["zone_id", "zone_name", "district", "state", "latitude", "longitude", "slope_degrees", "elevation_m", "distance_to_road_m", "distance_to_river_m", "historical_landslide_density", "terrain_source", "terrain_updated_at"]
RAINFALL_COLUMNS = ["zone_id", "timestamp", "rainfall_24h_mm", "rainfall_72h_mm", "soil_moisture_percent", "no_landslide_observed"]
OUTPUT_COLUMNS = ["zone_id", "timestamp", "latitude", "longitude", "district", "state", "rainfall_24h_mm", "rainfall_72h_mm", "soil_moisture_percent", "slope_degrees", "elevation_m", "distance_to_road_m", "distance_to_river_m", "historical_landslide_density", "landslide_occurred", "event_id", "label_source", "feature_source", "data_quality_notes"]


def norm(value: Any) -> str:
    return str(value).strip().casefold()


def is_pilot_district(value: Any) -> bool:
    return norm(value).removesuffix(" district") == norm(PILOT_DISTRICT)


def require_columns(frame: pd.DataFrame, required: list[str], name: str) -> None:
    missing = [column for column in required if column not in frame.columns]
    if missing:
        raise ValueError(f"{name} is missing required columns: {', '.join(missing)}")


def valid_coordinate(lat: Any, lon: Any) -> bool:
    try:
        return -90 <= float(lat) <= 90 and -180 <= float(lon) <= 180
    except (TypeError, ValueError):
        return False


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def parse_bool(value: Any) -> bool | None:
    if pd.isna(value):
        return None
    text = norm(value)
    if text in {"1", "true", "yes", "y"}:
        return True
    if text in {"0", "false", "no", "n"}:
        return False
    return None


def finite_number(value: Any) -> bool:
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare a research-only pilot dataset from supplied CSV files.")
    parser.add_argument("--events", required=True, type=Path, help="Authorized event inventory CSV")
    parser.add_argument("--zones", required=True, type=Path, help="Configured pilot zone CSV")
    parser.add_argument("--rainfall", required=True, type=Path, help="Precomputed rainfall/soil feature CSV")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--pilot-area", default=PILOT_AREA, help="Exactly one selected district or corridor")
    parser.add_argument("--match-threshold-km", type=float, default=10.0)
    parser.add_argument("--feature-lookback-hours", type=float, default=72.0)
    args = parser.parse_args()

    if norm(args.pilot_area) != norm(PILOT_AREA):
        raise SystemExit(f"This pilot script is scoped to {PILOT_AREA}; received '{args.pilot_area}'.")
    if args.match_threshold_km <= 0 or args.feature_lookback_hours <= 0:
        raise SystemExit("Distance threshold and feature lookback must be positive.")

    events = pd.read_csv(args.events, dtype=str)
    zones = pd.read_csv(args.zones, dtype=str)
    rainfall = pd.read_csv(args.rainfall, dtype=str)
    require_columns(events, EVENT_COLUMNS, "events CSV")
    require_columns(zones, ZONE_COLUMNS, "zones CSV")
    require_columns(rainfall, RAINFALL_COLUMNS, "rainfall CSV")

    summary: dict[str, Any] = {
        "pilot_area": PILOT_AREA,
        "inputs": {"events": str(args.events), "zones": str(args.zones), "rainfall": str(args.rainfall)},
        "input_records": {"events": len(events), "zones": len(zones), "rainfall": len(rainfall)},
        "accepted_events": 0,
        "rejected_events": 0,
        "positive_count": 0,
        "negative_count": 0,
        "missing_feature_count": 0,
        "invalid_coordinate_count": 0,
        "duplicate_count": 0,
        "unmatched_event_count": 0,
        "assumptions": [
            "An explicit no_landslide_observed=true rainfall window is treated as a negative label only when it has no accepted event in the following 24 hours.",
            "A positive feature row is the latest supplied feature timestamp at or before the event, within the configured lookback.",
            "Nearest-event matching uses haversine distance and the configured threshold.",
        ],
        "limitations": [
            "This is a research pilot for one district, not a regional or operational model.",
            "Event inventory completeness and negative-window confirmation are the responsibility of the data provider.",
            "No post-event feature is permitted by this script, but source timestamps must still be audited by the researcher.",
        ],
    }

    zone_rows: list[dict[str, Any]] = []
    zones = zones[zones["district"].map(is_pilot_district)]
    for _, row in zones.iterrows():
        if not valid_coordinate(row["latitude"], row["longitude"]):
            summary["invalid_coordinate_count"] += 1
            continue
        numeric_fields = ["slope_degrees", "elevation_m", "distance_to_road_m", "distance_to_river_m", "historical_landslide_density"]
        if any(not finite_number(row[field]) for field in numeric_fields):
            raise ValueError(f"Zone {row['zone_id']} has missing/non-numeric terrain fields.")
        zone_rows.append(row.to_dict())
    if not zone_rows:
        raise ValueError("No valid East Sikkim zones were supplied.")
    zones_by_id = {row["zone_id"]: row for row in zone_rows}

    event_rows: list[dict[str, Any]] = []
    seen_event_ids: set[str] = set()
    for _, row in events.iterrows():
        if not is_pilot_district(row["district"]) or "landslide" not in norm(row["event_type"]):
            summary["rejected_events"] += 1
            continue
        event_id = str(row["event_id"]).strip()
        event_time = pd.to_datetime(row["event_time"], errors="coerce", utc=True)
        if not event_id or event_id in seen_event_ids or pd.isna(event_time):
            summary["duplicate_count"] += int(event_id in seen_event_ids)
            summary["rejected_events"] += 1
            continue
        if not valid_coordinate(row["latitude"], row["longitude"]):
            summary["invalid_coordinate_count"] += 1
            summary["rejected_events"] += 1
            continue
        seen_event_ids.add(event_id)
        nearest_id, nearest_distance = min(
            ((zone_id, distance_km(float(zone["latitude"]), float(zone["longitude"]), float(row["latitude"]), float(row["longitude"]))) for zone_id, zone in zones_by_id.items()),
            key=lambda item: item[1],
        )
        if nearest_distance > args.match_threshold_km:
            summary["unmatched_event_count"] += 1
            summary["rejected_events"] += 1
            continue
        event_rows.append({"event_id": event_id, "event_time": event_time, "zone_id": nearest_id, "source": row["source"], "reliability": row["reliability"]})
    summary["accepted_events"] = len(event_rows)

    rainfall["parsed_time"] = pd.to_datetime(rainfall["timestamp"], errors="coerce", utc=True)
    rainfall = rainfall[rainfall["zone_id"].isin(zones_by_id)]
    rainfall = rainfall[rainfall["parsed_time"].notna()].copy()
    for field in ["rainfall_24h_mm", "rainfall_72h_mm", "soil_moisture_percent"]:
        rainfall[field] = pd.to_numeric(rainfall[field], errors="coerce")
    rainfall = rainfall.dropna(subset=["rainfall_24h_mm", "rainfall_72h_mm", "soil_moisture_percent"])

    output_rows: list[dict[str, Any]] = []
    used_feature_keys: set[tuple[str, str]] = set()
    for event in event_rows:
        candidates = rainfall[(rainfall["zone_id"] == event["zone_id"]) & (rainfall["parsed_time"] <= event["event_time"]) & (rainfall["parsed_time"] >= event["event_time"] - pd.Timedelta(hours=args.feature_lookback_hours))]
        if candidates.empty:
            summary["missing_feature_count"] += 1
            continue
        feature = candidates.sort_values("parsed_time").iloc[-1]
        zone = zones_by_id[event["zone_id"]]
        key = (event["zone_id"], str(feature["parsed_time"]))
        used_feature_keys.add(key)
        output_rows.append(make_output_row(zone, feature, event["event_time"], 1, event["event_id"], f"EVENT_INVENTORY:{event['source']}:{event['reliability']}", "USER_RAINFALL_FEATURES;USER_ZONE_FILE", "Positive event match; feature timestamp precedes event."))

    event_times = [event["event_time"] for event in event_rows]
    if event_times:
        start_time, end_time = min(event_times), max(event_times)
        for _, feature in rainfall.iterrows():
            if not parse_bool(feature["no_landslide_observed"]):
                continue
            timestamp = feature["parsed_time"]
            if timestamp < start_time or timestamp > end_time:
                continue
            zone_id = feature["zone_id"]
            has_next_day_event = any(event["zone_id"] == zone_id and pd.Timedelta(0) <= event["event_time"] - timestamp <= pd.Timedelta(hours=24) for event in event_rows)
            key = (zone_id, str(timestamp))
            if has_next_day_event or key in used_feature_keys:
                continue
            zone = zones_by_id[zone_id]
            output_rows.append(make_output_row(zone, feature, timestamp, 0, "", "EXPLICIT_NO_LANDSLIDE_OBSERVED_WINDOW", "USER_RAINFALL_FEATURES;USER_ZONE_FILE", "Negative window explicitly marked by data provider; no accepted event in next 24 hours."))
            used_feature_keys.add(key)

    output = pd.DataFrame(output_rows, columns=OUTPUT_COLUMNS)
    output = output.drop_duplicates(subset=["zone_id", "timestamp", "landslide_occurred"], keep="first")
    summary["positive_count"] = int((output["landslide_occurred"] == 1).sum()) if not output.empty else 0
    summary["negative_count"] = int((output["landslide_occurred"] == 0).sum()) if not output.empty else 0
    summary["output_records"] = len(output)
    summary["date_range"] = {"start": output["timestamp"].min() if not output.empty else None, "end": output["timestamp"].max() if not output.empty else None}

    args.output.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(args.output, index=False)
    summary_path = args.output.with_name(f"{args.output.stem}_summary.json")
    summary_path.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    summary_path.with_suffix(".md").write_text(render_summary(summary), encoding="utf-8")
    print(json.dumps(summary, indent=2, default=str))
    return 0


def make_output_row(zone: dict[str, Any], feature: pd.Series, timestamp: Any, label: int, event_id: str, label_source: str, feature_source: str, notes: str) -> dict[str, Any]:
    return {
        "zone_id": zone["zone_id"], "timestamp": pd.Timestamp(timestamp).isoformat(), "latitude": zone["latitude"], "longitude": zone["longitude"],
        "district": zone["district"], "state": zone["state"], "rainfall_24h_mm": feature["rainfall_24h_mm"], "rainfall_72h_mm": feature["rainfall_72h_mm"],
        "soil_moisture_percent": feature["soil_moisture_percent"], "slope_degrees": zone["slope_degrees"], "elevation_m": zone["elevation_m"],
        "distance_to_road_m": zone["distance_to_road_m"], "distance_to_river_m": zone["distance_to_river_m"], "historical_landslide_density": zone["historical_landslide_density"],
        "landslide_occurred": label, "event_id": event_id, "label_source": label_source, "feature_source": feature_source, "data_quality_notes": notes,
    }


def render_summary(summary: dict[str, Any]) -> str:
    lines = [f"# Pilot preparation summary: {summary['pilot_area']}", "", "This is a research-only artifact. It is not operational or suitable for warnings.", "", "## Counts"]
    for key in ["input_records", "accepted_events", "rejected_events", "positive_count", "negative_count", "missing_feature_count", "invalid_coordinate_count", "duplicate_count", "unmatched_event_count", "output_records"]:
        lines.append(f"- **{key}:** {summary.get(key)}")
    lines.extend(["", "## Assumptions"] + [f"- {item}" for item in summary["assumptions"]] + ["", "## Limitations"] + [f"- {item}" for item in summary["limitations"]])
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    raise SystemExit(main())
