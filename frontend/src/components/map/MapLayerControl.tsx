import React from 'react';
import { Layers } from 'lucide-react';

export interface LayerVisibilityState {
  incidents: boolean;
  riskZones: boolean;
  roads: boolean;
  shelters: boolean;
  sensors: boolean;
  citizenReports: boolean;
  evacuationZones: boolean;
  weatherOverlay: boolean;
}

interface MapLayerControlProps {
  layers: LayerVisibilityState;
  onChange: (key: keyof LayerVisibilityState, val: boolean) => void;
  counts?: {
    incidents?: number;
    riskZones?: number;
    roads?: number;
    shelters?: number;
    sensors?: number;
    citizenReports?: number;
  };
}

export const MapLayerControl: React.FC<MapLayerControlProps> = ({
  layers,
  onChange,
  counts = {}
}) => {
  return (
    <div className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg flex flex-wrap items-center gap-3 text-xs pointer-events-auto">
      <div className="flex items-center gap-1.5 font-bold text-slate-200 border-r border-slate-700 pr-2.5">
        <Layers className="w-3.5 h-3.5 text-teal-400" />
        <span className="hidden sm:inline">Layers</span>
      </div>

      <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
        <input
          type="checkbox"
          checked={layers.incidents}
          onChange={(e) => onChange('incidents', e.target.checked)}
          className="rounded text-red-600 focus:ring-0 cursor-pointer"
        />
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          <span>Incidents {counts.incidents !== undefined ? `(${counts.incidents})` : ''}</span>
        </span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
        <input
          type="checkbox"
          checked={layers.riskZones}
          onChange={(e) => onChange('riskZones', e.target.checked)}
          className="rounded text-orange-500 focus:ring-0 cursor-pointer"
        />
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-orange-500"></span>
          <span>Risk Zones {counts.riskZones !== undefined ? `(${counts.riskZones})` : ''}</span>
        </span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
        <input
          type="checkbox"
          checked={layers.roads}
          onChange={(e) => onChange('roads', e.target.checked)}
          className="rounded text-amber-500 focus:ring-0 cursor-pointer"
        />
        <span className="flex items-center gap-1">
          <span className="w-3 h-1 bg-amber-500 rounded"></span>
          <span>Roads {counts.roads !== undefined ? `(${counts.roads})` : ''}</span>
        </span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
        <input
          type="checkbox"
          checked={layers.shelters}
          onChange={(e) => onChange('shelters', e.target.checked)}
          className="rounded text-teal-500 focus:ring-0 cursor-pointer"
        />
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          <span>Shelters {counts.shelters !== undefined ? `(${counts.shelters})` : ''}</span>
        </span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
        <input
          type="checkbox"
          checked={layers.sensors}
          onChange={(e) => onChange('sensors', e.target.checked)}
          className="rounded text-purple-500 focus:ring-0 cursor-pointer"
        />
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-purple-500"></span>
          <span>Sensors {counts.sensors !== undefined ? `(${counts.sensors})` : ''}</span>
        </span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
        <input
          type="checkbox"
          checked={layers.citizenReports}
          onChange={(e) => onChange('citizenReports', e.target.checked)}
          className="rounded text-violet-500 focus:ring-0 cursor-pointer"
        />
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-500"></span>
          <span>Reports {counts.citizenReports !== undefined ? `(${counts.citizenReports})` : ''}</span>
        </span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
        <input
          type="checkbox"
          checked={layers.evacuationZones}
          onChange={(e) => onChange('evacuationZones', e.target.checked)}
          className="rounded text-blue-500 focus:ring-0 cursor-pointer"
        />
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-blue-500"></span>
          <span>Evacuation</span>
        </span>
      </label>
    </div>
  );
};
