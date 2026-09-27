import React from 'react';
import { WifiOff, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import type { SystemMode, Language } from '../types';
import { dictionary } from '../data/translations';

interface StateIndicatorBarProps {
  systemMode: SystemMode;
  setSystemMode: (mode: SystemMode) => void;
  lang: Language;
  isOffline: boolean;
  setIsOffline: (off: boolean) => void;
  successToast: string | null;
  setSuccessToast: (msg: string | null) => void;
  onOpenScenarioSimulator?: () => void;
  activeScenario?: any;
}

export const StateIndicatorBar: React.FC<StateIndicatorBarProps> = ({
  systemMode,
  setSystemMode,
  lang,
  isOffline,
  setIsOffline,
  successToast,
  setSuccessToast,
  onOpenScenarioSimulator,
  activeScenario
}) => {
  const t = dictionary[lang];

  return (
    <div className="sticky top-0 z-40 bg-[#1F2937] text-white border-b border-gray-800 text-xs py-1.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: State Switcher Demo Pills for reviewers */}
        <div className="flex items-center space-x-2">
          <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{t.testerTitle}</span>
          </span>

          <div className="flex items-center space-x-1 bg-gray-800 p-0.5 rounded border border-gray-700">
            <button
              onClick={() => { setSystemMode('live'); setIsOffline(false); }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                systemMode === 'live' && !isOffline ? 'bg-[#0F766E] text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.stateLive}
            </button>
            <button
              onClick={() => setSystemMode('skeleton')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                systemMode === 'skeleton' ? 'bg-[#0F766E] text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.stateSkeleton}
            </button>
            <button
              onClick={() => { setIsOffline(!isOffline); setSystemMode(isOffline ? 'live' : 'offline'); }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                isOffline ? 'bg-amber-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {isOffline ? t.stateOfflineOn : t.stateOfflineSim}
            </button>
            <button
              onClick={() => setSystemMode('error')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                systemMode === 'error' ? 'bg-red-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.stateErrorAlert}
            </button>
            {onOpenScenarioSimulator && (
              <button
                onClick={onOpenScenarioSimulator}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                  activeScenario?.isActive 
                    ? 'bg-purple-600 text-white' 
                    : 'text-purple-300 hover:text-white hover:bg-gray-700'
                }`}
                title="Classroom Disaster Drill Scenario Simulator"
              >
                Drill Sim
              </button>
            )}
          </div>
        </div>

        {/* Right: Explicit Connection Status Banner & Truthful Data Source Badge */}
        <div className="flex items-center space-x-3 text-[11px]">
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded border font-mono text-[10px] font-bold ${
            isOffline 
              ? 'bg-amber-950/80 text-amber-200 border-amber-600' 
              : systemMode === 'skeleton'
              ? 'bg-blue-950/80 text-blue-200 border-blue-600'
              : 'bg-emerald-950/80 text-emerald-200 border-emerald-600'
          }`}>
            <WifiOff className={`w-3 h-3 shrink-0 ${isOffline ? 'text-amber-400 animate-pulse' : 'hidden'}`} />
            <span>
              {isOffline
                ? 'OFFLINE — Showing last available data. New reports will be queued and sent when connection returns.'
                : systemMode === 'skeleton'
                ? 'LIMITED CONNECTION — Some data may be outdated. Check timestamps before acting.'
                : 'ONLINE — Latest data is being synchronized.'}
            </span>
          </div>

          <div className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
            activeScenario?.isActive
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-700/60 text-slate-300 border border-slate-600'
          }`}>
            <AlertTriangle className={`w-3 h-3 shrink-0 ${activeScenario?.isActive ? 'text-purple-400' : 'text-amber-400'}`} />
            <span>
              {activeScenario?.isActive
                ? 'SIMULATED SCENARIO — College demonstration only'
                : 'DEMO / RESEARCH DATA — Source: PARVAAH Live Simulator'}
            </span>
          </div>
        </div>

      </div>

      {/* Floating Success Toast Alert */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2F855A] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-400 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="text-xs font-semibold">{successToast}</div>
          <button 
            onClick={() => setSuccessToast(null)} 
            className="text-emerald-200 hover:text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Persistent Error State Banner when in Error Mode */}
      {systemMode === 'error' && (
        <div className="bg-red-900 text-white px-4 py-2 text-xs flex items-center justify-between border-t border-red-700">
          <div className="flex items-center space-x-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
            <span>{t.errorTitle}: {t.errorDesc}</span>
          </div>
          <button
            onClick={() => setSystemMode('live')}
            className="bg-red-700 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{t.retryBtn}</span>
          </button>
        </div>
      )}

    </div>
  );
};
