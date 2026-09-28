import React from 'react';
import type { WardAlert, RiskCategory } from '../types/risk';
import { AlertCircle, Clock, Navigation, Home, Shield, Bell } from 'lucide-react';

interface AlertsPanelProps {
  alerts: WardAlert[];
  onSelectAlert?: (wardId: string) => void;
  selectedWardId?: string | null;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onSelectAlert,
  selectedWardId
}) => {
  const getBadgeStyle = (category: RiskCategory) => {
    switch (category) {
      case 'Very High':
        return 'bg-red-500/20 text-red-400 border-red-500/40 ring-1 ring-red-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Active Flash Flood Early Warnings</h3>
            <p className="text-xs text-slate-400">Hyper-local village/ward advisories with estimated lead times</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-950/80 text-red-300 border border-red-700/50">
          {alerts.length} Critical {alerts.length === 1 ? 'Alert' : 'Alerts'}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
          <Shield className="w-8 h-8 text-emerald-400" />
          <p className="text-sm">No critical flood warnings active. All monitored wards within normal thresholds.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/30 text-slate-400 font-medium">
                <th className="py-3 px-4">Ward / Village</th>
                <th className="py-3 px-3">Risk Score</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Lead Time</th>
                <th className="py-3 px-4 min-w-[280px]">Actionable Warning & Shelter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((alert) => {
                const isSelected = selectedWardId === alert.wardId;
                return (
                  <tr
                    key={alert.wardId}
                    onClick={() => onSelectAlert && onSelectAlert(alert.wardId)}
                    className={`cursor-pointer transition-colors duration-150 hover:bg-slate-800/40 ${
                      isSelected ? 'bg-slate-800/70 border-l-4 border-l-red-500' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div>{alert.wardName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{alert.wardId}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-100">
                      {alert.riskScore}
                      <span className="text-[11px] text-slate-500 font-normal">/100</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getBadgeStyle(alert.riskCategory)}`}>
                        {alert.riskCategory}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        ~{alert.leadTimeHours} hrs
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-300 text-xs leading-relaxed mb-1.5">{alert.actionText}</p>
                      {(alert.recommendedShelter || alert.evacuationRoute) && (
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                          {alert.recommendedShelter && (
                            <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-sky-300">
                              <Home className="w-3 h-3 text-sky-400" />
                              {alert.recommendedShelter}
                            </span>
                          )}
                          {alert.evacuationRoute && (
                            <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-emerald-300">
                              <Navigation className="w-3 h-3 text-emerald-400" />
                              {alert.evacuationRoute}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default AlertsPanel;
