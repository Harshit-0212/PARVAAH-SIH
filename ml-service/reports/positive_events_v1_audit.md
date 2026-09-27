# Audit Report: Cleaned Positive Events Dataset (`positive_events_v1`)

> **DATASET STATUS:** `POSITIVE_ONLY_EVENT_INVENTORY`  
> **TRAINING READINESS:** 🛑 **CANNOT TRAIN BINARY CLASSIFIER YET**  
> **DATE GENERATED:** 2026-09-26  
> **SOURCE FILE:** `ml-service/data/private/landslide_training_data.csv` (Raw event inventory)  
> **DERIVED OUTPUT:** `ml-service/data/processed/positive_events_v1.csv`  

---

## 1. Overview & Data Hygiene
- **Total Input Rows:** 562
- **Footer / Metadata Rows Dropped:** 1 (Row 562 contained trailing dataset provenance annotations and null values).
- **Clean Event Rows Retained:** **561**
- **Original Raw File:** Preserved untouched in `ml-service/data/private/` with zero modifications.
- **Privacy & Security:** Both the raw private CSV and the processed positive events dataset are strictly ignored by `.gitignore` and excluded from GitHub.

---

## 2. Columns Excluded During Cleaning

### A. Post-Event Data Leakage Columns
The following columns represent post-event response outcomes, casualty figures, or post-hoc disaster assessments. Using them as model prediction features would cause severe data leakage:
- `fatalities` (Dropped)
- `injuries` (Dropped)
- `size` (Dropped)
- `data_status` (Dropped)

### B. Provenance & Administrative Columns
Metadata describing original external database sources were stripped to maintain a standardized analytical schema:
- `source_event_data` (Dropped)
- `source_rainfall_soil_moisture` (Dropped)
- `source_elevation_slope` (Dropped)
- `source_land_cover` (Dropped)
- `source_historical_density` (Dropped)

### C. Unusable / Empty Columns
- `land_cover`: 100% null (562 missing values); dropped.

---

## 3. Retained Column Schema (17 Columns)

| Column Name | Type | Description |
|---|---|---|
| `event_id` | `str` | Normalized PARVAAH incident identifier |
| `original_event_id` | `str` | Source inventory identifier |
| `date` | `str` | Date of confirmed landslide event |
| `state` | `str` | State location (e.g., Sikkim, Assam, Meghalaya) |
| `district` | `str` | District name |
| `latitude` | `float64` | Geographic coordinate |
| `longitude` | `float64` | Geographic coordinate |
| `location_description` | `str` | Textual description of site/road |
| `trigger` | `str` | Natural trigger (e.g., continuous downpour, monsoon rain) |
| `rainfall_24h_mm` | `float64` | Accumulated rainfall over past 24 hours (mm) |
| `rainfall_48h_mm` | `float64` | Accumulated rainfall over past 48 hours (mm) |
| `rainfall_7d_mm` | `float64` | Accumulated rainfall over past 7 days (mm) |
| `soil_moisture_percent` | `float64` | Soil moisture saturation level (%) |
| `slope_degrees` | `float64` | Terrain slope angle (0–90°) |
| `elevation_m` | `float64` | Digital Elevation Model altitude (m) |
| `historical_landslide_density` | `float64` | Historical density count |
| `landslide_occurred` | `int` | **Target label: `1` for all 561 rows** |

---

## 4. Critical Data & Feature Observations

### 1. Positive-Only Distribution
- **Target Distribution:** `1.0` = 561 (100%), `0.0` = 0 (0%).
- **Statement:** **Positive-only dataset; cannot train binary classifier yet.**  
  Supervised machine learning algorithms (XGBoost, Random Forest, Logistic Regression) require both positive (`1`) and negative (`0`) examples to establish class decision boundaries and compute probability distributions.

### 2. Historical Density Unit Notice
- Values in `historical_landslide_density` range from **`0.0` to `83.0`** (mean `24.31`).
- This column represents **raw historical event density / counts**, not a normalized `0–1` score.
- When combining with negative samples, this feature must either be mapped to a documented unit scale or normalized using an explicit min-max/quantile transformation rather than being silently clamped.

### 3. Missing Core Prediction Features
- `forecast_rainfall_24h_mm`: Not present in raw historical event records.
- `verified_report_count`: Not present in raw historical event records.
- To use the 6-feature PARVAAH runtime inference schema, either:
  1. Forecast rainfall must be modeled from weather APIs or historical forecast archives.
  2. The inference engine supports historical-event training profiles where rainfall accumulation substitutes for forecast intervals.
