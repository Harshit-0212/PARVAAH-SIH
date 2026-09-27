import React, { useState } from 'react';
import { Terminal, Database, ShieldCheck, ChevronDown, ChevronUp, RefreshCw, Wifi, Activity } from 'lucide-react';
import type { UserRole } from '../../types';
import { API_BASE_URL } from '../../api/client';

export interface ApiDebugInfo {
  // 1. API base URL — resolved from environment, never secret
  apiBaseUrl?: string;
  // 2. Last request — method + relative path only
  lastRequest?: { method: string; path: string } | null;
  // 3. Last HTTP status
  lastHttpStatus?: number | null;
  // 4. Data mode from environment
  dataMode?: string;
  // 5. Number of records loaded on last fetch
  recordsLoaded?: number;
  // 6. Active filters
  activeDistrict?: string;
  activeStatusFilter?: string;
  currentRole: UserRole;
  // 7. Last fetch timestamp
  lastFetchTimestamp?: string | null;
  // POST tracking
  lastPostStatus?: {
    statusCode: number;
    serverReportId?: string;
    clientReportId?: string;
    timestamp: string;
    isDuplicate?: boolean;
  } | null;
  // Legacy compat
  getReportsCount?: number;
  reportIdsLoaded?: string[];
  mongoDbStatus?: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'NOT_CONFIGURED';
}

interface ApiDebugPanelProps {
  debugInfo: ApiDebugInfo;
  onRefreshTelemetry?: () => void;
}

function StatusPill({ value, ok }: { value: string | number; ok?: boolean }) {
  const base = 'font-mono text-[10px] px-1.5 py-0.5 rounded font-bold border';
  const color =
    ok === true
      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
      : ok === false
      ? 'bg-red-950 text-red-300 border-red-800'
      : 'bg-slate-800 text-slate-300 border-slate-700';
  return <span className={`${base} ${color}`}>{value}</span>;
}

export const ApiDebugPanel: React.FC<ApiDebugPanelProps> = ({ debugInfo, onRefreshTelemetry }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Strictly development-only
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
  if (!isDev) return null;

  // Use env-resolved base URL — never expose secrets
  const safeBaseUrl = debugInfo.apiBaseUrl ?? API_BASE_URL ?? '/api/v1';
  const dataMode = debugInfo.dataMode ?? (import.meta.env.VITE_DATA_MODE as string) ?? 'demo';
  const recordCount = debugInfo.recordsLoaded ?? debugInfo.getReportsCount ?? 0;
  const lastStatus = debugInfo.lastHttpStatus;
  const lastReq = debugInfo.lastRequest;

  return (
    <aside aria-label="Development Telemetry Debugger" className="fixed bottom-4 right-4 z-50 font-sans text-xs select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/95 hover:bg-slate-900 text-white border border-slate-700/80 px-3 py-1.5 rounded-full shadow-xl flex items-center space-x-2 transition-all cursor-pointer backdrop-blur-md hover:scale-105"
          title="Open Dev Telemetry Panel"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Terminal className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-mono text-[11px] font-bold">API Debug</span>
          <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
            {recordCount} rec
          </span>
          <ChevronUp className="w-3 h-3 text-slate-400" />
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-slate-950/95 text-slate-100 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">PARVAAH Dev Telemetry</div>
                <div className="text-[10px] text-slate-400">Development Audit Mode — Safe Properties Only</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {onRefreshTelemetry && (
                <button onClick={onRefreshTelemetry} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer" title="Force refresh">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Privacy guarantee */}
          <div className="bg-emerald-950/60 border-b border-emerald-800/40 px-3.5 py-1.5 text-[10px] text-emerald-300 flex items-center space-x-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>No secrets, keys, DB URIs, tokens, or citizen contacts shown here.</span>
          </div>

          {/* Content */}
          <div className="p-3.5 space-y-2.5 max-h-[480px] overflow-y-auto text-[11px]">

            {/* 1. API Connection */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3 h-3" /> API Connection
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Base URL:</span>
                <span className="font-mono text-teal-300 text-[10px] bg-teal-950/50 px-1.5 py-0.5 rounded border border-teal-800/40">{safeBaseUrl}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Data Mode:</span>
                <StatusPill value={dataMode.toUpperCase()} />
              </div>
            </div>

            {/* 2. Last Request */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Last API Request
              </div>
              {lastReq ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Request:</span>
                    <span className="font-mono text-slate-200 text-[10px]">{lastReq.method} {lastReq.path}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">HTTP Status:</span>
                    <StatusPill
                      value={lastStatus ?? '—'}
                      ok={lastStatus != null ? lastStatus >= 200 && lastStatus < 300 : undefined}
                    />
                  </div>
                </>
              ) : (
                <div className="text-slate-500 italic text-[10px]">No request made yet in this session.</div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Fetch:</span>
                <span className="font-mono text-slate-300 text-[10px]">{debugInfo.lastFetchTimestamp ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Records Loaded:</span>
                <span className="font-mono text-amber-300 font-bold">{recordCount}</span>
              </div>
            </div>

            {/* 3. Role & Filters */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role & Active Filters</div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Role:</span>
                <StatusPill value={debugInfo.currentRole} ok={true} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">District:</span>
                <span className="font-mono text-slate-200">{debugInfo.activeDistrict || 'all'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Filter:</span>
                <span className="font-mono text-amber-300">{debugInfo.activeStatusFilter || 'UNDER_VERIFICATION'}</span>
              </div>
            </div>

            {/* 4. Last POST (citizen report) */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Last POST /reports</span>
                {debugInfo.lastPostStatus && (
                  <StatusPill
                    value={`HTTP ${debugInfo.lastPostStatus.statusCode}`}
                    ok={debugInfo.lastPostStatus.statusCode === 201 || debugInfo.lastPostStatus.statusCode === 200}
                  />
                )}
              </div>
              {debugInfo.lastPostStatus ? (
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Server Report ID:</span>
                    <span className="font-mono text-slate-100 font-bold text-[10px]">{debugInfo.lastPostStatus.serverReportId ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Saved to MongoDB:</span>
                    <span className="font-mono text-emerald-400">{debugInfo.lastPostStatus.isDuplicate ? 'DEDUPLICATED' : 'PERSISTED'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Captured:</span>
                    <span className="font-mono">{debugInfo.lastPostStatus.timestamp}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 italic text-[10px]">No report submitted this session.</div>
              )}
            </div>

            {/* 5. Loaded Report IDs */}
            {debugInfo.reportIdsLoaded && debugInfo.reportIdsLoaded.length > 0 && (
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Loaded Report IDs ({debugInfo.reportIdsLoaded.length})
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px]">
                  {debugInfo.reportIdsLoaded.map((id, i) => (
                    <span key={i} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">{id}</span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="bg-slate-900/90 px-3.5 py-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Dev Only — Not in production builds</span>
            <span className="text-teal-400 font-mono font-bold">PARVAAH v1.0</span>
          </div>
        </div>
      )}
    </aside>
  );
};
