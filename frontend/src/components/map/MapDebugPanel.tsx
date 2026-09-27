import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface MapDebugPanelProps {
  apiBaseUrl: string;
  dataMode: string;
  tileUrl: string;
  tileLoaded: boolean;
  tileError: string | null;
  incidentCount: number;
  riskZoneCount: number;
  roadCount: number;
  shelterCount: number;
  sensorCount: number;
  invalidCoordCount: number;
  lastFetchTime: string | null;
  backendHealth: 'CONNECTED' | 'ERROR' | 'OFFLINE';
  backendLatencyMs?: number;
}

export const MapDebugPanel: React.FC<MapDebugPanelProps> = ({
  apiBaseUrl,
  dataMode,
  tileUrl,
  tileLoaded,
  tileError,
  incidentCount,
  riskZoneCount,
  roadCount,
  shelterCount,
  sensorCount,
  invalidCoordCount,
  lastFetchTime,
  backendHealth,
  backendLatencyMs
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only active in development mode
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
  if (!isDev) return null;

  // Sanitize URLs to ensure no query strings or keys are exposed
  const sanitizeUrl = (raw: string) => {
    try {
      const u = new URL(raw);
      return `${u.protocol}//${u.host}${u.pathname}`;
    } catch {
      return raw.split('?')[0];
    }
  };

  return (
    <div className="absolute top-14 left-4 z-20 pointer-events-auto max-w-xs font-mono text-[11px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900/90 hover:bg-slate-900 text-teal-400 px-3 py-1.5 rounded-lg border border-slate-700 shadow-md flex items-center gap-1.5 cursor-pointer font-bold transition-colors"
        aria-expanded={isOpen}
      >
        <Bug className="w-3.5 h-3.5 text-teal-400" />
        <span>GIS Dev Inspector</span>
        {isOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="mt-2 bg-slate-950/95 text-slate-300 p-3 rounded-xl border border-slate-700/80 shadow-2xl space-y-2.5 backdrop-blur-md max-h-96 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400 uppercase font-bold text-[9px]">Telemetry Status</span>
            <span className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase ${
              backendHealth === 'CONNECTED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
              backendHealth === 'OFFLINE' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
              'bg-red-950 text-red-300 border border-red-700'
            }`}>
              {backendHealth} {backendLatencyMs !== undefined ? `(${backendLatencyMs}ms)` : ''}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 text-[10px]">API Base URL:</div>
            <div className="text-teal-300 truncate bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {sanitizeUrl(apiBaseUrl)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 text-[10px]">Configured Tile URL:</div>
            <div className="text-slate-300 truncate bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
              {sanitizeUrl(tileUrl)}
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              {tileError || !tileLoaded ? (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {tileError || 'Tile Load Pending'}
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Tile Layer Active
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800 text-[10px]">
            <div>Incidents: <span className="text-white font-bold">{incidentCount}</span></div>
            <div>Risk Zones: <span className="text-white font-bold">{riskZoneCount}</span></div>
            <div>Roads: <span className="text-white font-bold">{roadCount}</span></div>
            <div>Shelters: <span className="text-white font-bold">{shelterCount}</span></div>
            <div>Sensors: <span className="text-white font-bold">{sensorCount}</span></div>
            <div>Invalid Coords: <span className={invalidCoordCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>{invalidCoordCount}</span></div>
          </div>

          <div className="pt-1.5 border-t border-slate-800 text-[10px] space-y-0.5">
            <div>Data Mode: <span className="text-amber-300 font-bold uppercase">{dataMode}</span></div>
            <div className="text-slate-400 truncate">Last Sync: {lastFetchTime || 'Pending initial fetch'}</div>
          </div>
        </div>
      )}
    </div>
  );
};
