# PARVAAH Demo Landslide Classifier Evaluation Report

> **RESEARCH & DEMO DISCLAIMER:**  
> Demo/research model only. Not for operational or official use. Positives: real landslide inventory; Negatives: pseudo-absences generated within same spatial-temporal domain, 5 km buffer.

## 1. Dataset & Split Overview
- **Training Dataset Source:** `ml-service/data/processed/training_with_negatives_v1.csv`
- **Total Samples:** 1,122
- **Positive Events (`y = 1`):** 561 (50.0%)
- **Negative Samples (`y = 0`):** 561 (50.0%)
- **Train Set Size (80%):** 897 samples
- **Test Set Size (20%):** 225 samples (Stratified)
- **Evaluation Timestamp:** 2026-09-26T10:17:54.535510+00:00

## 2. Model Feature Schema (7 Features)
- `rainfall_24h_mm`
- `rainfall_48h_mm`
- `rainfall_7d_mm`
- `soil_moisture_percent`
- `slope_degrees`
- `elevation_m`
- `historical_landslide_density`

## 3. Comparative Test Set Performance
| Model | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | False Negatives (FN) | False Positives (FP) |
|---|---|---|---|---|---|---|---|
| **XGBoost (Primary Demo)** | **1.0000** | **0.9554** | **0.9772** | **0.9861** | **0.9901** | **5** | **0** |
| Random Forest | 0.9907 | 0.9554 | 0.9727 | 0.9814 | 0.9860 | 5 | 1 |
| Logistic Regression (Baseline) | 1.0000 | 0.9196 | 0.9581 | 0.9885 | 0.9921 | 9 | 0 |

## 4. XGBoost Confusion Matrix (Test Set: N = 225)
- **True Negatives (TN):** 113
- **False Positives (FP):** 0
- **False Negatives (FN):** 5
- **True Positives (TP):** 107

## 5. Artifacts Created
- Model weights: `ml-service/models/demo_xgboost_v1.json`
- Metadata: `ml-service/models/demo_xgboost_v1_metadata.joblib`
- Metrics JSON: `ml-service/models/demo_xgboost_v1_metrics.json`
- Model card: `ml-service/models/demo_xgboost_v1_model_card.md`
