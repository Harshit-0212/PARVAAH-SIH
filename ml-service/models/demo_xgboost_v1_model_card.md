# Model Card: PARVAAH Demo XGBoost Classifier (`demo_xgboost_v1`)

> **RESEARCH & DEMO DISCLAIMER:**  
> Demo/research model only. Not for operational or official use. Positives: real landslide inventory; Negatives: pseudo-absences generated within same spatial-temporal domain, 5 km buffer.

## Model Details
- **Model Name:** PARVAAH Demo XGBoost Landslide Classifier
- **Model Version:** `demo-xgboost-v1`
- **Model Type:** Gradient Boosted Decision Trees (XGBClassifier)
- **Created Date:** 2026-09-26T10:17:54.535939+00:00
- **Input Features (7):** `rainfall_24h_mm`, `rainfall_48h_mm`, `rainfall_7d_mm`, `soil_moisture_percent`, `slope_degrees`, `elevation_m`, `historical_landslide_density`
- **Target:** `landslide_occurred` (Binary: `0` = Absence, `1` = Landslide event)

## Data & Training Details
- **Source Dataset:** `ml-service/data/processed/training_with_negatives_v1.csv`
- **Total Dataset Samples:** 1,122
- **Positives:** 561 | **Negatives:** 561
- **Train/Test Split:** 80% Train (897 samples), 20% Test (225 samples), stratified by label
- **Random Seed:** 42

## Evaluation Metrics (Test Set)
- **Precision:** 1.0000
- **Recall:** 0.9554
- **F1 Score:** 0.9772
- **ROC-AUC:** 0.9861
- **PR-AUC:** 0.9901
- **Confusion Matrix:** TN=113, FP=0, FN=5, TP=107

## Intended Use & Limitations
- **Intended Use:** Academic and college-level disaster management research, decision-support prototyping, and interactive simulation.
- **Limitations:** Negative samples are pseudo-absences derived from spatial-temporal domain sampling. Model outputs must never be used to issue mandatory evacuation orders or official safety warnings.
