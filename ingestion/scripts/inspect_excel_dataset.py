"""
training/inspect_excel_dataset.py
=================================
Safe audit and inspection tool for private Excel datasets in PARVAAH ml-service.

Rules:
- Never prints all raw private rows.
- Computes SHA-256 provenance hash.
- Inspects sheets, row/col counts, column names, data types, missing values,
  target distribution, range summaries, and quality issues.
- Generates JSON and Markdown audit reports.
"""

import argparse
import hashlib
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Force UTF-8 stdout/stderr on Windows
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
import openpyxl
import pandas as pd

# Canonical feature and target definitions
FEATURE_ALIASES = {
    "rainfall_24h_mm": [
        "rainfall_24h_mm", "rainfall 24h", "rainfall_24h", "rain_24h", "rainfall24hmm"
    ],
    "forecast_rainfall_24h_mm": [
        "forecast_rainfall_24h_mm", "forecast rainfall 24h", "forecast_rainfall_24h", "rainfall_forecast_24h",
        "forecast_24h", "forecastrainfall24hmm"
    ],
    "soil_moisture_percent": [
        "soil_moisture_percent", "soil moisture", "soil_moisture", "soilmoisturepercent"
    ],
    "slope_degrees": [
        "slope_degrees", "slope", "slope_degree", "slopedegrees"
    ],
    "historical_landslide_density": [
        "historical_landslide_density", "historical_density", "historical_susceptibility",
        "landslide_density", "historicallandsildedensity"
    ],
    "verified_report_count": [
        "verified_report_count", "verified_reports", "report_count", "verifiedreportcount"
    ],
}

TARGET_ALIASES = [
    "landslide_occurred", "target", "label", "event", "landslide", "occurred"
]

LEAKAGE_COLUMNS = [
    "fatalities", "deaths", "injuries", "casualty", "casualties",
    "event_size", "final_event_size", "damage", "damage_inr",
    "response_outcome", "evacuation_completed", "rescue_count"
]


def compute_file_sha256(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()


def normalize_col_name(col: Any) -> str:
    return str(col).strip().lower().replace(" ", "_").replace("-", "_")


def audit_excel_dataset(
    file_path: Path,
    sheet_name: Optional[str] = None,
    source_notes: Optional[str] = None,
    output_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    if not file_path.exists():
        raise FileNotFoundError(f"Excel file not found at: {file_path}")

    ext = file_path.suffix.lower()
    if ext not in [".xlsx", ".xls", ".xlsm"]:
        raise ValueError(f"Unsupported file format: {ext}. Expected .xlsx, .xls, or .xlsm")

    file_hash = compute_file_sha256(file_path)
    file_size_bytes = file_path.stat().st_size

    # List sheet names safely (macros are never executed)
    if ext in [".xlsx", ".xlsm"]:
        wb = openpyxl.load_workbook(str(file_path), read_only=True, data_only=True)
        available_sheets = wb.sheetnames
        wb.close()
    else:
        xls = pd.ExcelFile(str(file_path))
        available_sheets = xls.sheet_names

    selected_sheet = sheet_name if sheet_name and sheet_name in available_sheets else available_sheets[0]

    # Load sheet into DataFrame safely (data only)
    df = pd.read_excel(str(file_path), sheet_name=selected_sheet)

    row_count, col_count = df.shape
    orig_columns = [str(c) for c in df.columns]
    normalized_cols = {orig: normalize_col_name(orig) for orig in orig_columns}

    # Data types and missing values
    missing_counts = {orig: int(df[orig].isna().sum()) for orig in orig_columns}
    inferred_types = {orig: str(df[orig].dtype) for orig in orig_columns}

    # Feature & Target Mapping Analysis
    col_mapping: Dict[str, Dict[str, Any]] = {}
    found_features: Dict[str, str] = {}
    found_target: Optional[str] = None
    data_quality_issues: List[str] = []

    # Map features
    for canon_feature, aliases in FEATURE_ALIASES.items():
        matched_orig = None
        for orig in orig_columns:
            norm = normalized_cols[orig]
            if norm == canon_feature or norm in aliases:
                matched_orig = orig
                break
        if matched_orig:
            col_mapping[canon_feature] = {"status": "MAPPED", "source_col": matched_orig}
            found_features[canon_feature] = matched_orig
        else:
            col_mapping[canon_feature] = {"status": "MISSING", "source_col": None}
            data_quality_issues.append(f"Missing required feature: '{canon_feature}'")

    # Map target
    for orig in orig_columns:
        norm = normalized_cols[orig]
        if norm in TARGET_ALIASES:
            found_target = orig
            break

    if found_target:
        col_mapping["target"] = {"status": "MAPPED", "source_col": found_target}
    else:
        col_mapping["target"] = {"status": "MISSING", "source_col": None}
        data_quality_issues.append("Missing required target classification column ('landslide_occurred' or alias)")

    # Data leakage check
    leakage_detected: List[str] = []
    for orig in orig_columns:
        norm = normalized_cols[orig]
        for leak in LEAKAGE_COLUMNS:
            if leak in norm:
                leakage_detected.append(orig)
                data_quality_issues.append(f"Data leakage warning: post-event column '{orig}' must not be used for prediction.")

    # Target distribution
    target_distribution: Dict[str, Any] = {}
    target_ready = False
    if found_target:
        s_target = df[found_target].dropna()
        counts = s_target.value_counts().to_dict()
        target_distribution = {str(k): int(v) for k, v in counts.items()}
        unique_targets = set(s_target.unique())
        if len(unique_targets) == 1 and 1 in unique_targets or len(unique_targets) == 1 and True in unique_targets:
            data_quality_issues.append("NOT_READY_ALL_POSITIVE_ONLY: Target contains only positive (1) events. Binary training requires negative (0) samples.")
            target_ready = False
        elif len(unique_targets) >= 2:
            target_ready = True
        else:
            data_quality_issues.append("Target does not have at least two classes (0 and 1).")

    # Numeric range summary & unit checks
    range_summary: Dict[str, Dict[str, Any]] = {}
    historical_density_unit = "UNKNOWN"
    for orig in orig_columns:
        s = df[orig]
        if pd.api.types.is_numeric_dtype(s):
            s_clean = s.dropna()
            if not s_clean.empty:
                min_v = float(s_clean.min())
                max_v = float(s_clean.max())
                mean_v = float(s_clean.mean())
                range_summary[orig] = {
                    "min": min_v,
                    "max": max_v,
                    "mean": round(mean_v, 3),
                    "null_count": int(s.isna().sum())
                }

    # Range validations on mapped features
    if "rainfall_24h_mm" in found_features:
        col = found_features["rainfall_24h_mm"]
        if (df[col] < 0).any():
            data_quality_issues.append(f"Invalid negative values detected in '{col}'.")
    if "forecast_rainfall_24h_mm" in found_features:
        col = found_features["forecast_rainfall_24h_mm"]
        if (df[col] < 0).any():
            data_quality_issues.append(f"Invalid negative values detected in '{col}'.")
    if "soil_moisture_percent" in found_features:
        col = found_features["soil_moisture_percent"]
        if (df[col] < 0).any() or (df[col] > 100).any():
            data_quality_issues.append(f"Values outside 0-100% detected in soil moisture column '{col}'.")
    if "slope_degrees" in found_features:
        col = found_features["slope_degrees"]
        if (df[col] < 0).any() or (df[col] > 90).any():
            data_quality_issues.append(f"Values outside 0-90 degrees detected in slope column '{col}'.")

    # Historical density unit check
    if "historical_landslide_density" in found_features:
        col = found_features["historical_landslide_density"]
        max_val = df[col].max()
        if max_val > 1.0:
            historical_density_unit = "RAW_DENSITY_OR_COUNT"
            data_quality_issues.append(
                f"Historical density column '{col}' has maximum value {max_val} > 1.0. "
                "Detected unit is raw event density/count, not normalized 0-1 score. "
                "Must document unit and avoid silent clamping."
            )
        else:
            historical_density_unit = "NORMALIZED_0_TO_1"

    # Overall training readiness
    all_features_mapped = all(col_mapping[f]["status"] == "MAPPED" for f in FEATURE_ALIASES)
    is_ready = all_features_mapped and target_ready and len(leakage_detected) == 0

    readiness_status = "READY" if is_ready else "NOT_READY"
    if not target_ready and found_target:
        readiness_status = "NOT_READY_ALL_POSITIVE_ONLY" if 0 not in target_distribution and "0" not in target_distribution else "NOT_READY_TARGET_ISSUE"
    elif not all_features_mapped:
        readiness_status = "NOT_READY_MISSING_FEATURES"

    audit_result = {
        "provenance": {
            "original_filename": file_path.name,
            "file_path_relative": str(file_path).replace("\\", "/"),
            "file_sha256": file_hash,
            "file_size_bytes": file_size_bytes,
            "import_timestamp": datetime.now(timezone.utc).isoformat(),
            "source_notes": source_notes or "Private user-provided dataset. Confidential.",
        },
        "workbook": {
            "available_sheets": available_sheets,
            "selected_sheet": selected_sheet,
            "row_count": row_count,
            "column_count": col_count,
            "column_names": orig_columns,
            "inferred_types": inferred_types,
            "missing_counts": missing_counts,
        },
        "mapping": col_mapping,
        "historical_density_unit": historical_density_unit,
        "target_distribution": target_distribution,
        "range_summary": range_summary,
        "data_leakage_columns": leakage_detected,
        "data_quality_issues": data_quality_issues,
        "readiness_status": readiness_status,
        "is_ready_for_training": is_ready,
    }

    # Save reports to ml-service/reports/
    if output_dir is None:
        output_dir = Path(__file__).resolve().parent.parent / "reports"
    output_dir.mkdir(parents=True, exist_ok=True)

    json_report_path = output_dir / "excel_dataset_audit.json"
    with open(json_report_path, "w", encoding="utf-8") as f:
        json.dump(audit_result, f, indent=2)

    md_report_path = output_dir / "excel_dataset_audit.md"
    md_content = generate_markdown_report(audit_result)
    with open(md_report_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    return audit_result


def generate_markdown_report(audit: Dict[str, Any]) -> str:
    prov = audit["provenance"]
    wb = audit["workbook"]
    mapping = audit["mapping"]
    issues = audit["data_quality_issues"]

    lines = [
        "# PARVAAH Excel Dataset Audit Report",
        "",
        "> **CONFIDENTIAL RAW DATA AUDIT**",
        "> This audit summarizes schema structure, data quality, and training readiness without printing private record contents.",
        "",
        "## 1. Provenance Record",
        f"- **Original File:** `{prov['original_filename']}`",
        f"- **SHA-256 Hash:** `{prov['file_sha256']}`",
        f"- **File Size:** {prov['file_size_bytes']:,} bytes",
        f"- **Imported At:** `{prov['import_timestamp']}`",
        f"- **Source / Notes:** {prov['source_notes']}",
        "",
        "## 2. Workbook Overview",
        f"- **Available Sheets:** {', '.join(f'`{s}`' for s in wb['available_sheets'])}",
        f"- **Selected Sheet:** `{wb['selected_sheet']}`",
        f"- **Total Rows:** {wb['row_count']}",
        f"- **Total Columns:** {wb['column_count']}",
        "",
        "## 3. Feature & Target Column Mapping",
        "| Canonical Role | Source Column | Status | Inferred Type | Null Count |",
        "|---|---|---|---|---|",
    ]

    for role, info in mapping.items():
        src = f"`{info['source_col']}`" if info['source_col'] else "*None*"
        status = f"**{info['status']}**"
        dtype = wb["inferred_types"].get(info["source_col"], "-") if info['source_col'] else "-"
        null_c = wb["missing_counts"].get(info["source_col"], "-") if info['source_col'] else "-"
        lines.append(f"| `{role}` | {src} | {status} | {dtype} | {null_c} |")

    lines.extend([
        "",
        f"**Historical Density Unit Assessment:** `{audit['historical_density_unit']}`",
        "",
        "## 4. Target Distribution",
    ])
    if audit["target_distribution"]:
        for k, v in audit["target_distribution"].items():
            lines.append(f"- **Class `{k}`:** {v} samples")
    else:
        lines.append("- *No target column mapped or target is empty.*")

    lines.extend([
        "",
        "## 5. Data Quality & Validation Summary",
        f"- **Readiness Status:** `{audit['readiness_status']}`",
        f"- **Ready for XGBoost Training:** `{'YES' if audit['is_ready_for_training'] else 'NO'}`",
        "",
        "### Quality Checks & Issues Detected:",
    ])

    if issues:
        for iss in issues:
            lines.append(f"- ⚠️ {iss}")
    else:
        lines.append("- ✅ All required ranges, types, and column checks passed cleanly.")

    lines.extend([
        "",
        "## 6. Numeric Range Summary",
        "| Column | Min | Max | Mean | Nulls |",
        "|---|---|---|---|---|",
    ])

    for col, stat in audit["range_summary"].items():
        lines.append(f"| `{col}` | {stat['min']} | {stat['max']} | {stat['mean']} | {stat['null_count']} |")

    lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Audit and inspect private Excel dataset for PARVAAH ML service.")
    parser.add_argument("file_path", type=str, help="Path to Excel dataset (.xlsx, .xls, .xlsm)")
    parser.add_argument("--sheet", type=str, default=None, help="Name of sheet to inspect (default: first sheet)")
    parser.add_argument("--notes", type=str, default=None, help="Optional provenance or source notes")
    args = parser.parse_args()

    file_path = Path(args.file_path).resolve()
    print(f"\n=======================================================")
    print(f"  PARVAAH EXCEL DATASET INSPECTION")
    print(f"=======================================================")
    print(f"  Inspecting: {file_path.name}")
    print(f"  Path:       {file_path}")

    audit = audit_excel_dataset(file_path, sheet_name=args.sheet, source_notes=args.notes)

    print(f"\n  [Provenance SHA-256]: {audit['provenance']['file_sha256']}")
    print(f"  [Workbook Sheets]:     {', '.join(audit['workbook']['available_sheets'])}")
    print(f"  [Selected Sheet]:     {audit['workbook']['selected_sheet']}")
    print(f"  [Rows / Columns]:     {audit['workbook']['row_count']} rows, {audit['workbook']['column_count']} cols")
    print(f"  [Readiness Status]:   {audit['readiness_status']}")
    print(f"  [Target Classes]:     {audit['target_distribution']}")
    print(f"  [Historical Unit]:    {audit['historical_density_unit']}")
    print(f"  [Issues Detected]:    {len(audit['data_quality_issues'])}")

    for issue in audit['data_quality_issues']:
        print(f"    - {issue}")

    reports_dir = Path(__file__).resolve().parent.parent / "reports"
    print(f"\n  Audit reports generated:")
    print(f"  -> {reports_dir / 'excel_dataset_audit.json'}")
    print(f"  -> {reports_dir / 'excel_dataset_audit.md'}")
    print(f"=======================================================\n")


if __name__ == "__main__":
    main()
