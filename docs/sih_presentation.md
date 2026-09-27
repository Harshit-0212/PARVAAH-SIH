# Smart India Hackathon (SIH26191) Problem Alignment & Mapping

## Problem Statement
> **SIH26191**: Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations in the North Eastern Region.

---

## 1. Core Challenge Alignment

| SIH26191 Requirement | PARVAAH Solution Component | Implementation Location |
|---|---|---|
| **Intelligent Red Zone Identification** | Multi-factor terrain risk model & XGBoost classification | `backend/src/services/` & `ml-service/` |
| **Carrying Capacity Assessment** | Environmental & slope stress metrics combined with settlement density | `frontend/src/pages/RedZonesRelocationPage.tsx` |
| **Immediate Relocation Needs** | Priority rank algorithm considering vulnerability, slope, and shelter distance | `frontend/src/pages/RiskSimulatorPage.tsx` |
| **Field Ground Reporting** | Offline-capable mobile reporting with GPS coordinates & image capture | `frontend/src/components/ReportModal.tsx` |
| **Administrative Decision Support** | Role-gated dashboard (Citizen, Field Officer, District Admin) | `frontend/src/pages/DashboardPage.tsx` |

---

## 2. Key Differentiators
1. **Zero-Fabrication Data Governance**: Strict distinction between verified live telemetry and simulated drill data via runtime visual badges.
2. **Offline-First Resiliency**: Field officers in remote Himalayan valleys can submit reports without connectivity; reports automatically sync when online.
3. **Transparent Risk Engine**: Complete explainability of risk scores with visible factor weights, avoiding black-box panic decisions.
