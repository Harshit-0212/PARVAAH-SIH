import React from 'react';
import { GeoJSON } from 'react-leaflet';
import type { RoadFeatureCollection } from '../../types';
import L from 'leaflet';

interface RoadLayerProps {
  data: RoadFeatureCollection | null;
}

export const RoadLayer: React.FC<RoadLayerProps> = ({ data }) => {
  if (!data || !data.features || data.features.length === 0) return null;

  const styleFeature = (feature?: GeoJSON.Feature) => {
    const status = (feature?.properties as any)?.status;
    let color = '#6B7280'; // gray unknown
    let weight = 3;
    let dashArray: string | undefined = undefined;

    if (status === 'OPEN') {
      color = '#10B981'; // green solid
      weight = 4;
    } else if (status === 'PARTIALLY_BLOCKED') {
      color = '#F59E0B'; // orange dashed
      weight = 4;
      dashArray = '6, 6';
    } else if (status === 'CLOSED') {
      color = '#EF4444'; // red thick
      weight = 5;
      dashArray = '8, 4';
    } else {
      dashArray = '4, 4';
    }

    return {
      color,
      weight,
      opacity: 0.9,
      dashArray,
      lineCap: 'round' as const,
      lineJoin: 'round' as const
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties as any;
    if (!props) return;

    const popupHtml = `
      <div class="p-1 max-w-xs font-sans text-slate-900">
        <div class="flex items-center justify-between border-b border-gray-100 pb-1 mb-1.5">
          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            props.status === 'CLOSED' ? 'bg-red-100 text-red-800' :
            props.status === 'PARTIALLY_BLOCKED' ? 'bg-orange-100 text-orange-800' :
            props.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' :
            'bg-gray-100 text-gray-800'
          }">${props.status.replace('_', ' ')}</span>
          <span class="text-[10px] text-gray-400 font-mono">${props.roadCode || props.id}</span>
        </div>

        <h4 class="text-xs font-bold text-gray-900 mb-1">${props.name}</h4>

        <div class="space-y-1 text-[11px] text-gray-600 mb-2">
          ${props.clearanceProgress !== undefined ? `
            <div>
              <div class="flex justify-between text-[10px] font-semibold text-gray-600 mb-0.5">
                <span>Clearance Progress:</span>
                <span>${props.clearanceProgress}%</span>
              </div>
              <div class="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div class="bg-teal-600 h-1.5" style="width: ${props.clearanceProgress}%"></div>
              </div>
            </div>
          ` : ''}

          ${props.clearanceEta ? `
            <div class="text-[10px]"><span class="font-semibold text-gray-800">Clearance ETA:</span> ${props.clearanceEta}</div>
          ` : ''}

          ${props.detourRouteName ? `
            <div class="text-[10px] bg-teal-50 p-1.5 rounded border border-teal-100 text-teal-900">
              <span class="font-bold">Detour:</span> ${props.detourRouteName}
            </div>
          ` : ''}

          ${props.criticalBridges && props.criticalBridges.length > 0 ? `
            <div class="text-[10px]"><span class="font-semibold text-gray-700">Key Spans:</span> ${props.criticalBridges.join(', ')}</div>
          ` : ''}

          <div class="text-[9px] text-gray-400 pt-1 border-t border-gray-100 flex justify-between">
            <span>Source: ${props.source || 'Regional Highway Authority'}</span>
            <span>${props.lastInspected ? `Inspected: ${props.lastInspected}` : ''}</span>
          </div>
        </div>
      </div>
    `;

    layer.bindPopup(popupHtml);

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({ weight: 6, opacity: 1 });
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(styleFeature(feature));
      }
    });
  };

  return (
    <GeoJSON
      key={`roads-${data.features.length}`}
      data={data as any}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
};
