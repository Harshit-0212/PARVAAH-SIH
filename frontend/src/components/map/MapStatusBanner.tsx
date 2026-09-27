import React from 'react';
import { AlertTriangle, Radio, ShieldAlert } from 'lucide-react';

interface MapStatusBannerProps {
  dataMode?: 'demo' | 'live' | 'hybrid' | 'local_fallback';
  lastFetchTime?: string | null;
  isOffline?: boolean;
}

export const MapStatusBanner: React.FC<MapStatusBannerProps> = ({
  dataMode = 'demo',
  isOffline
}) => {
  if (isOffline) {
    return (
      <div className="bg-amber-600 text-white px-3 py-1.5 text-[11px] font-bold flex items-center justify-between gap-2 shadow-sm border-b border-amber-700">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>
            OFFLINE MODE — Map tiles unavailable offline; showing last cached operational data. Live sensor sync paused.
          </span>
        </div>
        <span className="bg-amber-800/80 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-black">
          Cached Data
        </span>
      </div>
    );
  }

  if (dataMode === 'local_fallback') {
    return (
      <div className="bg-amber-500 text-slate-950 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between gap-2 shadow-sm border-b border-amber-600">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-950" />
          <span>
            LOCAL DEMO FALLBACK — Telemetry server unreachable. Displaying local simulated emergency baseline.
          </span>
        </div>
        <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-black">
          Local Demo
        </span>
      </div>
    );
  }

  if (dataMode === 'live') {
    return (
      <div className="bg-emerald-700 text-white px-3 py-1.5 text-[11px] font-bold flex items-center justify-between gap-2 shadow-sm border-b border-emerald-800">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 shrink-0 animate-pulse text-emerald-300" />
          <span>
            LIVE MODE — Real-time telemetry feed. Check source and timestamp on each record.
          </span>
        </div>
        <span className="bg-emerald-900 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-black">
          Live Feed
        </span>
      </div>
    );
  }

  if (dataMode === 'hybrid') {
    return (
      <div className="bg-blue-700 text-white px-3 py-1.5 text-[11px] font-bold flex items-center justify-between gap-2 shadow-sm border-b border-blue-800">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 shrink-0 text-blue-300" />
          <span>
            HYBRID MODE — Live meteorological telemetry & simulated drill incidents identified individually.
          </span>
        </div>
        <span className="bg-blue-900 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-black">
          Hybrid
        </span>
      </div>
    );
  }

  // Default: demo
  return (
    <div className="bg-slate-900 text-amber-400 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between gap-2 shadow-sm border-b border-slate-800">
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        <span>
          DEMO MODE — Simulated operational data. Not an official IMD warning or evacuation order.
        </span>
      </div>
      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-black">
        Simulated
      </span>
    </div>
  );
};
