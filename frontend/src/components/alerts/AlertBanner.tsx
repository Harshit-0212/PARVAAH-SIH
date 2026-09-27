import React, { useState } from 'react';
import type { SystemAlert, Language } from '../../types';
import { 
  AlertTriangle, 
  AlertOctagon, 
  X, 
  Bell, 
  ChevronRight
} from 'lucide-react';

interface AlertBannerProps {
  alerts: SystemAlert[];
  lang: Language;
  onViewIncidentAlert?: (alert: SystemAlert) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  lang,
  onViewIncidentAlert,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeAlerts = alerts.filter(a => !dismissedIds.includes(a.id));
  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'EMERGENCY':
        return 'bg-red-700 text-white border-red-800';
      case 'WARNING':
        return 'bg-orange-600 text-white border-orange-700';
      case 'WATCH':
        return 'bg-amber-500 text-slate-950 border-amber-600';
      case 'ADVISORY':
        return 'bg-teal-700 text-white border-teal-800';
      default:
        return 'bg-slate-800 text-white border-slate-700';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'EMERGENCY':
        return <AlertOctagon className="w-5 h-5 shrink-0 animate-bounce" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />;
      default:
        return <Bell className="w-5 h-5 shrink-0" />;
    }
  };

  const headline = lang === 'hi' && currentAlert.headlineHi ? currentAlert.headlineHi : currentAlert.headline;
  const actionText = lang === 'hi' && currentAlert.clearActionHi ? currentAlert.clearActionHi : currentAlert.clearAction;

  return (
    <div className={`w-full py-2.5 px-4 shadow-md border-b text-xs flex flex-wrap items-center justify-between gap-3 ${getAlertColor(currentAlert.severity)}`}>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {getAlertIcon(currentAlert.severity)}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-black uppercase tracking-wider text-[10px] bg-black/25 px-2 py-0.5 rounded">
            {currentAlert.severity} ALERT
          </span>
          <span className="font-bold truncate">
            {headline}
          </span>
          <span className="hidden md:inline text-[11px] opacity-90 truncate">
            — {actionText}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {onViewIncidentAlert && (
          <button
            onClick={() => onViewIncidentAlert(currentAlert)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => setDismissedIds(prev => [...prev, currentAlert.id])}
          className="p-1 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
