# SIH26191 Alignment: PARVAAH

## 1. Problem Statement Summary (SIH26191)

> **"Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations"**

Disaster-prone mountainous habitations—particularly in the North Eastern Region of India—face acute vulnerabilities from recurring landslides, flash floods, and slope instabilities. Mitigating losses requires:
1. **Intelligent Identification of Hazard-Based Red Zones**: Aggregating localized geohazard events, historical landslide occurrences, and slope profiles into distinct administrative and geographical risk boundaries.
2. **Carrying Capacity Assessment**: Evaluating designated safe relocation sites to ensure available capacity (families and individuals) can sustainably absorb displaced communities without causing secondary strain or hazards.
3. **Immediate Relocation Needs Prioritization**: Formulating prioritized action queues (`IMMEDIATE`, `SHORT_TERM`, `MEDIUM_TERM`) to stage emergency relocations efficiently according to risk intensity and habitation size.

---

## 2. How PARVAAH Maps Directly to SIH26191

| SIH26191 Core Objective | PARVAAH Implementation Component | Description & Artifacts |
|---|---|---|
| **Hazard-Based Red Zones** | `aggregate_zone_risk.py`<br>`zone_risk_summary_v1.csv`<br>`red_zone_flag` | Groups real geocoded historical events (`positive_events_v1.csv`) by `(state, district)`. Computes `percent_high_or_critical` and flags districts where `zone_risk_level` is `HIGH` or `CRITICAL` as Red Zones. Centroids (`centroid_lat`, `centroid_lon`) provide spatial focus. |
| **Carrying Capacity Assessment** | `safer_relocation_sites_demo.csv`<br>`compute_relocation_plan.py`<br>`relocation_feasibility` | Evaluates verified safe relocation sites against habitation population requirements. Determines whether `total_relocation_capacity_families >= population_families`, flagging carrying feasibility as `FEASIBLE` or `INSUFFICIENT_CAPACITY`. |
| **Prioritized Relocation Needs** | `relocation_plan_v1.csv`<br>`priority` field | Classifies habitations into prioritized tiers: `CRITICAL` zones receive `IMMEDIATE` priority, `HIGH` zones receive `SHORT_TERM`, and remaining habitations receive `MEDIUM_TERM`. |
| **Interactive Spatial Map View** | Frontend Route `/red-zones`<br>`RedZonesRelocationPage.tsx` | Reuses existing Leaflet GIS map engine to render dual interactive layers: Red Zone hazard centroids with pulsed boundaries, and landslide-safe relocation shelters with layer toggles. |
| **Transparent API Access** | `GET /api/v1/red-zones`<br>`GET /api/v1/safer-sites` | Microservice and Node REST endpoints providing structured JSON representations of Red Zones and shelter carrying capacities for multi-agency interoperability. |

---

## 3. Data Flow & Execution Pipeline

```
[positive_events_v1.csv]
           │
           ▼
[aggregate_zone_risk.py] ────────► [zone_risk_summary_v1.csv]
                                                 │
[safer_relocation_sites_demo.csv]                │
           │                                     ▼
           └────────────────────────► [compute_relocation_plan.py]
                                                 │
                                                 ▼
                                     [relocation_plan_v1.csv]
                                                 │
                                                 ▼
                                   [FastAPI & Express Endpoints]
                                     /api/v1/red-zones
                                     /api/v1/safer-sites
                                                 │
                                                 ▼
                                   [Leaflet GIS Visualization]
                                   Route: /red-zones
```

---

## 4. Key Notes & Scalability Readiness

- **Demo & Mock Baselines**: Habitation population estimates (`total_points * 5` families proxy) and initial safer relocation sites are illustrative demo models created for rapid validation.
- **Production Census Integration**: The data contracts (`population_families`, `capacity_families`, `capacity_people`, `district`, `state`) are strictly defined to allow one-click drop-in integration with official Census data and District Disaster Management Authority (DDMA) shelter inventories.
- **Multi-Hazard Extensibility**: While the initial baseline leverages landslide event data, the aggregation pipeline and carrying capacity algorithms are hazard-agnostic and architecturally ready to ingest flood inundation layers, seismic microzonation, and cloudburst hazard indices.
