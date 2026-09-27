import React from 'react';
import { AlertTriangle, Sliders, ShieldCheck } from 'lucide-react';
import type { WeatherSourceType, WeatherProviderType } from '../../types';

interface WeatherSourceBadgeProps {
  sourceType?: WeatherSourceType | string;
  provider?: WeatherProviderType | string;
  isOfficialWarning?: boolean;
  className?: string;
  compact?: boolean;
}

export const WeatherSourceBadge: React.FC<WeatherSourceBadgeProps> = ({
  sourceType,
  provider,
  isOfficialWarning = false,
  className = '',
  compact = false
}) => {
  // Determine badge mode:
  // 1. SIMULATED SCENARIO — College demonstration only
  // 2. THIRD-PARTY WEATHER DATA — Research/demo use; not an IMD warning
  // 3. OFFICIAL IMD WEATHER DATA — Check source and validity time

  const isScenario = sourceType === 'SIMULATED_SCENARIO' || provider === 'SCENARIO';
  const isOfficial = isOfficialWarning && provider === 'IMD' && sourceType === 'IMD_LIVE';

  if (isScenario) {
    return (
      <div 
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold tracking-wide ${className}`}
        title="College demonstration drill active. Parameters injected synthetically."
      >
        <Sliders className="w-3 h-3 text-purple-400 shrink-0" />
        <span>
          {compact 
            ? 'SIMULATED SCENARIO' 
            : 'SIMULATED SCENARIO — College demonstration only'}
        </span>
      </div>
    );
  }

  if (isOfficial) {
    return (
      <div 
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold tracking-wide ${className}`}
        title="Official IMD government weather telemetry."
      >
        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
        <span>
          {compact 
            ? 'OFFICIAL IMD DATA' 
            : 'OFFICIAL IMD WEATHER DATA — Check source and validity time'}
        </span>
      </div>
    );
  }

  // Default: THIRD-PARTY WEATHER DATA — Research/demo use; not an IMD warning
  return (
    <div 
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold tracking-wide ${className}`}
      title="Third-party numerical weather forecast (Open-Meteo) used for research/demo while official IMD key clearance is pending."
    >
      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
      <span>
        {compact 
          ? 'THIRD-PARTY WEATHER DATA' 
          : 'THIRD-PARTY WEATHER DATA — Research/demo use; not an IMD warning'}
      </span>
    </div>
  );
};
