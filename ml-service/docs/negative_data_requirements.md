# Negative Data Requirements for Landslide Risk Model Training

> **STATUS:** STRATEGY & SPECIFICATION DOCUMENT  
> **APPLIES TO:** PARVAAH ML-Service Classifier Training Pipeline (`training_dataset_v1.csv`)  

---

## 1. Why Negative Samples (`0`) Are Required

The current event inventory (`positive_events_v1.csv`) contains **561 confirmed landslide events (`1`)** and **zero non-events (`0`)**.

Supervised classification algorithms (such as XGBoost, Random Forest, and Logistic Regression) optimize an objective function that distinguishes positive cases from background conditions:
1. **Mathematical Impossibility of Binary Loss Optimization:**  
   Cross-entropy loss and log-loss require samples from both classes ($y_i \in \{0, 1\}$). With only positive instances, the gradient collapses, resulting in a trivial model that predicts 100% risk everywhere regardless of rainfall or slope.
2. **Probability Calibration:**  
   To produce a meaningful landslide probability (e.g., $P(\text{landslide} \mid \text{rain}, \text{slope}) = 0.72$), the classifier must learn what levels of rainfall and slope **do not** trigger slope failure.
3. **Prevention of False Alarms:**  
   Without negative observations, high rainfall in flat plains or moderate slope under dry weather cannot be distinguished from high-hazard scenarios, resulting in perpetual critical alerts.

---

## 2. What Constitutes a Valid Negative Record

A valid negative record ($y = 0$) represents a **spatio-temporally verified non-event**:
- **Location:** A known geographic point (latitude, longitude, district, state) in landslide-prone terrain or adjacent monitored corridors.
- **Timestamp:** A specific date (day, month, year) with recorded environmental metrics.
- **Condition:** No landslide, debris flow, rockfall, or slope displacement occurred at that location on that date.
- **Required Feature Parity:** The negative record must supply identical features as positive instances:
  - `rainfall_24h_mm`, `rainfall_48h_mm`, `rainfall_7d_mm`
  - `soil_moisture_percent`
  - `slope_degrees`
  - `elevation_m`
  - `historical_landslide_density` (in matching raw density units 0–83)
  - `landslide_occurred`: `0`

---

## 3. Recommended Strategies to Obtain or Generate Negatives

To avoid introducing spatial or temporal bias, negative samples should be constructed using one or more of the following rigorous domain-scientific methodologies:

### Strategy A: Spatio-Temporal Pseudo-Absences (Standard Geotechnical Methodology)
1. **Temporal Non-Event Sampling at Known Landslide Locations:**
   - Sample the **same latitude/longitude** of the 561 known landslide sites during dry days or moderate-rain monsoon days when **no landslide occurred**.
   - Pull historical IMD weather records (rainfall) and ERA5/NASA soil moisture for those non-event dates.
   - *Advantage:* Controls for slope and geology, teaching the model precisely which rainfall thresholds trigger failure.

2. **Spatial Non-Event Sampling Across Monitored Districts:**
   - Sample stable slope points (e.g., slopes between 15° and 35°) in East Sikkim, East Khasi Hills, and Dima Hasao on days of heavy rain where no incidents were recorded.
   - *Advantage:* Teaches the model that moderate slopes with adequate drainage resist sliding even under rain.

### Strategy B: Administrative Safe Reports & Monitored Road Status
- Utilize road status logs (`ROADS_OPEN`) and field officer situation reports from district emergency operation centers (DEOCs) indicating all corridors remained clear during monsoon spells.

### Strategy C: Balanced / Ratio-Controlled Sampling
- **Target Ratio:** For landslide hazard modeling in the North Eastern Region, an event-to-non-event ratio between **1:1 and 1:3** (e.g., 561 positives to ~1,120 negatives) provides balanced decision boundaries while reflecting real-world scarcity through class-weighting (`scale_pos_weight`).

---

## 4. Pipeline for Combining Positives and Negatives

Once negative records are collected or generated:

```text
 positive_events_v1.csv (561 rows, y=1)
                +
 negative_events_v1.csv (~561-1500 rows, y=0)
                │
                ▼
  [Validation & Schema Matcher]
  - Verify column alignment
  - Check range consistency (slope 0-90, moisture 0-100%)
  - Ensure historical_landslide_density units match
                │
                ▼
  ml-service/data/processed/training_dataset_v1.csv
                │
                ▼
  [Train & Evaluate Model: train_from_excel.py / train_model.py]
  - Stratified 75/25 train-test split
  - Train Logistic Regression, Random Forest, XGBoost
  - Generate Confusion Matrix, Precision, Recall, F1, ROC-AUC, PR-AUC
```

### Safety Guardrails
- **No Fabricated Negatives:** Never inject arbitrary synthetic rows into private datasets without explicit verification.
- **Provenance Logging:** Document exact source dates and coordinates of all negative points in an accompanying audit JSON.
- **Privacy:** `training_dataset_v1.csv` and `negative_events_v1.csv` must remain protected under `.gitignore`.
