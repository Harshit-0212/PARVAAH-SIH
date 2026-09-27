import React from 'react';
import { GeoJSON } from 'react-leaflet';
import type { EvacuationZoneFeatureCollection } from '../../types';
import L from 'leaflet';

interface EvacuationZoneLayerProps {
  data: EvacuationZoneFeatureCollection | null;
}

export const EvacuationZoneLayer: React.FC<EvacuationZoneLayerProps> = ({ data }) => {
  if (!data || !data.features || data.features.length === 0) return null;

  const styleFeature = (feature?: GeoJSON.Feature) => {
    const status = (feature?.properties as any)?.status;
    let color = '#3B82F6';
    let fillColor = '#60A5FA';

    if (status === 'RESTRICTED_NO_ENTRY') {
      color = '#DC2626';
      fillColor = '#EF4444';
    } else if (status === 'SAFE_HAVEN') {
      color = '#10B981';
      fillColor = '#34D399';
    }

    return {
      color,
      weight: 2,
      opacity: 0.9,
      fillColor,
      fillOpacity: 0.25,
      dashArray: '5, 5'
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties as any;
    if (!props) return;

    const popupHtml = `
      <div class="p-1 max-w-xs font-sans text-slate-900">
        <div class="text-[10px] font-bold uppercase tracking-wide text-blue-700 mb-0.5">
          ${props.status.replace(/_/g, ' ')}
        </div>
        <h4 class="text-xs font-bold text-gray-900 mb-1">${props.name}</h4>
        <div class="text-[10px] text-gray-500">Zone ID: ${props.zoneId}</div>
        <div class="text-[9px] text-gray-400 mt-2 pt-1 border-t border-gray-100">
          Source: ${props.source}
        </div>
      </div>
    `;
    layer.bindPopup(popupHtml);
  };

  return (
    <GeoJSON
      key={`evacuation-zones-${data.features.length}`}
      data={data as any}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
};
