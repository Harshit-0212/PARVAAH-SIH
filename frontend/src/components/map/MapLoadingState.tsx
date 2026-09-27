import React from 'react';
import { Compass } from 'lucide-react';

interface MapLoadingStateProps {
  message?: string;
}

export const MapLoadingState: React.FC<MapLoadingStateProps> = ({
  message = 'Loading operational map data…'
}) => {
  return (
    <div 
      className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white pointer-events-auto skeleton-radar-grid"
      role="status"
      aria-live="polite"
    >
      {/* Top placeholder pills */}
      <div className="absolute top-3 left-4 right-4 flex justify-between items-center opacity-60">
        <div className="flex gap-2">
          <div className="h-7 w-28 skeleton-shimmer-dark rounded-lg"></div>
          <div className="h-7 w-32 skeleton-shimmer-dark rounded-lg"></div>
          <div className="h-7 w-24 skeleton-shimmer-dark rounded-lg"></div>
        </div>
        <div className="h-7 w-20 skeleton-shimmer-dark rounded-lg"></div>
      </div>

      {/* Center Radar Scanner */}
      <div className="relative flex flex-col items-center space-y-4 max-w-md text-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border border-teal-500/40 animate-ping absolute"></div>
          <div className="w-14 h-14 rounded-full border border-teal-400 bg-teal-950/60 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-500/30">
            <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-sm font-black text-white tracking-wide uppercase font-mono text-teal-300">
            {message}
          </h4>
          <p className="text-xs text-slate-300">
            Connecting to North East Region GIS Gateway. Synchronizing incidents, road closures, and sensor hubs.
          </p>
        </div>

        {/* Telemetry connection status indicator */}
        <div className="w-full bg-slate-950 rounded-lg p-2.5 border border-slate-800 space-y-1.5 text-[11px] font-mono text-left">
          <div className="flex justify-between items-center text-slate-400">
            <span>Sikkim (NH-10 / Sevoke):</span>
            <span className="text-teal-400 font-bold animate-pulse">Connecting...</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Meghalaya (Mawkdok Corridor):</span>
            <span className="text-teal-400 font-bold animate-pulse">Syncing...</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Nagaland (NH-29 Dzükou):</span>
            <span className="text-teal-400 font-bold animate-pulse">Verifying...</span>
          </div>
        </div>
      </div>

      {/* Bottom corner legend skeleton */}
      <div className="absolute bottom-4 left-4 opacity-50 hidden sm:block">
        <div className="w-48 h-24 skeleton-shimmer-dark rounded-xl border border-slate-800"></div>
      </div>
    </div>
  );
};
