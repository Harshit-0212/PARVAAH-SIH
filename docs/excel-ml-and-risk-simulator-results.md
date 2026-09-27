# PARVAAH Excel ML Ingestion & Risk Simulator Consistency Verification

## Summary of Fixes & Validations

### 1. Excel Data Ingestion & Privacy Protection
- **Privacy Enforcement:**
  - Added strict patterns to root `.gitignore` and `ml-service/.gitignore`:
    - `ml-service/data/private/`
    - `*.xlsx`, `*.xls`, `*.xlsm`
    - `ml-service/data/raw/`
    - `ml-service/data/quarantine/`
    - `ml-service/data/processed/*private*`
    - `ml-service/models/*excel*`
  - Created [`ml-service/data/README.md`](file:///d:/PARVAAH/PARVAAH/ml-service/data/README.md) documenting safe local workbook placement, auditing, hygiene, and execution procedures.
  - Created [`ml-service/data/sample/excel_training_sample.csv`](file:///d:/PARVAAH/PARVAAH/ml-service/data/sample/excel_training_sample.csv) providing safe synthetic sample data marked `DEMO_ONLY`.
- **Inspection & Provenance Tool (`ml-service/training/inspect_excel_dataset.py`):**
  - Safely reads workbook sheets without macro execution (`openpyxl` with `data_only=True`).
  - Computes file SHA-256 hash for provenance and preserves import timestamp and source notes.
  - Detects column mapping for the 6 canonical features and target `landslide_occurred`.
  - Flags missing columns, non-numeric values, out-of-range values (e.g. soil moisture > 100%, slope > 90°), and post-event leakage columns (fatalities, injuries, damage).
  - Automatically identifies historical density unit: distinguishes normalized 0–1 vs raw density/count (> 1.0).
  - Generates audit reports:
    - `ml-service/reports/excel_dataset_audit.json`
    - `ml-service/reports/excel_dataset_audit.md`
- **Import & Quarantine Tool (`ml-service/training/import_excel_dataset.py`):**
  - Never mutates the original Excel workbook.
  - Normalizes columns and outputs `ml-service/reports/excel_column_mapping.json` and `ml-service/reports/excel_import_quality_report.md`.
  - Preserves source row number.
  - Safely routes invalid, missing, single-class positive-only, or raw density mismatch rows to `ml-service/data/quarantine/excel_flagged_rows_v1.csv` without silent deletion.
  - Only outputs `ml-service/data/processed/landslide_training_from_excel_v1.csv` when clean and ready.
- **Model Training Tool (`ml-service/training/train_from_excel.py`):**
  - Trains and compares Logistic Regression baseline, Random Forest baseline, and XGBoost candidate with class imbalance handling (`scale_pos_weight`).
  - Produces complete model artifacts upon success:
    - `ml-service/models/xgboost_excel_pilot_v1.json`
    - `ml-service/models/xgboost_excel_pilot_v1_metadata.joblib`
    - `ml-service/models/xgboost_excel_pilot_v1_metrics.json`
    - `ml-service/models/xgboost_excel_pilot_v1_model_card.md`

---

### 2. Risk Simulator Logic & Contradiction Resolution
- **Shared Severity Categorization Helper:**
  - Standardized strictly across frontend, backend, and FastAPI microservice:
    - `0–24`: `LOW`
    - `25–49`: `MODERATE`
    - `50–74`: `HIGH`
    - `75–100`: `CRITICAL`
  - A score of 80 is strictly displayed as `CRITICAL`, eliminating the previous contradictory `LOW` status.
- **Truthful Model Mode & Version Display:**
  - If FastAPI succeeds with Excel pilot model:
    - `modelMode`: `EXCEL_PILOT_XGBOOST`
    - `modelVersion`: `excel-pilot-xgboost-v1`
  - If FastAPI succeeds with practice model:
    - `modelMode`: `PRACTICE_XGBOOST`
    - `modelVersion`: `practice-xgboost-v1`
  - If FastAPI is unavailable and rule-based fallback executes:
    - `modelMode`: `DEMO_RULE_BASED`
    - `modelVersion`: `prototype-rule-based-v1`
    - Transparent disclaimer and rule-derived probability clearly noted.
- **Evacuation Safety Gate Separation:**
  - Separated AI evacuation recommendation from official evacuation status:
    - **AI Recommendation:** Limited to `NO_ADVICE` (score < 50) and `PREPARE_TO_EVACUATE` (score >= 50).
    - **Official Evacuation Status:** Defaults to `NO_ADVICE`. The model/simulator **never** produces `MANDATORY_EVACUATION_ORDERED`.
    - Prominently displays: *"This is a decision-support simulation, not an official evacuation order. Research/demo output only."*
- **Historical Density Unit Alignment:**
  - Enforced normalized `0–1` in UI form (`max="1"`, `step="0.01"`), backend Zod validation schema, and Python inference schemas.
  - Renamed input label to: `Historical susceptibility / density (0–1 normalized)`.
  - Mismatches (such as raw count 8.2) are audited and routed to quarantine rather than silently clamped.

---

### 3. Verification & Test Matrix

| Test Case | Expected Behavior | Observed Result | Status |
|---|---|---|---|
| **1. Multi-sheet Listing** | Reads sheet names safely without macro execution | Identified sheets: `ValidatedData`, `PositiveOnlyData`, `RawDensityData` | **PASS** |
| **2. Sheet Selection & Audit** | Audits specified sheet and outputs SHA-256 hash | SHA-256 computed, audit JSON and Markdown generated | **PASS** |
| **3. Column Mapping** | Matches aliases (e.g. `rainfall 24h`, `slope`, `landslide`) | All 6 features and target correctly mapped | **PASS** |
| **4. Missing Column Detection** | Flags missing features | Missing columns correctly detected and reported in audit | **PASS** |
| **5. Positive-Only Target Detection** | Halts training if dataset lacks negative (0) class | Detected `NOT_READY_ALL_POSITIVE_ONLY`, routed rows to quarantine | **PASS** |
| **6. Raw Density Mismatch** | Flags density > 1.0 (e.g. 8.2) | Flagged `RAW_DENSITY_OR_COUNT`, required normalization | **PASS** |
| **7. Clean Import & CSV Derivation** | Derives training CSV for valid rows | Clean 6-feature CSV produced in `data/processed/` | **PASS** |
| **8. Multi-Model Training** | Trains LogReg, Random Forest, XGBoost with metrics | Precision, Recall, F1, ROC-AUC, and Model Card created | **PASS** |
| **9. Model Loader Auto-Detection** | Prioritizes Excel model if present, falls back cleanly | Correctly loaded `EXCEL_PILOT_XGBOOST` when present, `PRACTICE_XGBOOST` when absent | **PASS** |
| **10. Simulator Consistency Check** | Score 80 displays CRITICAL with consistent AI evac advice | Tested mapping: `score >= 75` -> `CRITICAL`, AI: `PREPARE_TO_EVACUATE`, Official: `NO_ADVICE` | **PASS** |
| **11. Frontend & Backend Compilation** | Both codebases pass static typecheck and production build | `npm run build` and `npm --prefix backend run build` exited with code 0 | **PASS** |
