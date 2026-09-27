# Audit Report: Negative Sample Generation (`negative_samples_v1`)

> **METHODOLOGY & RESEARCH NOTICE:**  
> Negatives are pseudo-absences generated within the spatial-temporal domain of the positive events, screened with a **5.0 km buffer**. Labels are noisy and for demo/research use only.

## 1. Class Counts & Screening Summary
- **Positive Events (Confirmed landslides, `y = 1`):** 561
- **Negative Samples Generated (Pseudo-absences, `y = 0`):** 561
- **Combined Dataset Total (`training_with_negatives_v1`):** 1122
- **Distance Exclusion Buffer from Positives:** 5.0 km
- **Candidate Locations Screened:** 939
- **Candidates Rejected Within Buffer:** 210
- **Elevation/Slope API Fallback Invocations:** 5
- **Weather Candidates Skipped & Regenerated:** 0
- **Generated At:** 2026-09-26T10:13:35.920500+00:00

## 2. Feature Distribution Summary (Negatives vs Positives)
| Feature | Positives (Min / Mean / Max) | Negatives (Min / Mean / Max) | Nulls (Negatives) |
|---|---|---|---|
| `rainfall_24h_mm` | 0.00 / 28.94 / 200.50 | 0.00 / 25.70 / 165.30 | 0 |
| `rainfall_48h_mm` | 0.00 / 55.58 / 281.70 | 0.00 / 68.85 / 373.60 | 0 |
| `rainfall_7d_mm` | 0.00 / 183.42 / 765.40 | 0.00 / 142.19 / 701.30 | 0 |
| `soil_moisture_percent` | 13.20 / 44.53 / 51.40 | 15.20 / 45.11 / 52.40 | 0 |
| `slope_degrees` | 0.10 / 14.14 / 41.40 | 0.00 / 15.25 / 52.68 | 0 |
| `elevation_m` | 8.00 / 973.92 / 4417.00 | 4.00 / 1013.00 / 5466.00 | 0 |
| `historical_landslide_density` | 0.00 / 24.31 / 83.00 | 0.00 / 0.14 / 4.14 | 0 |

## 3. Methodology & Safeguards
- **Spatial Domain:** Derived from coordinates bounding box (lat 22.48–29.24, lon 88.11–96.93).
- **Haversine Buffer:** Minimum 5.0 km clearance from every confirmed landslide coordinate.
- **Temporal Distribution:** Sampled directly from positive event dates for identical seasonal distribution.
- **Weather & Soil Moisture:** Open-Meteo ERA5 Reanalysis API with automated retries and candidate regeneration.
- **Elevation & Slope:** Open-Meteo Elevation API with robust fallback to positive dataset terrain baseline on connection/SSL timeouts.
- **Temporal Leakage Control:** Historical event density calculated strictly using events prior to sample date.

## 4. Output Artifacts
- Negative samples: `ml-service/data/processed/negative_samples_v1.csv`
- Combined dataset: `ml-service/data/processed/training_with_negatives_v1.csv`
