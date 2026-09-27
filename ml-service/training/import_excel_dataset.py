"""
training/import_excel_dataset.py
================================
Safe derivation and import tool for private Excel datasets in PARVAAH ml-service.

Rules:
- Never mutates the original workbook.
- Normalizes column names cleanly.
- Preserves a column-mapping report (JSON) and import quality report (Markdown).
- Preserves source row numbers and original values.
- Moves invalid/missing/suspicious rows to quarantine CSV without silent deletion.
- Outputs clean training CSV only when data satisfies validation.
"""

import argparse
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import openpyxl
import pandas as pd

from inspect_excel_dataset import (
    FEATURE_ALIASES,
    TARGET_ALIASES,
    LEAKAGE_COLUMNS,
    compute_file_sha256,
    normalize_col_name,
)

CANONICAL_FEATURES = [
    "rainfall_24h_mm",
    "forecast_rainfall_24h_mm",
    "soil_moisture_percent",
    "slope_degrees",
    "historical_landslide_density",
    "verified_report_count",
]
TARGET_COL = "landslide_occurred"


def import_excel_dataset(
    file_path: Path,
    sheet_name: Optional[str] = None,
    output_processed_path: Optional[Path] = None,
    output_quarantine_path: Optional[Path] = None,
    reports_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    if not file_path.exists():
        raise FileNotFoundError(f"Excel file not found at: {file_path}")

    root_dir = Path(__file__).resolve().parent.parent
    if output_processed_path is None:
        output_processed_path = root_dir / "data" / "processed" / "landslide_training_from_excel_v1.csv"
    if output_quarantine_path is None:
        output_quarantine_path = root_dir / "data" / "quarantine" / "excel_flagged_rows_v1.csv"
    if reports_dir is None:
        reports_dir = root_dir / "reports"

    reports_dir.mkdir(parents=True, exist_ok=True)
    output_processed_path.parent.mkdir(parents=True, exist_ok=True)
    output_quarantine_path.parent.mkdir(parents=True, exist_ok=True)

    file_hash = compute_file_sha256(file_path)

    # Read sheet names safely
    ext = file_path.suffix.lower()
    if ext in [".xlsx", ".xlsm"]:
        wb = openpyxl.load_workbook(str(file_path), read_only=True, data_only=True)
        available_sheets = wb.sheetnames
        wb.close()
    else:
        xls = pd.ExcelFile(str(file_path))
        available_sheets = xls.sheet_names

    selected_sheet = sheet_name if sheet_name and sheet_name in available_sheets else available_sheets[0]

    # Read raw data into DataFrame
    raw_df = pd.read_excel(str(file_path), sheet_name=selected_sheet)
    raw_rows, raw_cols = raw_df.shape

    orig_columns = [str(c) for c in raw_df.columns]
    normalized_cols = {orig: normalize_col_name(orig) for orig in orig_columns}

    # Column mapping resolution
    column_mapping_record: Dict[str, Any] = {
        "file_sha256": file_hash,
        "selected_sheet": selected_sheet,
        "features": {},
        "target": None,
        "unmapped_columns": [],
        "leakage_columns": [],
    }

    feature_col_map: Dict[str, str] = {}  # canonical -> orig_col
    for canon in CANONICAL_FEATURES:
        matched = None
        for orig in orig_columns:
            norm = normalized_cols[orig]
            if norm == canon or norm in FEATURE_ALIASES.get(canon, []):
                matched = orig
                break
        if matched:
            feature_col_map[canon] = matched
            column_mapping_record["features"][canon] = {
                "source_column": matched,
                "status": "MAPPED",
            }
        else:
            column_mapping_record["features"][canon] = {
                "source_column": None,
                "status": "MISSING",
            }

    # Target mapping
    target_orig = None
    for orig in orig_columns:
        norm = normalized_cols[orig]
        if norm in TARGET_ALIASES:
            target_orig = orig
            break

    if target_orig:
        column_mapping_record["target"] = {
            "source_column": target_orig,
            "status": "MAPPED",
        }
    else:
        column_mapping_record["target"] = {
            "source_column": None,
            "status": "MISSING",
        }

    # Leakage and unmapped
    for orig in orig_columns:
        norm = normalized_cols[orig]
        is_feature = orig in feature_col_map.values()
        is_target = orig == target_orig
        is_leak = any(leak in norm for leak in LEAKAGE_COLUMNS)
        if is_leak:
            column_mapping_record["leakage_columns"].append(orig)
        elif not is_feature and not is_target:
            column_mapping_record["unmapped_columns"].append(orig)

    # Save excel_column_mapping.json
    mapping_path = reports_dir / "excel_column_mapping.json"
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(column_mapping_record, f, indent=2)

    # Check mapping readiness
    missing_features = [f for f, info in column_mapping_record["features"].items() if info["status"] == "MISSING"]
    if missing_features or not target_orig:
        err_msg = (
            f"Cannot import dataset: Required columns could not be mapped safely. "
            f"Missing features: {missing_features}, Target mapped: {bool(target_orig)}"
        )
        write_import_quality_report(
            reports_dir / "excel_import_quality_report.md",
            file_path.name,
            file_hash,
            selected_sheet,
            raw_rows,
            valid_count=0,
            quarantine_count=raw_rows,
            quarantine_reasons=["Required columns could not be mapped."],
            mapping_record=column_mapping_record,
            success=False,
            error_message=err_msg,
        )
        return {
            "success": False,
            "error": err_msg,
            "mapping": column_mapping_record,
        }

    # Validate row-by-row
    valid_rows: List[Dict[str, Any]] = []
    quarantine_rows: List[Dict[str, Any]] = []
    quarantine_reasons: List[str] = []

    # Historical density unit check across dataset
    hist_col = feature_col_map["historical_landslide_density"]
    max_hist_val = raw_df[hist_col].max()
    historical_density_is_raw = max_hist_val > 1.0

    for idx, row in raw_df.iterrows():
        source_row_num = idx + 2  # Excel row (1-indexed + header)
        flags: List[str] = []

        # Check nulls in required features
        row_dict: Dict[str, Any] = {"_source_row": source_row_num}
        for canon, orig in feature_col_map.items():
            val = row[orig]
            if pd.isna(val):
                flags.append(f"Missing {canon} ({orig})")
            else:
                try:
                    num_val = float(val)
                    row_dict[canon] = num_val
                except (ValueError, TypeError):
                    flags.append(f"Non-numeric {canon} ({val})")

        # Check target
        t_val = row[target_orig]
        if pd.isna(t_val):
            flags.append("Missing target label")
        else:
            try:
                t_int = int(round(float(t_val)))
                if t_int not in [0, 1]:
                    flags.append(f"Target value not binary 0/1: {t_val}")
                else:
                    row_dict[TARGET_COL] = t_int
            except (ValueError, TypeError):
                flags.append(f"Non-numeric target value: {t_val}")

        # Range validations
        if "rainfall_24h_mm" in row_dict and row_dict["rainfall_24h_mm"] < 0:
            flags.append("Rainfall 24h is negative")
        if "forecast_rainfall_24h_mm" in row_dict and row_dict["forecast_rainfall_24h_mm"] < 0:
            flags.append("Forecast rainfall is negative")
        if "soil_moisture_percent" in row_dict and not (0 <= row_dict["soil_moisture_percent"] <= 100):
            flags.append("Soil moisture out of 0-100 range")
        if "slope_degrees" in row_dict and not (0 <= row_dict["slope_degrees"] <= 90):
            flags.append("Slope out of 0-90 range")

        # Historical density unit flag
        if "historical_landslide_density" in row_dict:
            hd_val = row_dict["historical_landslide_density"]
            if historical_density_is_raw:
                flags.append(f"Historical density raw value {hd_val} > 1.0 requires documented normalization formula")
            elif not (0 <= hd_val <= 1.0):
                flags.append(f"Historical density out of normalized 0-1 range: {hd_val}")

        # Verified report count validation
        if "verified_report_count" in row_dict:
            v_val = row_dict["verified_report_count"]
            if v_val < 0 or int(v_val) != v_val:
                flags.append(f"Verified report count not non-negative integer: {v_val}")
            else:
                row_dict["verified_report_count"] = int(v_val)

        if flags:
            # Add to quarantine with original values and reason
            q_entry = {**row.to_dict(), "_source_row": source_row_num, "_quarantine_reasons": "; ".join(flags)}
            quarantine_rows.append(q_entry)
            quarantine_reasons.extend(flags)
        else:
            valid_rows.append(row_dict)

    # Check target class diversity in valid rows
    if valid_rows:
        targets_present = {r[TARGET_COL] for r in valid_rows}
        if len(targets_present) < 2:
            reason = "NOT_READY_ALL_POSITIVE_ONLY: Dataset contains only one target class."
            quarantine_reasons.append(reason)
            # Move all to quarantine because cannot train single-class
            for r in valid_rows:
                quarantine_rows.append({**r, "_quarantine_reasons": reason})
            valid_rows = []

    # Save cleaned derived CSV if we have valid rows
    if valid_rows:
        valid_df = pd.DataFrame(valid_rows)
        # Reorder canonical columns
        out_cols = CANONICAL_FEATURES + [TARGET_COL]
        valid_df[out_cols].to_csv(output_processed_path, index=False)

    # Save quarantine CSV if flagged rows exist
    if quarantine_rows:
        quarantine_df = pd.DataFrame(quarantine_rows)
        quarantine_df.to_csv(output_quarantine_path, index=False)

    # Generate Markdown quality report
    report_path = reports_dir / "excel_import_quality_report.md"
    write_import_quality_report(
        report_path,
        file_path.name,
        file_hash,
        selected_sheet,
        raw_rows,
        valid_count=len(valid_rows),
        quarantine_count=len(quarantine_rows),
        quarantine_reasons=quarantine_reasons,
        mapping_record=column_mapping_record,
        success=len(valid_rows) > 0,
        processed_csv_path=str(output_processed_path),
        quarantine_csv_path=str(output_quarantine_path),
    )

    return {
        "success": len(valid_rows) > 0,
        "valid_rows_count": len(valid_rows),
        "quarantined_rows_count": len(quarantine_rows),
        "processed_csv": str(output_processed_path) if valid_rows else None,
        "quarantine_csv": str(output_quarantine_path) if quarantine_rows else None,
        "mapping_record": column_mapping_record,
    }


def write_import_quality_report(
    report_path: Path,
    filename: str,
    file_hash: str,
    sheet_name: str,
    total_rows: int,
    valid_count: int,
    quarantine_count: int,
    quarantine_reasons: List[str],
    mapping_record: Dict[str, Any],
    success: bool,
    processed_csv_path: Optional[str] = None,
    quarantine_csv_path: Optional[str] = None,
    error_message: Optional[str] = None,
) -> None:
    lines = [
        "# PARVAAH Excel Import Quality & Hygiene Report",
        "",
        f"- **File:** `{filename}`",
        f"- **SHA-256:** `{file_hash}`",
        f"- **Sheet:** `{sheet_name}`",
        f"- **Timestamp:** `{datetime.now(timezone.utc).isoformat()}`",
        f"- **Status:** `{'SUCCESS' if success else 'ACTION_REQUIRED'}`",
        "",
        "## Summary Counts",
        f"- Total Input Rows: **{total_rows}**",
        f"- Clean Valid Rows for Training: **{valid_count}**",
        f"- Quarantined Flagged Rows: **{quarantine_count}**",
        "",
        "## Feature Column Mapping",
        "| Canonical Feature | Source Column | Status |",
        "|---|---|---|",
    ]

    for feat, info in mapping_record.get("features", {}).items():
        lines.append(f"| `{feat}` | `{info['source_column']}` | **{info['status']}** |")

    target_info = mapping_record.get("target", {})
    lines.append(f"| `target (landslide_occurred)` | `{target_info.get('source_column')}` | **{target_info.get('status')}** |")

    if mapping_record.get("leakage_columns"):
        lines.extend([
            "",
            "### Data Leakage Columns Excluded",
            *(f"- ⚠️ `{col}`" for col in mapping_record["leakage_columns"]),
        ])

    if error_message:
        lines.extend([
            "",
            "## Critical Error",
            f"> 🛑 {error_message}",
        ])

    if quarantine_count > 0:
        lines.extend([
            "",
            "## Quarantine Summary",
            f"Flagged rows were safely routed to `{quarantine_csv_path}` without deletion.",
            "",
            "Sample of reasons for quarantine:",
            *(f"- {r}" for r in sorted(list(set(quarantine_reasons)))[:15]),
        ])

    if valid_count > 0:
        lines.extend([
            "",
            "## Clean Training Dataset",
            f"Derived training dataset saved to `{processed_csv_path}`.",
        ])

    lines.append("")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    parser = argparse.ArgumentParser(description="Clean and derive training dataset from Excel.")
    parser.add_argument("file_path", type=str, help="Path to Excel file")
    parser.add_argument("--sheet", type=str, default=None, help="Sheet name")
    args = parser.parse_args()

    file_path = Path(args.file_path).resolve()
    print(f"\n=======================================================")
    print(f"  PARVAAH EXCEL DATASET IMPORT")
    print(f"=======================================================")
    res = import_excel_dataset(file_path, sheet_name=args.sheet)
    print(f"  Success:            {res['success']}")
    if res.get("valid_rows_count") is not None:
        print(f"  Valid Rows:         {res['valid_rows_count']}")
        print(f"  Quarantined Rows:   {res['quarantined_rows_count']}")
    if res.get("error"):
        print(f"  Error:              {res['error']}")
    print(f"=======================================================\n")


if __name__ == "__main__":
    main()
