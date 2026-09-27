import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Square, 
  Activity, 
  Clock, 
  MapPin, 
  Sliders, 
  CheckCircle2, 
  Zap,
  Info
} from 'lucide-react';
import { 
  fetchScenarios, 
  activateScenario, 
  deactivateScenario, 
  createScenario,
  syncOpenMeteoTelemetry
} from '../../api/scenarios';
import type { ScenarioRecord, ScenarioInput } from '../../types';

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioChange?: (activeScenario: ScenarioRecord | null) => void;
}

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  onScenarioChange
}) => {
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [activeScenario, setActiveScenario] = useState<ScenarioRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  // Custom scenario form state
  const [customForm, setCustomForm] = useState<ScenarioInput>({
    name: 'Custom Classroom Stress Test',
    description: 'Instructor controlled extreme monsoon downpour testing early warnings.',
    district: 'east_sikkim',
    state: 'Sikkim',
    rainfall24hMm: 220,
    forecastRainfall24hMm: 90,
    forecastRainfall72hMm: 180,
    soilMoisturePercent: 92,
    slopeDegrees: 45,
    historicalSusceptibility: 85,
    verifiedReportCount: 3,
    verifiedReportSeverity: 'CRITICAL',
    roadStatus: 'CLOSED',
    shelterOccupancyPercent: 80,
    durationMinutes: 30,
    operator: 'Classroom Drill Controller'
  });

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const res = await fetchScenarios();
      if (res && res.success) {
        setScenarios(res.data);
        setActiveScenario(res.activeScenario);
        if (onScenarioChange) onScenarioChange(res.activeScenario);
      }
    } catch (err: any) {
      console.warn('Failed loading scenarios:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadScenarios();
    }
  }, [isOpen]);

  // Countdown timer for active scenario
  useEffect(() => {
    if (!activeScenario || !activeScenario.isActive || !activeScenario.expiresAt) {
      setTimeLeftStr('');
      return;
    }

    const interval = setInterval(() => {
      const diffMs = new Date(activeScenario.expiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeLeftStr('Expired');
        loadScenarios(); // Reload when expired
      } else {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeScenario]);

  const handleActivate = async (id: string, duration = selectedDuration) => {
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await activateScenario(id, duration);
      if (res.success) {
        setActionMessage(`Activated drill: ${res.data.name}`);
        setActiveScenario(res.data);
        if (onScenarioChange) onScenarioChange(res.data);
        await loadScenarios();
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await deactivateScenario();
      if (res.success) {
        setActionMessage('Active simulation deactivated. Normal baseline restored.');
        setActiveScenario(null);
        if (onScenarioChange) onScenarioChange(null);
        await loadScenarios();
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndActivateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setActionMessage(null);
      const created = await createScenario(customForm);
      if (created.success) {
        const activated = await activateScenario(created.data.id, customForm.durationMinutes || 30);
        setActionMessage(`Custom drill "${activated.data.name}" initiated!`);
        setActiveScenario(activated.data);
        if (onScenarioChange) onScenarioChange(activated.data);
        await loadScenarios();
        setActiveTab('presets');
      }
    } catch (err: any) {
      setActionMessage(`Custom drill error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOpenMeteo = async () => {
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await syncOpenMeteoTelemetry();
      if (res && res.success) {
        setActionMessage(res.message || 'Synchronized live Open-Meteo meteorological telemetry.');
      }
    } catch (err: any) {
      setActionMessage(`Sync notice: ${err.message || 'Telemetric fallback active'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  College Demo & Disaster Drill Scenario Simulator
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  DEMO SAFEGUARD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulate severe weather triggers, road blockages, and risk spikes for classroom drills without live alerts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Safety Banner */}
        <div className="bg-amber-950/40 border-b border-amber-900/50 px-5 py-2.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>SIMULATED DRILL — College/SIH demonstration only. Not an official warning or evacuation order.</strong>
            </span>
          </div>
          <button
            onClick={handleSyncOpenMeteo}
            disabled={loading}
            className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 border border-slate-600 cursor-pointer ml-4"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Sync Open-Meteo</span>
          </button>
        </div>

        {/* Action Status Notification */}
        {actionMessage && (
          <div className="bg-emerald-950/60 border-b border-emerald-800/50 px-5 py-2 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Active Scenario Card (If Active) */}
        {activeScenario && activeScenario.isActive ? (
          <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 p-4 border-b border-red-900/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                    SIMULATION DRILL ACTIVE:
                  </span>
                  <span className="text-sm font-bold text-white">{activeScenario.name}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-300 mt-0.5">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>{activeScenario.district.toUpperCase()} ({activeScenario.state})</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 font-mono text-amber-300">
                    <Clock className="w-3 h-3" />
                    <span>{timeLeftStr}</span>
                  </span>
                  <span>•</span>
                  <span>Rain: {activeScenario.rainfall24hMm}mm / 24h</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDeactivate}
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop Drill / Restore Baseline</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-950/40 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>No simulation drill is currently active. Baseline weather is serving.</span>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[11px] text-slate-400">Default Duration:</span>
              {[15, 30, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setSelectedDuration(mins)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedDuration === mins
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-5">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'presets'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            5 Preconfigured College Drills
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'custom'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Custom Parameter Stress-Test
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((sc) => {
                const isThisActive = activeScenario?.id === sc.id && activeScenario.isActive;
                return (
                  <div
                    key={sc.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isThisActive
                        ? 'bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-950/20 ring-1 ring-purple-500'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {sc.district.replace('_', ' ')} • {sc.state}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                            {sc.name}
                          </h3>
                        </div>
                        {isThisActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>RUNNING</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {sc.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-center pt-2">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
                          <span className="text-[10px] text-slate-400 block">Rainfall 24h</span>
                          <span className="text-xs font-black text-cyan-300 font-mono">{sc.rainfall24hMm} mm</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
                          <span className="text-[10px] text-slate-400 block">Soil Moisture</span>
                          <span className="text-xs font-black text-amber-300 font-mono">{sc.soilMoisturePercent}%</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
                          <span className="text-[10px] text-slate-400 block">Road Status</span>
                          <span className={`text-[11px] font-black font-mono ${
                            sc.roadStatus === 'CLOSED' ? 'text-red-400' :
                            sc.roadStatus === 'PARTIALLY_BLOCKED' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {sc.roadStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-700/50 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {sc.durationMinutes} min drill duration
                      </span>

                      {isThisActive ? (
                        <button
                          onClick={handleDeactivate}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Square className="w-3 h-3" />
                          <span>Stop Drill</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(sc.id)}
                          disabled={loading}
                          className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Inject Scenario</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Drill Form */
            <form onSubmit={handleCreateAndActivateCustom} className="space-y-4 max-w-2xl mx-auto bg-slate-800/40 p-5 rounded-xl border border-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Configure Custom Telemetry Stress Parameters</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Scenario Title</label>
                  <input
                    type="text"
                    required
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Target District</label>
                  <select
                    value={customForm.district}
                    onChange={(e) => setCustomForm({ ...customForm, district: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="east_sikkim">East Sikkim (Sikkim)</option>
                    <option value="east_khasi">East Khasi Hills (Meghalaya)</option>
                    <option value="dima_hasao">Dima Hasao (Assam)</option>
                    <option value="west_kameng">West Kameng (Arunachal Pradesh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    24h Rainfall: <span className="font-mono text-cyan-300 font-bold">{customForm.rainfall24hMm} mm</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={400}
                    value={customForm.rainfall24hMm}
                    onChange={(e) => setCustomForm({ ...customForm, rainfall24hMm: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Soil Moisture: <span className="font-mono text-amber-300 font-bold">{customForm.soilMoisturePercent} %</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={customForm.soilMoisturePercent}
                    onChange={(e) => setCustomForm({ ...customForm, soilMoisturePercent: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Slope Angle: <span className="font-mono text-purple-300 font-bold">{customForm.slopeDegrees} °</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={65}
                    value={customForm.slopeDegrees}
                    onChange={(e) => setCustomForm({ ...customForm, slopeDegrees: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Corridor Road Status</label>
                  <select
                    value={customForm.roadStatus}
                    onChange={(e) => setCustomForm({ ...customForm, roadStatus: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="OPEN">OPEN (Normal Flow)</option>
                    <option value="PARTIALLY_BLOCKED">PARTIALLY BLOCKED (Single Lane)</option>
                    <option value="CLOSED">CLOSED (Debris Blocking Carriage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Drill Auto-Expiry (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={customForm.durationMinutes}
                    onChange={(e) => setCustomForm({ ...customForm, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Field Reports Severity</label>
                  <select
                    value={customForm.verifiedReportSeverity}
                    onChange={(e) => setCustomForm({ ...customForm, verifiedReportSeverity: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="NONE">NONE (No verified debris sightings)</option>
                    <option value="LOW">LOW (Small gravel spall)</option>
                    <option value="MODERATE">MODERATE (Mud wash on shoulder)</option>
                    <option value="HIGH">HIGH (Retaining wall cracking)</option>
                    <option value="CRITICAL">CRITICAL (Mass movement observed)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Create & Activate Drill</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Admin & Instructor Drill Console active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
};
