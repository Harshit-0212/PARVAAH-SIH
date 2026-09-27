import type { RiskZoneFeature } from '../../types/index.js';

const NOW_ISO = new Date().toISOString();
const VALID_UNTIL_ISO = new Date(Date.now() + 24 * 3600000).toISOString();
const DISCLAIMER = 'This risk score is a prototype decision-support advisory. It is not an official warning or evacuation order. Follow instructions issued by authorized disaster-management authorities.';

export const DEMO_RISK_ZONES: { type: 'FeatureCollection'; metadata: any; features: RiskZoneFeature[] } = {
  type: 'FeatureCollection',
  metadata: {
    generatedAt: NOW_ISO,
    modelVersion: 'prototype-rule-based-v1',
    modelMode: 'DEMO_RULE_BASED',
    disclaimer: DISCLAIMER,
    isDemo: true,
    isLive: false
  },
  features: [
    {
      type: 'Feature',
      id: 'ZONE-SKM-01',
      properties: {
        zoneId: 'ZONE-SKM-01',
        zoneName: 'Sevoke - Teesta Escarpment Zone',
        riskScore: 92,
        riskLevel: 'CRITICAL',
        confidence: 94,
        modelVersion: 'prototype-rule-based-v1',
        modelMode: 'DEMO_RULE_BASED',
        calculatedAt: NOW_ISO,
        forecastValidUntil: VALID_UNTIL_ISO,
        contributingFactors: {
          rainfall24hContribution: 30.0,
          forecastRainfallContribution: 18.5,
          soilMoistureContribution: 19.2,
          slopeContribution: 14.1,
          historicalSusceptibilityContribution: 9.2,
          verifiedFieldReportsContribution: 5.0
        },
        affectedVillages: ['Sevoke Bazaar', 'Coronation Colony', 'Teesta Low Dam Environs'],
        affectedRoadSegments: ['NH-10 Km 12-18', 'Melli Link Road'],
        nearbyShelters: ['SHL-01 (Gangtok Govt Relief Center)'],
        recommendedAction: 'Proactive evacuation advisory for riverside settlements; total freight diversion.',
        disclaimer: DISCLAIMER,
        isDemo: true,
        isLive: false
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [88.455, 26.885],
          [88.485, 26.888],
          [88.482, 26.915],
          [88.450, 26.912],
          [88.455, 26.885]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'ZONE-MEG-02',
      properties: {
        zoneId: 'ZONE-MEG-02',
        zoneName: 'Mawkdok - Sohra Escarpment Belt',
        riskScore: 84,
        riskLevel: 'HIGH',
        confidence: 86,
        modelVersion: 'prototype-rule-based-v1',
        modelMode: 'DEMO_RULE_BASED',
        calculatedAt: NOW_ISO,
        forecastValidUntil: VALID_UNTIL_ISO,
        contributingFactors: {
          rainfall24hContribution: 28.5,
          forecastRainfallContribution: 16.0,
          soilMoistureContribution: 18.0,
          slopeContribution: 12.5,
          historicalSusceptibilityContribution: 8.0,
          verifiedFieldReportsContribution: 4.5
        },
        affectedVillages: ['Mawkdok Village', 'Laitryngew Edge Settlements'],
        affectedRoadSegments: ['NH-206 Shillong-Dawki Km 28-34'],
        nearbyShelters: ['SHL-02 (Cherrapunji Community Shelter)'],
        recommendedAction: 'Stage emergency rescue vehicles at Mawphlang; restrict evening transit.',
        disclaimer: DISCLAIMER,
        isDemo: true,
        isLive: false
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [91.800, 25.340],
          [91.835, 25.342],
          [91.830, 25.365],
          [91.795, 25.360],
          [91.800, 25.340]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'ZONE-ASM-03',
      properties: {
        zoneId: 'ZONE-ASM-03',
        zoneName: 'Haflong - Jatinga Ridge Slump Sector',
        riskScore: 88,
        riskLevel: 'CRITICAL',
        confidence: 89,
        modelVersion: 'prototype-rule-based-v1',
        modelMode: 'DEMO_RULE_BASED',
        calculatedAt: NOW_ISO,
        forecastValidUntil: VALID_UNTIL_ISO,
        contributingFactors: {
          rainfall24hContribution: 29.0,
          forecastRainfallContribution: 19.0,
          soilMoistureContribution: 19.5,
          slopeContribution: 13.5,
          historicalSusceptibilityContribution: 8.5,
          verifiedFieldReportsContribution: 4.8
        },
        affectedVillages: ['Jatinga Upper Ridge', 'Lower Haflong Railway Colony'],
        affectedRoadSegments: ['NH-54E Km 42-50'],
        nearbyShelters: ['SHL-03 (Haflong Indoor Stadium)'],
        recommendedAction: 'Direct vulnerable hillside households to designated community shelter.',
        disclaimer: DISCLAIMER,
        isDemo: true,
        isLive: false
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [93.005, 25.165],
          [93.035, 25.168],
          [93.030, 25.195],
          [92.998, 25.190],
          [93.005, 25.165]
        ]]
      }
    }
  ]
};
