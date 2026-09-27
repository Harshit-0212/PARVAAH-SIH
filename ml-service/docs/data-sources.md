# East Sikkim pilot data sources

This pilot uses one area only: **East Sikkim district**. The repository does not fetch or scrape data. You must obtain and document each source lawfully.

## Event inventory

Place the exported file at `ml-service/data/raw/pilot_landslide_events.csv`.

Use an authorised/open source such as a district disaster-management record, a research institution inventory, a peer-reviewed supplementary dataset, or an open government dataset whose licence permits reuse. Confirm the source owner, licence, coverage, timestamp meaning, and event verification process. Do not represent a research inventory as an official IMD warning feed.

Required columns are in `data/processed/pilot_landslide_events_template.csv`. `source` and `reliability` must identify the evidence quality. Keep the source URL or permission reference in `data/external/README.md` or a separate provenance note.

## Pilot zones and terrain

Place `pilot_zones.csv` in `data/raw/`. Create zones from a documented GIS process, for example a fixed road corridor buffer or a regular grid clipped to East Sikkim. Use an openly licensed DEM or institutionally authorised DEM in QGIS to derive elevation and slope. Record the DEM name, resolution, CRS, processing date, and QGIS/project reference in `terrain_source` and `terrain_updated_at`.

Distances to road and river should be measured from the zone representative point or polygon using a documented GIS method. Historical density must be calculated only from an event inventory and a defined spatial/time window. Do not copy the synthetic practice density values.

## Rainfall and soil features

Place `rainfall_features.csv` in `data/raw/`. Build one row per zone and feature timestamp from an authorised/open provider or instrument export. The script expects rainfall totals that were available at the feature timestamp, not totals calculated after the event.

Minimum rainfall columns:

- `zone_id`
- `timestamp` with timezone or an explicitly documented timezone
- `rainfall_24h_mm`
- `rainfall_72h_mm`
- `soil_moisture_percent`
- `no_landslide_observed`

Mark `no_landslide_observed=true` only when an authorised observation process covers that zone and the following 24-hour window. Otherwise leave it false/blank and the script will not create a negative label.

## Restrictions

Do not download restricted systems, bypass access controls, scrape private portals, use credentials in the repository, or use data whose licence does not permit research use. The resulting pilot is not real-time, IMD-validated, operational, or suitable for public warning or evacuation decisions.
