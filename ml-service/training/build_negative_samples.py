"""
Build robust negative (non-landslide) samples for the PARVAAH dataset.

Resilient negative generation with comprehensive SSL/timeout fallbacks:
1. Load positive events from:
   ml-service/data/private/landslide_training_data.csv
2. Precompute regional mean elevation and mean slope from positive events at script start.
3. Wrap all network calls in resilient try/except blocks:
   - Elevation/Slope: Calls Open-Meteo with short timeout. On any SSL/TLS error, timeout,
     or HTTP error, seamlessly uses positive dataset mean elevation and mean slope.
   - Weather/Soil moisture: Retries up to 3 times. If an individual coordinate/date fails,
     regenerates with another candidate location rather than aborting.
4. Generates candidate locations within regional domain, screened with --buffer-km (default: 5.0 km).
5. Progress logging:
   - Prints status update every 50 completed negatives ("Completed 50/561 negatives...").
   - At completion, prints total generated, rejected by buffer, successfully written, and API failure counts.
6. Target count: Generates ~561 valid negative samples.
7. Outputs (unchanged):
   - ml-service/data/processed/negative_samples_v1.csv
   - ml-service/data/processed/training_with_negatives_v1.csv
   - ml-service/reports/negative_samples_v1_audit.md
"""

import argparse
import io
import math
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Force UTF-8 on Windows
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
import requests

OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
OPEN_METEO_ELEVATION = "https://api.open-meteo.com/v1/elevation"

DEFAULT_BUFFER_KM = 5.0
REQUEST_SLEEP = 0.15
MAX_API_RETRIES = 3


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def is_candidate_clear_of_positives(cand_lat, cand_lon, pos_coords, buffer_km):
    lat_delta = buffer_km / 111.0
    lon_delta = buffer_km / max(1.0, 111.0 * math.cos(math.radians(cand_lat)))

    nearby = pos_coords[
        (pos_coords["latitude"].between(cand_lat - lat_delta, cand_lat + lat_delta)) &
        (pos_coords["longitude"].between(cand_lon - lon_delta, cand_lon + lon_delta))
    ]

    for _, row in nearby.iterrows():
        if haversine_km(cand_lat, cand_lon, row["latitude"], row["longitude"]) < buffer_km:
            return False
    return True


def generate_candidate_locations(positives, buffer_km=DEFAULT_BUFFER_KM, target_count=561):
    rng = np.random.default_rng(42)
    pos_coords = positives[["latitude", "longitude"]].copy()

    lat_min, lat_max = pos_coords["latitude"].min() - 0.2, pos_coords["latitude"].max() + 0.2
    lon_min, lon_max = pos_coords["longitude"].min() - 0.2, pos_coords["longitude"].max() + 0.2

    accepted_candidates = []
    generated_count = 0
    rejected_count = 0

    print(f"Generating candidate negative points (screening buffer >= {buffer_km} km)...")

    pos_records = positives.to_dict(orient="records")
    max_passes = 10

    for current_pass in range(max_passes):
        rng.shuffle(pos_records)
        for seed in pos_records:
            if len(accepted_candidates) >= target_count:
                break

            generated_count += 1
            angle = rng.uniform(0, 2 * math.pi)
            dist_deg = rng.uniform(0.08, 0.45)
            dlat = dist_deg * math.sin(angle)
            dlon = dist_deg * math.cos(angle)

            cand_lat = round(seed["latitude"] + dlat, 5)
            cand_lon = round(seed["longitude"] + dlon, 5)

            if not (lat_min <= cand_lat <= lat_max and lon_min <= cand_lon <= lon_max):
                rejected_count += 1
                continue

            if is_candidate_clear_of_positives(cand_lat, cand_lon, pos_coords, buffer_km):
                # Avoid near-duplicates within accepted set
                is_duplicate = False
                for existing in accepted_candidates[-30:]:
                    if haversine_km(cand_lat, cand_lon, existing["latitude"], existing["longitude"]) < 3.0:
                        is_duplicate = True
                        break

                if not is_duplicate:
                    accepted_candidates.append({
                        "latitude": cand_lat,
                        "longitude": cand_lon,
                        "state": seed["state"],
                        "seed_district": seed.get("district", ""),
                        "candidate_name": f"Regional non-event site ({seed['state']})",
                    })
                else:
                    rejected_count += 1
            else:
                rejected_count += 1

        if len(accepted_candidates) >= target_count:
            break

    # Uniform random spatial fill fallback if quota not reached
    while len(accepted_candidates) < target_count and generated_count < 20000:
        generated_count += 1
        cand_lat = round(rng.uniform(lat_min, lat_max), 5)
        cand_lon = round(rng.uniform(lon_min, lon_max), 5)

        if is_candidate_clear_of_positives(cand_lat, cand_lon, pos_coords, buffer_km):
            accepted_candidates.append({
                "latitude": cand_lat,
                "longitude": cand_lon,
                "state": rng.choice(positives["state"].dropna().unique()),
                "seed_district": "",
                "candidate_name": "Regional non-event site (grid fill)",
            })
        else:
            rejected_count += 1

    print(f"Candidates generated: {generated_count:,} | Rejected by buffer: {rejected_count:,} | Kept: {len(accepted_candidates):,}")
    return pd.DataFrame(accepted_candidates[:target_count]), generated_count, rejected_count


def sample_dates_from_positives(positives, negatives_df):
    rng = np.random.default_rng(42)
    out = negatives_df.copy()

    date_pool = {}
    for state, group in positives.groupby("state"):
        dates = pd.to_datetime(group["date"], errors="coerce").dropna()
        if not dates.empty:
            date_pool[state] = dates.tolist()

    all_dates = pd.to_datetime(positives["date"], errors="coerce").dropna().tolist()

    sampled = []
    for _, row in out.iterrows():
        pool = date_pool.get(row["state"], all_dates)
        if pool:
            sampled.append(pd.Timestamp(rng.choice(pool)))
        else:
            sampled.append(pd.Timestamp("2020-07-15"))

    out["date"] = sampled
    return out


def fetch_open_meteo_weather_with_retries(lat, lon, date):
    """
    Fetch 24h, 48h, 7d rainfall and soil moisture from Open-Meteo ERA5 archive.
    Returns (r24, r48, r7, soil_pct) or None if all retries fail.
    """
    start = (pd.Timestamp(date) - pd.Timedelta(days=6)).strftime("%Y-%m-%d")
    end = pd.Timestamp(date).strftime("%Y-%m-%d")

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start,
        "end_date": end,
        "hourly": "precipitation,soil_moisture_0_to_7cm",
        "timezone": "auto",
        "models": "era5",
    }

    for attempt in range(MAX_API_RETRIES):
        try:
            r = requests.get(OPEN_METEO_ARCHIVE, params=params, timeout=12)
            if r.status_code == 200:
                data = r.json()
                times = pd.to_datetime(data["hourly"]["time"])
                precip = pd.Series(pd.to_numeric(data["hourly"]["precipitation"], errors="coerce"), index=times)
                soil = pd.Series(pd.to_numeric(data["hourly"]["soil_moisture_0_to_7cm"], errors="coerce"), index=times)

                target_day = pd.Timestamp(date).date()
                day_mask = precip.index.date == target_day
                last_48 = precip.index >= (pd.Timestamp(date) - pd.Timedelta(hours=47))
                last_7d = precip.index >= (pd.Timestamp(date) - pd.Timedelta(days=6))

                r24 = float(precip.loc[day_mask].sum())
                r48 = float(precip.loc[last_48].sum())
                r7d = float(precip.loc[last_7d].sum())

                soil_day = soil.loc[soil.index.date == target_day].dropna()
                soil_pct = float(soil_day.iloc[-1] * 100.0) if len(soil_day) else 42.0

                return r24, r48, r7d, round(soil_pct, 2)
            elif r.status_code == 429:
                time.sleep(1.5)
        except Exception:
            time.sleep(0.5)

    return None


def fetch_open_meteo_elevation_and_slope_with_fallback(lat, lon, fallback_elev, fallback_slope, failure_tracker):
    """
    Fetch center elevation and 4-neighbour slope from Open-Meteo elevation API.
    On any SSL, network, or HTTP exception, smoothly falls back to positive dataset mean values.
    """
    dlat, dlon = 0.001, 0.001
    points = [
        (lat, lon),
        (lat + dlat, lon),
        (lat - dlat, lon),
        (lat, lon + dlon),
        (lat, lon - dlon),
    ]
    lats = ",".join(str(p[0]) for p in points)
    lons = ",".join(str(p[1]) for p in points)

    try:
        r = requests.get(OPEN_METEO_ELEVATION, params={"latitude": lats, "longitude": lons}, timeout=6)
        if r.status_code == 200:
            elevations = np.asarray(r.json()["elevation"], dtype=float)
            center_elev = float(elevations[0])
            north, south, east, west = elevations[1], elevations[2], elevations[3], elevations[4]

            dy = 2 * dlat * 111320.0
            dx = 2 * dlon * 111320.0 * math.cos(math.radians(lat))
            dz_dy = (north - south) / max(1.0, dy)
            dz_dx = (east - west) / max(1.0, dx)

            slope_rad = math.atan(math.sqrt(dz_dx ** 2 + dz_dy ** 2))
            slope_deg = round(math.degrees(slope_rad), 2)
            return center_elev, slope_deg
    except Exception:
        pass

    failure_tracker["elevation_slope_failures"] += 1
    if failure_tracker["elevation_slope_failures"] == 1 or failure_tracker["elevation_slope_failures"] % 100 == 0:
        print(f"  [Notice] Elevation/Slope API unreachable ({failure_tracker['elevation_slope_failures']} times). Using positive dataset terrain baseline (elev={fallback_elev:.1f}m, slope={fallback_slope:.1f}°).")

    return fallback_elev, fallback_slope


def calculate_historical_density_from_positives(lat, lon, date, positives_df):
    """
    Count positive events within 10 km strictly BEFORE the sample date (count per 100 km²).
    Prevents temporal future leakage.
    """
    if positives_df.empty:
        return 0.0

    lat_delta = 10 / 111.0
    lon_delta = 10 / max(1.0, 111.0 * math.cos(math.radians(lat)))

    nearby = positives_df[
        (positives_df["latitude"].between(lat - lat_delta, lat + lat_delta)) &
        (positives_df["longitude"].between(lon - lon_delta, lon + lon_delta))
    ].copy()

    nearby["date_dt"] = pd.to_datetime(nearby["date"], errors="coerce")
    cutoff = pd.Timestamp(date)
    prior_events = nearby[nearby["date_dt"] < cutoff]

    count = 0
    for _, e in prior_events.iterrows():
        if haversine_km(lat, lon, e["latitude"], e["longitude"]) <= 10.0:
            count += 1

    area = math.pi * 10 * 10
    return round((count / area) * 100.0, 2)


def generate_audit_report(
    report_path: Path,
    positives: pd.DataFrame,
    negatives: pd.DataFrame,
    final_df: pd.DataFrame,
    buffer_km: float,
    generated_count: int,
    rejected_count: int,
    api_failures: dict,
) -> None:
    features = [
        "rainfall_24h_mm",
        "rainfall_48h_mm",
        "rainfall_7d_mm",
        "soil_moisture_percent",
        "slope_degrees",
        "elevation_m",
        "historical_landslide_density",
    ]

    lines = [
        "# Audit Report: Negative Sample Generation (`negative_samples_v1`)",
        "",
        "> **METHODOLOGY & RESEARCH NOTICE:**  ",
        f"> Negatives are pseudo-absences generated within the spatial-temporal domain of the positive events, screened with a **{buffer_km} km buffer**. Labels are noisy and for demo/research use only.",
        "",
        "## 1. Class Counts & Screening Summary",
        f"- **Positive Events (Confirmed landslides, `y = 1`):** {len(positives)}",
        f"- **Negative Samples Generated (Pseudo-absences, `y = 0`):** {len(negatives)}",
        f"- **Combined Dataset Total (`training_with_negatives_v1`):** {len(final_df)}",
        f"- **Distance Exclusion Buffer from Positives:** {buffer_km} km",
        f"- **Candidate Locations Screened:** {generated_count:,}",
        f"- **Candidates Rejected Within Buffer:** {rejected_count:,}",
        f"- **Elevation/Slope API Fallback Invocations:** {api_failures.get('elevation_slope_failures', 0):,}",
        f"- **Weather Candidates Skipped & Regenerated:** {api_failures.get('weather_retried_and_skipped', 0):,}",
        f"- **Generated At:** {datetime.now(timezone.utc).isoformat()}",
        "",
        "## 2. Feature Distribution Summary (Negatives vs Positives)",
        "| Feature | Positives (Min / Mean / Max) | Negatives (Min / Mean / Max) | Nulls (Negatives) |",
        "|---|---|---|---|",
    ]

    for f in features:
        if f in positives.columns and pd.api.types.is_numeric_dtype(positives[f]):
            p_s = positives[f].dropna()
            p_str = f"{p_s.min():.2f} / {p_s.mean():.2f} / {p_s.max():.2f}" if not p_s.empty else "N/A"
        else:
            p_str = "N/A"

        if f in negatives.columns and pd.api.types.is_numeric_dtype(negatives[f]):
            n_s = negatives[f].dropna()
            n_nulls = int(negatives[f].isna().sum())
            n_str = f"{n_s.min():.2f} / {n_s.mean():.2f} / {n_s.max():.2f}" if not n_s.empty else "N/A"
        else:
            n_str = "N/A"
            n_nulls = 0

        lines.append(f"| `{f}` | {p_str} | {n_str} | {n_nulls} |")

    lines.extend([
        "",
        "## 3. Methodology & Safeguards",
        f"- **Spatial Domain:** Derived from coordinates bounding box (lat {positives['latitude'].min():.2f}–{positives['latitude'].max():.2f}, lon {positives['longitude'].min():.2f}–{positives['longitude'].max():.2f}).",
        f"- **Haversine Buffer:** Minimum {buffer_km} km clearance from every confirmed landslide coordinate.",
        "- **Temporal Distribution:** Sampled directly from positive event dates for identical seasonal distribution.",
        "- **Weather & Soil Moisture:** Open-Meteo ERA5 Reanalysis API with automated retries and candidate regeneration.",
        "- **Elevation & Slope:** Open-Meteo Elevation API with robust fallback to positive dataset terrain baseline on connection/SSL timeouts.",
        "- **Temporal Leakage Control:** Historical event density calculated strictly using events prior to sample date.",
        "",
        "## 4. Output Artifacts",
        "- Negative samples: `ml-service/data/processed/negative_samples_v1.csv`",
        "- Combined dataset: `ml-service/data/processed/training_with_negatives_v1.csv`",
        "",
    ])

    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    root_dir = Path(__file__).resolve().parent.parent

    default_input = root_dir / "data" / "private" / "landslide_training_data.csv"
    default_neg_out = root_dir / "data" / "processed" / "negative_samples_v1.csv"
    default_combined_out = root_dir / "data" / "processed" / "training_with_negatives_v1.csv"
    default_report = root_dir / "reports" / "negative_samples_v1_audit.md"

    parser = argparse.ArgumentParser(description="Generate robust negative landslide samples for PARVAAH.")
    parser.add_argument("--input", default=str(default_input), help="Path to input positive CSV")
    parser.add_argument("--buffer-km", type=float, default=DEFAULT_BUFFER_KM, help="Distance exclusion buffer from positive events in km (default: 5.0)")
    parser.add_argument("--target-count", type=int, default=None, help="Target negative samples count (default: matches positive count)")
    parser.add_argument("--negative-output", default=str(default_neg_out), help="Path for negative samples CSV")
    parser.add_argument("--combined-output", default=str(default_combined_out), help="Path for combined CSV")
    parser.add_argument("--report", default=str(default_report), help="Path for audit report markdown")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    neg_out_path = Path(args.negative_output).resolve()
    combined_out_path = Path(args.combined_output).resolve()
    report_path = Path(args.report).resolve()
    buffer_km = float(args.buffer_km)

    if not input_path.exists():
        raise FileNotFoundError(f"Input dataset not found at: {input_path}")

    neg_out_path.parent.mkdir(parents=True, exist_ok=True)
    combined_out_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(input_path)
    positives = df[df["landslide_occurred"] == 1].copy()
    positives = positives.dropna(subset=["latitude", "longitude", "date"])

    if positives.empty:
        raise ValueError("No valid positive events found in input CSV.")

    target_count = args.target_count or len(positives)

    # 1. Compute terrain fallbacks once at script start from positive events
    fallback_elev = float(round(positives["elevation_m"].dropna().mean(), 1)) if "elevation_m" in positives and not positives["elevation_m"].dropna().empty else 973.9
    fallback_slope = float(round(positives["slope_degrees"].dropna().mean(), 1)) if "slope_degrees" in positives and not positives["slope_degrees"].dropna().empty else 14.1

    print(f"\n=======================================================")
    print(f"  PARVAAH ROBUST NEGATIVE SAMPLES GENERATION")
    print(f"=======================================================")
    print(f"  Positive events:        {len(positives)}")
    print(f"  Target negatives:       {target_count}")
    print(f"  Buffer clearance:       {buffer_km} km")
    print(f"  Fallback baseline:      Elev={fallback_elev} m, Slope={fallback_slope}°")

    # Generate initial pool of candidate locations
    candidates_df, generated_cnt, rejected_cnt = generate_candidate_locations(
        positives, buffer_km=buffer_km, target_count=int(target_count * 1.3)
    )
    candidates_with_dates = sample_dates_from_positives(positives, candidates_df)

    negative_rows = []
    api_failures = {
        "elevation_slope_failures": 0,
        "weather_retried_and_skipped": 0,
    }

    print("\nRetrieving environmental features (weather & terrain)...")
    cand_index = 0
    total_candidates_available = len(candidates_with_dates)

    while len(negative_rows) < target_count and cand_index < total_candidates_available:
        row = candidates_with_dates.iloc[cand_index]
        cand_index += 1

        lat = row["latitude"]
        lon = row["longitude"]
        date = row["date"]
        state = row["state"]

        # Weather query with retries
        weather = fetch_open_meteo_weather_with_retries(lat, lon, date)
        if weather is None:
            # Skip this candidate and continue to next so negatives have complete features
            api_failures["weather_retried_and_skipped"] += 1
            continue

        r24, r48, r7, soil = weather

        # Elevation & Slope query with smooth fallback
        elev, slope = fetch_open_meteo_elevation_and_slope_with_fallback(
            lat, lon, fallback_elev, fallback_slope, api_failures
        )

        # Historical density (strictly pre-sample date)
        density = calculate_historical_density_from_positives(lat, lon, date, positives)

        negative_rows.append({
            "event_id": f"NEG_{len(negative_rows) + 1:06d}",
            "original_event_id": "",
            "date": date.strftime("%Y-%m-%d"),
            "state": state,
            "district": row.get("seed_district", ""),
            "latitude": lat,
            "longitude": lon,
            "location_description": row["candidate_name"],
            "trigger": "",
            "size": "",
            "fatalities": 0,
            "injuries": 0,
            "rainfall_24h_mm": r24,
            "rainfall_48h_mm": r48,
            "rainfall_7d_mm": r7,
            "elevation_m": elev,
            "slope_degrees": slope,
            "soil_moisture_percent": soil,
            "land_cover": np.nan,
            "historical_landslide_density": density,
            "landslide_occurred": 0,
            "data_status": "REAL_ABSENCE_SAMPLE_POSITIVE_SCREENED",
            "source_event_data": "LOCAL_POSITIVE_INVENTORY",
            "source_rainfall_soil_moisture": OPEN_METEO_ARCHIVE,
            "source_elevation_slope": OPEN_METEO_ELEVATION,
            "source_land_cover": "",
            "source_historical_density": "LOCAL_POSITIVE_INVENTORY (pre-date events only)",
            "negative_sampling_note": (
                f"Generated within regional domain; screened outside {buffer_km} km "
                f"buffer from all positive events; absence-of-record sample."
            ),
        })

        # Progress reporting every 50 negatives
        if len(negative_rows) % 50 == 0 or len(negative_rows) == target_count:
            print(f"  Completed {len(negative_rows)}/{target_count} negatives...")

        time.sleep(REQUEST_SLEEP)

    neg_df = pd.DataFrame(negative_rows)
    neg_df.to_csv(neg_out_path, index=False)

    pos_df = positives.copy()
    pos_df["data_status"] = pos_df["data_status"].fillna("REAL_VERIFIED")
    pos_df["negative_sampling_note"] = ""

    common_cols = sorted(set(pos_df.columns).intersection(neg_df.columns))
    combined_df = pd.concat([pos_df[common_cols], neg_df[common_cols]], ignore_index=True)
    combined_df.to_csv(combined_out_path, index=False)

    generate_audit_report(
        report_path, pos_df, neg_df, combined_df, buffer_km, generated_cnt, rejected_cnt, api_failures
    )

    print("\n=======================================================")
    print(f"  GENERATION SUMMARY")
    print(f"=======================================================")
    print(f"  Candidates generated:               {generated_cnt:,}")
    print(f"  Candidates rejected by {buffer_km}km buffer: {rejected_cnt:,}")
    print(f"  Negatives successfully written:     {len(neg_df):,}")
    print(f"  Elevation/Slope API fallbacks used: {api_failures['elevation_slope_failures']:,}")
    print(f"  Weather failed & skipped:           {api_failures['weather_retried_and_skipped']:,}")
    print(f"  Combined dataset total:             {len(combined_df):,}")
    print(f"\n  Output Artifacts:")
    print(f"   -> {neg_out_path}")
    print(f"   -> {combined_out_path}")
    print(f"   -> {report_path}")
    print(f"=======================================================\n")


if __name__ == "__main__":
    main()
