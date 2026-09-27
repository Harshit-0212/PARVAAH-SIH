import React from 'react';
import { GeoJSON } from 'react-leaflet';
import type { RiskZoneFeatureCollection } from '../../types';
import L from 'leaflet';

interface RiskZoneLayerProps {
  data: RiskZoneFeatureCollection | null;
  onSelectZone?: (zoneProps: any) => void;
}

export const RiskZoneLayer: React.FC<RiskZoneLayerProps> = ({ data, onSelectZone }) => {
  if (!data || !data.features || data.features.length === 0) return null;

  const styleFeature = (feature?: GeoJSON.Feature) => {
    const riskLevel = (feature?.properties as any)?.riskLevel;
    let color = '#F59E0B'; // default moderate
    let fillColor = '#F59E0B';

    if (riskLevel === 'CRITICAL') {
      color = '#DC2626';
      fillColor = '#EF4444';
    } else if (riskLevel === 'HIGH') {
      color = '#EA580C';
      fillColor = '#F97316';
    } else if (riskLevel === 'LOW') {
      color = '#16A34A';
      fillColor = '#22C55E';
    }

    return {
      color,
      weight: 2,
      opacity: 0.85,
      fillColor,
      fillOpacity: 0.25,
      dashArray: '4, 4'
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties as any;
    if (!props) return;

    let factorsList: string[] = [];

    if (Array.isArray(props.contributingFactors)) {
      factorsList = props.contributingFactors.map((f: any) => {
        const factorName = f.factor || f.name || 'Factor';
        const impactVal = f.impact || (f.weight ? `${f.weight}` : '');
        return `<li class="text-[10px] text-gray-600 flex justify-between py-0.5"><span>${factorName}</span><span class="font-bold text-gray-800">${impactVal}</span></li>`;
      });
    } else if (props.contributingFactors && typeof props.contributingFactors === 'object') {
      factorsList = Object.entries(props.contributingFactors).map(([key, val]: [string, any]) => {
        const humanKey = key
          .replace(/Contribution$/, '')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();

        let displayVal = '';
        if (typeof val === 'number') {
          displayVal = `${val}%`;
        } else if (val && typeof val === 'object') {
          displayVal = val.contribution !== undefined ? `${val.contribution}%` : `${val.value ?? ''}`;
        } else {
          displayVal = String(val ?? '');
        }

        return `<li class="text-[10px] text-gray-600 flex justify-between py-0.5"><span>${humanKey}</span><span class="font-bold text-gray-800">${displayVal}</span></li>`;
      });
    }

    const contributingList = factorsList.join('');
    const zoneTitle = props.zoneName || props.title || `Risk Zone ${props.zoneId || ''}`;

    const popupHtml = `
      <div class="p-1 max-w-xs font-sans text-slate-900">
        <div class="flex items-center justify-between border-b border-gray-100 pb-1 mb-1.5">
          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            props.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
            props.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
            props.riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800' :
            'bg-amber-100 text-amber-800'
          }">${props.riskLevel || 'MODERATE'} RISK (${props.riskScore ?? 50}/100)</span>
          <span class="text-[10px] text-gray-400 font-mono">${props.zoneId || ''}</span>
        </div>

        <h4 class="text-xs font-bold text-gray-900 mb-1">${zoneTitle}</h4>
        <div class="text-[10px] text-teal-700 font-semibold mb-1">Model: ${props.modelVersion || 'v2.4 Prototype'} (Confidence: ${props.confidence ?? 85}%)</div>

        ${contributingList ? `
          <div class="bg-gray-50 rounded-lg p-2 my-1.5 border border-gray-100">
            <span class="text-[9px] font-bold text-gray-500 uppercase block mb-1">Contributing Factors:</span>
            <ul class="divide-y divide-gray-100">${contributingList}</ul>
          </div>
        ` : ''}

        ${props.recommendedAction ? `
          <div class="text-[11px] text-gray-700 my-1">
            <span class="font-bold">Recommended Action:</span> ${props.recommendedAction}
          </div>
        ` : ''}

        <div class="mt-2 pt-1.5 border-t border-amber-200/80 bg-amber-50/80 rounded p-1.5 text-[9px] text-amber-900 font-semibold leading-tight">
          ⚠️ <strong>Advisory Notice:</strong> Prototype AI decision-support advisory — not an official warning or evacuation order.
        </div>
      </div>
    `;

    layer.bindPopup(popupHtml);

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({ fillOpacity: 0.45, weight: 3 });
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(styleFeature(feature));
      },
      click: () => {
        if (onSelectZone) onSelectZone(props);
      }
    });
  };

  return (
    <GeoJSON
      key={`risk-zones-${data.features.length}`}
      data={data as any}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
};
