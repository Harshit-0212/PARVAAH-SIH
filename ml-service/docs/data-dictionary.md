# East Sikkim pilot data dictionary

## Event inventory: `pilot_landslide_events.csv`

| Column                  | Meaning                           | Requirement                                    |
| ----------------------- | --------------------------------- | ---------------------------------------------- |
| `event_id`              | Stable source event identifier    | Required; unique after deduplication           |
| `event_time`            | Event occurrence/observation time | Required ISO/date-time; timezone documented    |
| `latitude`, `longitude` | Event coordinate                  | Required valid WGS84 coordinate                |
| `district`, `state`     | Administrative location           | Must identify East Sikkim for this pilot       |
| `event_type`            | Event classification              | Must identify a landslide to create a positive |
| `source`                | Inventory/source reference        | Required provenance                            |
| `reliability`           | Source confidence/category        | Required; do not invent certainty              |

## Zones: `pilot_zones.csv`

| Column                                      | Meaning                                             |
| ------------------------------------------- | --------------------------------------------------- |
| `zone_id`, `zone_name`                      | Stable zone identity                                |
| `district`, `state`                         | Pilot area                                          |
| `latitude`, `longitude`                     | Zone representative WGS84 coordinate                |
| `slope_degrees`                             | DEM/QGIS-derived slope                              |
| `elevation_m`                               | DEM-derived elevation                               |
| `distance_to_road_m`, `distance_to_river_m` | GIS-derived distances                               |
| `historical_landslide_density`              | Documented historical event density, normalised 0-1 |
| `terrain_source`                            | DEM/GIS source and method reference                 |
| `terrain_updated_at`                        | Terrain derivation date                             |

## Rainfall features: `rainfall_features.csv`

| Column                  | Meaning                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `zone_id`, `timestamp`  | Zone and feature availability time                                    |
| `rainfall_24h_mm`       | Rainfall available in the preceding 24 hours                          |
| `rainfall_72h_mm`       | Rainfall available in the preceding 72 hours                          |
| `soil_moisture_percent` | Soil-moisture measurement/estimate available then                     |
| `no_landslide_observed` | Explicit covered negative window, not an automatic absence assumption |
| `feature_source`        | Optional provider/instrument reference                                |
| `data_quality_notes`    | Optional units, gaps, interpolation, and QA notes                     |

## Final training CSV

`landslide_training_v1.csv` combines zone terrain fields with a rainfall row. `landslide_occurred=1` means an accepted event was matched to the nearest zone and the feature timestamp precedes the event. `landslide_occurred=0` means the rainfall row was explicitly marked as a covered no-event window and no accepted event occurs in the following 24 hours. `event_id`, `label_source`, `feature_source`, and `data_quality_notes` preserve provenance.
