import React, { useState, useEffect } from 'react';
import type { ProviderHealthReport } from '../services/api/dataIntegrationService';
import { fetchIntegrationHealth, runIntegrationDiagnostic } from '../api/integrations';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Database, 
  CloudRain, 
  Map, 
  MessageSquare, 
  Satellite, 
  ShieldCheck
} from 'lucide-react';
import type { Language } from '../types';

interface IntegrationHealthPageProps {
  lang: Language;
}

export const IntegrationHealthPage: React.FC<IntegrationHealthPageProps> = () => {
  const [reports, setReports] = useState<ProviderHealthReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingProvider, setIsTestingProvider] = useState<string | null>(null);
  const [liveTelemetrySample, setLiveTelemetrySample] = useState<any>(null);

  const runAllTests = async () => {
    setIsLoading(true);
    try {
      // First attempt querying the backend REST API
      const backendRes = await fetchIntegrationHealth();
      if (backendRes && backendRes.success && backendRes.data && backendRes.data.providers) {
        const mapped: ProviderHealthReport[] = backendRes.data.providers.map(p => ({
          id: p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: p.name,
          category: p.name.toLowerCase().includes('imd') || p.name.toLowerCase().includes('weather')
            ? 'Weather / Hydrology'
            : p.name.toLowerCase().includes('satellite') || p.name.toLowerCase().includes('isro')
            ? 'Satellite Telemetry'
            : p.name.toLowerCase().includes('sms') || p.name.toLowerCase().includes('alert')
            ? 'Emergency SMS'
            : 'Database',
            endpoint: p.configured ? 'Backend server-side check' : 'Not configured',
            status: p.status as any,
            latencyMs: p.latencyMs ?? 0,
            lastSuccessfulSync: p.lastSuccessfulFetch,
            recordsReceived: 0,
            dataAgeMinutes: p.dataAgeMinutes ?? 0,
            sourceType: p.sourceType,
          lastError: p.lastError,
          isLive: p.isLive,
          isConfigured: p.configured,
          configurationGuide: p.message
        }));
        setReports(mapped);
        return;
      }
    } catch {
      console.warn('[IntegrationHealthPage] Backend health endpoint unavailable; no local/browser provider claim is displayed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const handleTestSingle = async (providerId: string) => {
    setIsTestingProvider(providerId);
    try {
      const kind = providerId.includes('open-meteo') ? 'open-meteo' : providerId.includes('mongodb') || providerId.includes('persistence') ? 'mongodb' : providerId.includes('xgboost') || providerId.includes('fastapi') ? 'ml' : null;
      if (kind) setLiveTelemetrySample(await runIntegrationDiagnostic(kind));
      await runAllTests();
    } catch (err) {
      console.warn('Single test diagnostic exception:', err);
    } finally {
      setIsTestingProvider(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>CONNECTED (LIVE)</span>
          </span>
        );
      case 'DEMO':
      case 'DEMO_FALLBACK':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>DEMO FALLBACK</span>
          </span>
        );
      case 'NOT_CONFIGURED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-300">NOT CONFIGURED</span>;
      case 'DEGRADED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300">DEGRADED</span>;
      case 'ERROR':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-red-100 text-red-800 border border-red-300">ERROR</span>;
      case 'DISCONNECTED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-red-100 text-red-800 border border-red-300">DISCONNECTED</span>;
      case 'RATE_LIMITED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-orange-600" />
            <span>RATE LIMITED</span>
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1">
            <span>DEVICE OFFLINE</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>{status}</span>
          </span>
        );
    }
  };

  const getSourceBadge = (sourceType?: string) => sourceType === 'LIVE_CHECK'
    ? 'LIVE CHECK'
    : sourceType === 'DATABASE_CHECK'
    ? 'DATABASE CHECK'
    : sourceType === 'NOT_CONFIGURED'
    ? 'NOT CONFIGURED'
    : sourceType === 'DEMO'
    ? 'DEMO'
    : 'CONFIGURATION';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Weather / Hydrology':
        return <CloudRain className="w-5 h-5 text-teal-600" />;
      case 'Basemap Tiles':
        return <Map className="w-5 h-5 text-indigo-600" />;
      case 'Emergency SMS':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'Database':
        return <Database className="w-5 h-5 text-emerald-600" />;
      case 'Satellite Telemetry':
        return <Satellite className="w-5 h-5 text-blue-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-teal-400" />
            <span className="text-xs uppercase font-black tracking-widest text-teal-400">
              Reliability & Telemetry Operations
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            System Integration Health Console
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Runtime diagnostic layer for meteorological providers, alert gateways, database readiness, and demonstration sources. Demo entries are not live operational data.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="self-start md:self-auto bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Testing Connections...' : 'Test All Integrations'}</span>
        </button>
      </div>

      {/* Server-side diagnostic result */}
      {liveTelemetrySample && (
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 shadow-sm space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Server-side diagnostic result</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-700">{liveTelemetrySample.result.status}</span>
          </div>
          <p className="text-xs text-slate-700">Attempted: {new Date(liveTelemetrySample.attemptedAt).toLocaleString()} · Latency: {liveTelemetrySample.result.latencyMs ?? '—'} ms · Validation: {liveTelemetrySample.result.validation}</p>
          {liveTelemetrySample.result.error && <p className="text-xs text-amber-800">{liveTelemetrySample.result.error}</p>}
        </div>
      )}

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(rep => (
          <div 
            key={rep.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-gray-100">
                  {getCategoryIcon(rep.category)}
                </div>
                <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">{getSourceBadge(rep.sourceType)}</span>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {rep.category}
                  </span>
                  <h3 className="text-sm font-black text-gray-900">{rep.name}</h3>
                </div>
              </div>
              {getStatusBadge(rep.status)}
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl text-xs font-mono">
              <div>
                <span className="text-[10px] text-gray-400 block font-sans">Endpoint Latency</span>
                <span className="font-bold text-gray-900">{rep.latencyMs > 0 ? `${rep.latencyMs} ms` : '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-sans">Last Successful Sync</span>
                <span className="font-bold text-gray-900 truncate block">{rep.lastSuccessfulSync || 'Pending'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-sans">Records Cached</span>
                <span className="font-bold text-gray-900">{rep.recordsReceived}</span>
              </div>
            </div>

            {/* Endpoint URI */}
            <div className="text-[11px] text-gray-500 font-mono bg-gray-50 p-2 rounded-lg truncate border border-gray-100">
              <span className="text-gray-400 select-none">URL: </span>
              <span>{rep.endpoint}</span>
            </div>

            {/* Last Error Notice if any */}
            {rep.lastError && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-snug">{rep.lastError}</span>
              </div>
            )}

            {/* Configuration Guidance */}
            <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Configuration Guidance:
              </span>
              <p className="text-[11px] text-gray-700 leading-relaxed">
                {rep.configurationGuide}
              </p>
            </div>

            {/* Test Action */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                {rep.isConfigured ? '✓ Configured in Environment' : '⚠️ Credentials awaiting configuration'}
              </span>
              <button
                onClick={() => handleTestSingle(rep.id)}
                disabled={isTestingProvider === rep.id}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isTestingProvider === rep.id ? 'animate-spin text-teal-600' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
