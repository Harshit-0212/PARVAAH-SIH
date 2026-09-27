export const DEMO_ROADS_GEOJSON = {
  type: 'FeatureCollection' as const,
  metadata: {
    generatedAt: new Date().toISOString(),
    source: 'DEMO_DATA',
    isDemo: true,
    isLive: false
  },
  features: [
    {
      type: 'Feature' as const,
      id: 'RD-NH10',
      properties: {
        roadId: 'RD-NH10',
        name: 'National Highway 10 (Siliguri - Gangtok)',
        status: 'CLOSED',
        condition: 'Severe mudslide at Coronation Bridge. Heavy boulder debris blocking both lanes.',
        clearanceEta: '3 hours',
        detourAdvice: 'Use Melli - Jorethang - Namchi single lane bypass.',
        district: 'east_sikkim',
        state: 'Sikkim',
        lengthKm: 114,
        source: 'DEMO_DATA',
        isDemo: true
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [88.421, 26.850],
          [88.450, 26.885],
          [88.471, 26.901],
          [88.512, 26.980],
          [88.580, 27.150],
          [88.610, 27.330]
        ]
      }
    },
    {
      type: 'Feature' as const,
      id: 'RD-SHILLONG-DAWKI',
      properties: {
        roadId: 'RD-NH206',
        name: 'NH-206 (Shillong - Dawki - Tamabil)',
        status: 'PARTIALLY_BLOCKED',
        condition: 'Tension cracks and pavement subsidence near Mawkdok gorge.',
        clearanceEta: 'Restricted to light vehicles only',
        detourAdvice: 'Heavy vehicles halted at Mawphlang junction.',
        district: 'east_khasi',
        state: 'Meghalaya',
        lengthKm: 82,
        source: 'DEMO_DATA',
        isDemo: true
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [91.880, 25.570],
          [91.840, 25.460],
          [91.815, 25.352],
          [91.890, 25.240],
          [92.020, 25.180]
        ]
      }
    },
    {
      type: 'Feature' as const,
      id: 'RD-HAFLONG-LINK',
      properties: {
        roadId: 'RD-NH54E',
        name: 'NH-54E Haflong - Lumding Hill Highway',
        status: 'CLOSED',
        condition: 'Slope cut slump covering 60m road span near Jatinga.',
        clearanceEta: 'Clearing team deployed with 2 excavators',
        detourAdvice: 'No viable heavy detour available; travel suspended.',
        district: 'dima_hasao',
        state: 'Assam',
        lengthKm: 98,
        source: 'DEMO_DATA',
        isDemo: true
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [93.180, 25.750],
          [93.090, 25.480],
          [93.018, 25.178],
          [92.950, 25.020]
        ]
      }
    },
    {
      type: 'Feature' as const,
      id: 'RD-NH29',
      properties: {
        roadId: 'RD-NH29',
        name: 'NH-29 Kohima - Dimapur Highway',
        status: 'OPEN',
        condition: 'Passable with caution; small scree patches cleared.',
        clearanceEta: 'Normal transit',
        detourAdvice: 'None needed.',
        district: 'kohima',
        state: 'Nagaland',
        lengthKm: 74,
        source: 'DEMO_DATA',
        isDemo: true
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [93.720, 25.900],
          [93.910, 25.780],
          [94.108, 25.675]
        ]
      }
    }
  ]
};
