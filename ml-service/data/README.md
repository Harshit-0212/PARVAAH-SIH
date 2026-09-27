# PARVAAH ML-Service Data Directory Guide

This directory houses training, evaluation, and test datasets for the PARVAAH Landslide Risk ML pipeline.

## ⚠️ Privacy & Security Protocol
- **Never commit private Excel spreadsheets (`.xlsx`, `.xls`, `.xlsm`) to GitHub.**
- All raw user spreadsheets, private records, and intermediate derived data are ignored by `.gitignore`:
  - `ml-service/data/private/`
  - `ml-service/data/raw/`
  - `ml-service/data/quarantine/`
  - `ml-service/data/processed/*private*`
  - `ml-service/models/*excel*`

## How to Place and Process Local Excel Datasets

### 1. Place File Locally
Copy your training spreadsheet into the private folder:
```text
ml-service/data/private/input_training_data.xlsx
```

### 2. Audit the Dataset
Run safe dataset inspection without printing private records:
```bash
python ml-service/training/inspect_excel_dataset.py ml-service/data/private/input_training_data.xlsx
```
This generates:
- `ml-service/reports/excel_dataset_audit.json`
- `ml-service/reports/excel_dataset_audit.md`

### 3. Clean and Derive Training Data
Extract and validate the 6 core features:
```bash
python ml-service/training/import_excel_dataset.py ml-service/data/private/input_training_data.xlsx
```
- Clean rows go to: `ml-service/data/processed/landslide_training_from_excel_v1.csv`
- Flagged rows go to: `ml-service/data/quarantine/excel_flagged_rows_v1.csv`
- Mapping report: `ml-service/reports/excel_column_mapping.json`

### 4. Train Models
Compare Logistic Regression, Random Forest, and XGBoost:
```bash
python ml-service/training/train_from_excel.py
```
This produces:
- `ml-service/models/xgboost_excel_pilot_v1.json`
- `ml-service/models/xgboost_excel_pilot_v1_metadata.joblib`
- `ml-service/models/xgboost_excel_pilot_v1_metrics.json`
- `ml-service/models/xgboost_excel_pilot_v1_model_card.md`

## Demo Sample Data for GitHub
The sample directory `ml-service/data/sample/` contains only tiny, anonymized synthetic data for CI/CD and tests.
