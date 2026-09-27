import React from 'react';
import type { LandslideIncident, SlopeSensor, Shelter, RoadStatus, Language, CitizenReportRecord } from '../../types';
import { INITIAL_INCIDENTS } from '../../data/mockData';
import { DisasterMap } from '../map/DisasterMap';

interface GisMapProps {
  incidents: LandslideIncident[];
  sensors: SlopeSensor[];
  shelters: Shelter[];
  roads: RoadStatus[];
  selectedDistrict: string;
  lang: Language;
  onSelectIncident: (incident: LandslideIncident) => void;
  onSelectShelter?: (shelter: Shelter) => void;
  onSelectSensor?: (sensor: SlopeSensor) => void;
  citizenReports?: CitizenReportRecord[];
}


/**
 * Normalize an incident from the API or map marker into a rich LandslideIncident
 * so the existing 14-section IncidentDetailDrawer receives all expected fields.
 */
function normalizeToLandslideIncident(
  raw: any,
  existingIncidents: LandslideIncident[]
): LandslideIncident {
  const match =
    existingIncidents.find((i) => i.id === raw.id) ||
    INITIAL_INCIDENTS.find((i) => i.id === raw.id);

  if (match) {
    return {
      ...match,
      severity: raw.severity || match.severity,
      riskLevel: raw.severity || match.riskLevel,
      status: raw.status || match.status,
      roadStatus:
        raw.roadStatus === 'CLOSED'
          ? 'BLOCKED'
          : raw.roadStatus === 'PARTIALLY_BLOCKED'
          ? 'SINGLE_LANE'
          : raw.roadStatus || match.roadStatus,
      updatedAt: raw.updatedAt || match.updatedAt,
      source: raw.source || match.source
    };
  }

  const lat =
    raw.coordinates?.latitude ??
    (Array.isArray(raw.coordinates) ? raw.coordinates[0] : 26.2);
  const lng =
    raw.coordinates?.longitude ??
    (Array.isArray(raw.coordinates) ? raw.coordinates[1] : 92.5);

  return {
    id: raw.id || `INC-${Date.now()}`,
    hazardType: String(raw.hazardType || 'landslide').toLowerCase() as any,
    title: raw.title || 'Disaster Hazard Incident',
    titleHi: raw.titleHi || raw.title,
    locationName: raw.locationName || `${raw.district || 'Regional'} Corridor`,
    locationNameHi: raw.locationNameHi || raw.locationName || 'क्षेत्रीय गलियारा',
    description: raw.description || 'Hazard reported along highway corridor.',
    descriptionHi: raw.descriptionHi || raw.description || 'कॉरिडोर पर आपदा की सूचना।',
    status: (raw.status || 'ACTIVE') as any,
    verificationStatus: (raw.verificationStatus || 'OFFICIALLY_VERIFIED') as any,
    severity: (raw.severity || 'HIGH') as any,
    riskLevel: (raw.severity || 'HIGH') as any,
    confidence: raw.confidence || 88,
    source: raw.source || 'PARVAAH Operational Gateway',
    isDemo: raw.isDemo ?? true,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    freshness: raw.dataFreshness || 'FRESH',
    coordinates: [lat, lng],
    latitude: lat,
    longitude: lng,
    district: raw.district || 'all',
    state: raw.state || 'North East India',
    roadId: raw.roadId || 'RD-NH',
    roadName: raw.roadName || 'Regional Highway Corridor',
    roadStatus:
      raw.roadStatus === 'CLOSED'
        ? 'BLOCKED'
        : raw.roadStatus === 'PARTIALLY_BLOCKED'
        ? 'SINGLE_LANE'
        : 'OPEN',
    clearanceEta: raw.clearanceEta || 'In Progress',
    rainfall24h: raw.rainfall24hMm || raw.rainfall24h || 120,
    rainfallForecast: raw.rainfallForecast || 'Heavy intermittent downpours',
    soilMoisture: raw.soilMoisturePercent || raw.soilMoisture || 80,
    slope: raw.slopeDegrees || raw.slope || 35,
    evacuationLevel: raw.evacuationRecommendation || 'ADVISORY',
    evacuationOrderStatus: (raw.officialEvacuationStatus || 'PREPARE') as any,
    nearestShelterId: raw.nearestShelterId || 'SHL-01',
    affectedVillagesCount: raw.affectedVillagesCount || 3,
    affectedPopulationEstimate: raw.affectedPopulationEstimate || 500,
    recommendedActions: raw.recommendedActions || ['Maintain standoff distance; follow emergency broadcast.'],
    assignedAgency: raw.assignedAgency || 'District Emergency Operations Center',
    assignedOfficer: raw.assignedOfficer || 'Officer-in-Charge',
    timeline: raw.timeline || [
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: 'EOC Triage',
        note: 'Incident logged in operational queue'
      }
    ],
    reportedAt: raw.reportedAt || 'Recent',
    verifiedBy: raw.verifiedBy || 'EOC Telemetry Unit',
    reporterRole: 'field_officer',
    citizenReportCount: raw.citizenReportCount || 1
  };
}

export const GisMap: React.FC<GisMapProps> = ({
  incidents,
  shelters: _shelters,
  selectedDistrict,
  lang,
  onSelectIncident,
  onSelectShelter,
  citizenReports
}) => {
  return (
    <div className="w-full">
      <DisasterMap
        selectedDistrict={selectedDistrict}
        lang={lang}
        citizenReportsProp={citizenReports}
        onSelectIncident={(rawInc) => {

          const normalized = normalizeToLandslideIncident(rawInc, incidents);
          onSelectIncident(normalized);
        }}
        onSelectShelter={(rawShelter) => {
          if (onSelectShelter) {
            const matched = _shelters.find((s) => s.id === rawShelter.id) || _shelters[0];
            onSelectShelter(matched);
          }
        }}
      />
    </div>
  );
};

export default GisMap;
