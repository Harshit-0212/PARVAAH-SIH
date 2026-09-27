import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface MapErrorStateProps {
  error: string | null;
  onRetry: () => void;
  onUseLocalDemo?: () => void;
  isUsingFallback?: boolean;
}

export const MapErrorState: React.FC<MapErrorStateProps> = ({
  error,
  onRetry,
  onUseLocalDemo,
  isUsingFallback
}) => {
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

  return (
    <div 
      className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white pointer-events-auto"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-4 max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">
            Unable to load map data from the backend.
          </h4>
          <p className="text-xs text-slate-300">
            The operational telemetry server is unreachable or timed out. Real-time hazard positions cannot be verified.
          </p>
        </div>

        {isDev && error && (
          <div className="w-full bg-black/50 border border-slate-800 rounded-lg p-3 text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              Diagnostic Details (Development Only):
            </span>
            <span className="text-xs font-mono text-red-300 break-all block">
              {error}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onRetry}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md shadow-teal-900/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>

          {onUseLocalDemo && !isUsingFallback && (
            <button
              onClick={onUseLocalDemo}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Local Demo Baseline</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
