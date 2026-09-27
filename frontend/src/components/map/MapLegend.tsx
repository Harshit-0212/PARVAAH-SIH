import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Info } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute bottom-4 left-4 z-20 max-w-xs w-full sm:w-72 bg-slate-900/95 text-white backdrop-blur-md rounded-xl border border-slate-700/80 shadow-2xl text-xs overflow-hidden pointer-events-auto">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-slate-800/80 hover:bg-slate-800 flex items-center justify-between font-bold text-slate-200 border-b border-slate-700/60 cursor-pointer transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-teal-400" />
          <span>Operational GIS Legend</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {/* Hazard Severity */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Hazard Severity
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-300 shrink-0"></span>
                <span>Critical Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-200 shrink-0"></span>
                <span>High Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-200 shrink-0"></span>
                <span>Moderate Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-200 shrink-0"></span>
                <span>Low Risk / Safe</span>
              </div>
            </div>
          </div>

          {/* Road Connectivity */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Road Connectivity Corridors
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-1 bg-emerald-500 rounded shrink-0"></span>
                <span>Open (Clear transit)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-1 bg-amber-500 border-b border-dashed border-white rounded shrink-0"></span>
                <span>Partially Blocked (Single lane)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-1.5 bg-red-600 rounded shrink-0"></span>
                <span>Closed / Blocked (Severe hazard)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-1 bg-slate-500 border-b border-dotted border-white rounded shrink-0"></span>
                <span>Unknown / Uninspected</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Markers */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Infrastructure & Field
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-600 border border-white shrink-0"></span>
                <span>Relief Shelter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-purple-600 border border-white shrink-0"></span>
                <span>Slope Inclinometer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-violet-600 border border-white shrink-0"></span>
                <span>Citizen Report</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-red-500 bg-red-500/20 shrink-0"></span>
                <span>Risk Zone Polygon</span>
              </div>
            </div>
          </div>

          {/* Data Trust & Verification */}
          <div className="pt-1 border-t border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-teal-400" />
              <span>Data Trust & Provenance</span>
            </div>
            <div className="space-y-1 text-[10px] text-slate-300">
              <div className="flex items-center justify-between">
                <span>Official Authority</span>
                <span className="text-emerald-400 font-mono font-bold">BRO / SDMA / PWD</span>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Risk Assessment</span>
                <span className="text-amber-300 font-mono font-bold">Advisory Only</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Citizen Reports</span>
                <span className="text-purple-300 font-mono font-bold">Under Verification</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Simulated Records</span>
                <span className="text-amber-400 font-mono font-bold">Demo Telemetry</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
