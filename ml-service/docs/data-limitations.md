# East Sikkim pilot limitations

- The pilot covers one selected district only and cannot support a North Eastern Region claim.
- An event inventory can be incomplete, delayed, duplicated, spatially imprecise, or biased toward reported roads and settlements.
- Negative labels are only as good as the observation coverage behind `no_landslide_observed`; an unlisted event is not proof that no event occurred.
- Rainfall and soil measurements may have missingness, station-distance bias, unit differences, forecast/observation differences, or timestamp alignment errors.
- DEM-derived slope/elevation and GIS distances depend on resolution, CRS, zone geometry, and processing choices.
- A nearest-zone match can be wrong for events near zone boundaries; matching distance must be reviewed.
- A time or spatial holdout may still be too small for stable metrics. ROC-AUC and PR-AUC are omitted when mathematically unavailable.
- Metrics are research estimates, not operational validation, calibration, or a comparison with official warnings.
- The model must not be described as real-time, IMD-validated, government-approved, or suitable for warnings/evacuation decisions.
- Dashboard/presentation text must show the pilot area, sources, date range, feature provenance, class balance, split method, metrics actually computed, and this disclaimer.
- Do not use citizen reports, official orders, or post-event response fields as predictors unless a separate approved methodology proves they were available before the prediction timestamp.
