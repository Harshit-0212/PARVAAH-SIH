# Data Sources & Pipeline Specifications — PARVAAH (SIH26191)

## 1. Meteorological Telemetry
- **India Meteorological Department (IMD)**:
  - Precipitation, atmospheric pressure, temperature, and 24-72h monsoon outlooks.
  - Acquisition: Automatic Weather Stations (AWS) & Open Data API endpoints (`IMD_API_BASE_URL`).
  - Fallback: Pre-packaged deterministic historical/synthetic records for offline simulation drills.

## 2. Geological & Terrain Data
- **Geological Survey of India (GSI) & National Remote Sensing Centre (NRSC)**:
  - Slope angles, soil moisture thresholds, geological fault zones, and landslide susceptibility zonation (LSZ).
  - Acquisition: Cartosat / SRTM Digital Elevation Models (DEM) processed for North Eastern hill tracts.
  - Format: GeoJSON polygons and CSV training tables.

## 3. Ground Infrastructure & Sensor Telemetry
- **Border Roads Organisation (BRO) & State PWD**:
  - Mountain highway statuses (NH-10, NH-29, NH-715), blockage coordinates, and clearance times.
- **Slope Instrumentation Feeds**:
  - Inclinometer tilt angles, subsurface pore pressure, and soil acoustic metrics.

## 4. Habitation & Demographic Datasets
- **Census of India & District Disaster Management Authorities (DDMA)**:
  - Village census codes, vulnerable habitations count, household density, and safe shelter capacities.
- **Data Ingestion Workflow**:
  - Located under `ingestion/scripts/` to sanitize raw Excel sheets into structured JSON and binary model artifacts.
