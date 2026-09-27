# Processed pilot data

These files are research artifacts for the East Sikkim pilot only. They are not operational data and must not be used for public warnings or evacuation decisions.

Run preparation from `ml-service`:

```powershell
python training/prepare_pilot_dataset.py `
  --events data/raw/pilot_landslide_events.csv `
  --zones data/raw/pilot_zones.csv `
  --rainfall data/raw/rainfall_features.csv
```

The script writes `landslide_training_v1.csv` and summary reports here. It creates positives from accepted event-to-zone matches and negatives only from rainfall windows explicitly marked `no_landslide_observed`. No missing value is filled with a fabricated number.
