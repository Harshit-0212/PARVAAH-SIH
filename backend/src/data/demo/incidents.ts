import type { IncidentRecord } from '../../types/index.js';

const NOW_ISO = new Date().toISOString();

export const DEMO_INCIDENTS: IncidentRecord[] = [
  {
    id: 'INC-2026-081',
    title: 'Sevoke - Coronation Bridge Debris Flow',
    titleHi: 'सेवोके - कोरोनेशन ब्रिज मलबा बहाव',
    description: 'Massive mudslide and continuous boulder fall across 45 meters of NH-10 carriageway. Road bed partially compromised near pillar 14.',
    descriptionHi: 'राष्ट्रीय राजमार्ग 10 के 45 मीटर हिस्से पर भारी कीचड़ और लगातार गिरते विशाल पत्थर। खंभा 14 के पास सड़क का आधार क्षतिग्रस्त।',
    hazardType: 'LANDSLIDE',
    status: 'ACTIVE',
    verificationStatus: 'DEMO',
    severity: 'CRITICAL',
    confidence: 92,
    source: 'DEMO_DATA',
    isDemo: true,
    isLive: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: NOW_ISO,
    coordinates: {
      latitude: 26.9012,
      longitude: 88.4715
    },
    district: 'east_sikkim',
    state: 'Sikkim',
    roadStatus: 'CLOSED',
    rainfall24hMm: 184,
    forecastRainfall24hMm: 65,
    soilMoisturePercent: 93,
    slopeDegrees: 42,
    riskScore: 92,
    evacuationRecommendation: 'MANDATORY',
    officialEvacuationStatus: 'PREPARE_TO_EVACUATE',
    nearestShelterId: 'SHL-01',
    nearbyInfrastructure: ['Coronation Bridge Pillar 14', 'Sevoke Checkpost'],
    recommendedActions: [
      'Immediately divert heavy transport via Melli - Jorethang - Namchi corridor.',
      'Maintain 200-meter safety standoff from slope toe; recurring rockfall active.',
      'Alert Sevoke Bazaar residents for preventive evacuation to Gangtok Community Hall.'
    ],
    assignedAgency: 'Border Roads Organisation (Simulated Drill Unit)',
    assignedOfficer: 'Lt. Col. P. Gurung / Duty Officer (Demo)',
    dataFreshness: 'FRESH',
    timeline: [
      {
        time: '06:30 IST',
        author: 'Local PWD Checkpost',
        note: 'Initial tension crack observed on highway retaining structure.'
      },
      {
        time: '07:15 IST',
        author: 'Field Patrol Unit',
        note: 'Debris flow overtopped roadway. Heavy excavators mobilized.',
        statusChange: 'ACTIVE'
      }
    ],
    affectedGeometry: {
      type: 'Polygon',
      coordinates: [[
        [88.465, 26.896],
        [88.478, 26.897],
        [88.476, 26.906],
        [88.463, 26.904],
        [88.465, 26.896]
      ]]
    }
  },
  {
    id: 'INC-2026-082',
    title: 'Mawkdok Gorge Slope Subsidence',
    titleHi: 'मावदोक गॉर्ज ढलान धंसाव',
    description: 'Tension cracks widened to 18cm along road embankment following persistent downpour. Edge slumping observed.',
    descriptionHi: 'लगातार बारिश के बाद सड़क तटबंध के किनारे 18 सेमी तक दरारें चौड़ी हो गईं। किनारे का धंसाव देखा गया।',
    hazardType: 'SLOPE_CRACK',
    status: 'ACTIVE',
    verificationStatus: 'DEMO',
    severity: 'HIGH',
    confidence: 85,
    source: 'DEMO_DATA',
    isDemo: true,
    isLive: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: NOW_ISO,
    coordinates: {
      latitude: 25.3524,
      longitude: 91.8152
    },
    district: 'east_khasi',
    state: 'Meghalaya',
    roadStatus: 'PARTIALLY_BLOCKED',
    rainfall24hMm: 215,
    forecastRainfall24hMm: 45,
    soilMoisturePercent: 89,
    slopeDegrees: 38,
    riskScore: 84,
    evacuationRecommendation: 'ADVISORY',
    officialEvacuationStatus: 'PREPARE_TO_EVACUATE',
    nearestShelterId: 'SHL-02',
    nearbyInfrastructure: ['Mawkdok Viewpoint Bridge Bypass'],
    recommendedActions: [
      'Restrict vehicular traffic over Mawkdok bridge bypass to light passenger cars only.',
      'Deploy visual extensometer stakes along road shoulder to monitor creep rate.'
    ],
    assignedAgency: 'Meghalaya PWD & Civil Defense (Simulated)',
    assignedOfficer: 'Assistant Engineer J. Lyngdoh (Demo)',
    dataFreshness: 'FRESH',
    timeline: [
      {
        time: '04:45 IST',
        author: 'Night Highway Patrol',
        note: 'Subsidence step crack noticed across road shoulder.'
      }
    ],
    affectedGeometry: {
      type: 'Polygon',
      coordinates: [[
        [91.808, 25.348],
        [91.821, 25.349],
        [91.819, 25.358],
        [91.806, 25.355],
        [91.808, 25.348]
      ]]
    }
  },
  {
    id: 'INC-2026-083',
    title: 'Haflong Hill Cut Slope Failure',
    titleHi: 'हाफलोंग पहाड़ी कट ढलान विफलता',
    description: 'Slumping of uncemented sandstone strata onto Lumding-Badarpur railway approach and hill link road.',
    descriptionHi: 'लुमडिंग-बदरपुर रेलवे एप्रोच और पहाड़ी लिंक रोड पर बलुआ पत्थर की परतों का धंसाव।',
    hazardType: 'LANDSLIDE',
    status: 'ACTIVE',
    verificationStatus: 'DEMO',
    severity: 'CRITICAL',
    confidence: 90,
    source: 'DEMO_DATA',
    isDemo: true,
    isLive: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: NOW_ISO,
    coordinates: {
      latitude: 25.1782,
      longitude: 93.0189
    },
    district: 'dima_hasao',
    state: 'Assam',
    roadStatus: 'CLOSED',
    rainfall24hMm: 198,
    forecastRainfall24hMm: 72,
    soilMoisturePercent: 95,
    slopeDegrees: 46,
    riskScore: 94,
    evacuationRecommendation: 'MANDATORY',
    officialEvacuationStatus: 'PREPARE_TO_EVACUATE',
    nearestShelterId: 'SHL-03',
    nearbyInfrastructure: ['Lumding-Badarpur Hill Track', 'Haflong Water Reservoir'],
    recommendedActions: [
      'Halt uphill passenger convoy movement immediately.',
      'Establish geotechnical exclusion perimeter around railway cutting slope.'
    ],
    assignedAgency: 'Assam State Disaster Management Authority (Demo)',
    assignedOfficer: 'Field Officer D. Thaosen (Demo)',
    dataFreshness: 'FRESH',
    timeline: [
      {
        time: '03:15 IST',
        author: 'Track Sentry (Demo)',
        note: 'Rock debris falling on ballast. Slow orders issued.'
      }
    ]
  },
  {
    id: 'INC-2026-084',
    title: 'Dzükou Foothills Saturated Mud Run',
    titleHi: 'ज़ुको तलहटी संतृप्त कीचड़ बहाव',
    description: 'Debris tongue mobilized across culvert #8 on NH-29 bypass. Low velocity viscous flow.',
    descriptionHi: 'राष्ट्रीय राजमार्ग 29 बाईपास पर पुलिया #8 के पार मलबा बहाव।',
    hazardType: 'LANDSLIDE',
    status: 'ACTIVE',
    verificationStatus: 'DEMO',
    severity: 'MODERATE',
    confidence: 82,
    source: 'DEMO_DATA',
    isDemo: true,
    isLive: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: NOW_ISO,
    coordinates: {
      latitude: 25.6751,
      longitude: 94.1086
    },
    district: 'kohima',
    state: 'Nagaland',
    roadStatus: 'PARTIALLY_BLOCKED',
    rainfall24hMm: 178,
    forecastRainfall24hMm: 35,
    soilMoisturePercent: 88,
    slopeDegrees: 34,
    riskScore: 72,
    evacuationRecommendation: 'ADVISORY',
    officialEvacuationStatus: 'NO_ADVICE',
    nearestShelterId: 'SHL-05',
    nearbyInfrastructure: ['Culvert #8', 'NH-29 Bypass'],
    recommendedActions: [
      'Maintain single-lane shuttle convoy with police escort.',
      'Clear culvert inlet to avert road overtopping.'
    ],
    assignedAgency: 'Nagaland PWD & SDRF (Demo)',
    assignedOfficer: 'Inspector T. Jamir (Demo)',
    dataFreshness: 'FRESH',
    timeline: [
      {
        time: '05:00 IST',
        author: 'Highway Patrol',
        note: 'Slurry overflow noted at culvert intake.'
      }
    ]
  }
];
