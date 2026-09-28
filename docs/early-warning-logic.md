# PARVAAH • Hyper-Local Flash Flood Early Warning System (EWS) Logic

This document specifies the rule-based flood risk formulation, threshold classifications, lead time calculations, and data pipeline contracts implemented for the PARVAAH Smart India Hackathon platform.

---

## 1. Risk Score Formulation

The hyper-local composite flood risk score is calculated on a scale of **0 to 100**:

$$\text{Risk Score} = \min\left(100, S_{\text{rain24h}} + S_{\text{forecast6h}} + S_{\text{slope}} + S_{\text{dist}} + S_{\text{history}}\right)$$

Where:
- **$S_{\text{rain24h}}$ (Antecedent Soil Saturation)**:
  $$\min\left(\frac{\text{rainfall\_24h}}{100}, 30\right)$$
- **$S_{\text{forecast6h}}$ (Imminent Precipitation Trigger)**:
  $$\min\left(\frac{\text{rainfall\_forecast\_6h}}{50}, 30\right)$$
- **$S_{\text{slope}}$ (Terrain Pooling Potential)**:
  $$\min\left(\frac{\text{slope}}{10}, 15\right)$$
- **$S_{\text{dist}}$ (Proximity to River / Drainage Stream)**:
  $$\max\left(0, 10 - \text{dist\_to\_stream}\right)$$
- **$S_{\text{history}}$ (Historical Flood Recurrence from INDOFLOODS)**:
  $$\min\left(\text{historical\_flood\_count} \times 2, 15\right)$$

---

## 2. Risk Classification Thresholds

| Risk Score Range | Category | Color Hex | Advisory Action Level |
|---|---|---|---|
| **$\ge 70$** | **Very High** | `#ef4444` | Immediate Evacuation / Relocation to Safe Relief Center |
| **$50 - 69.99$** | **High** | `#f97316` | High Alert / Evacuate Low-Lying Stream Corridors |
| **$30 - 49.99$** | **Medium** | `#eab308` | Moderate Alert / Avoid Unpaved Corridors & Monitor Gauges |
| **$< 30$** | **Low** | `#10b981` | Normal Vigilance / Regular Monitoring |

---

## 3. Lead Time Estimation

Lead time is derived from the precipitating weather forecast window crossing critical thresholds:
- If `rainfall_forecast_6h > 50mm` $\implies$ **6 hours** (Rapid flash flooding trigger)
- Else if `rainfall_forecast_24h > 100mm` $\implies$ **24 hours**
- Else $\implies$ **24 hours**

---

## 4. Endpoints

- `GET /api/wards/risk`: Computes and retrieves all ward flood risks and scores.
- `GET /api/alerts`: Retrieves active actionable warnings (`High` and `Very High` wards).
- `GET /api/ward/:id`: Fetches detailed hazard parameters and evacuation routes for a specific ward.
