import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, RefreshCw, MapPin, Activity, Cloud, Shield,
  ChevronDown, ChevronUp, Loader2, Info, ShieldAlert, Zap,
  CheckCircle2, XCircle, Radio, Thermometer, BarChart2
} from 'lucide-react';
import type { Language } from '../types';

interface DistrictOfficerRiskPageProps {
  lang?: Language;
  onNavigateToProofToProtection?: () => void;
}

interface RiskZoneFeature {
  id?: string;
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    name?: string;
    district?: string;
    riskScore?: number;
    riskLevel?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    modelMode?: string;
    calculatedAt?: string;
    disclaimer?: string;
    rainfall24hMm?: number;
    soilMoisturePct?: number;
    slopeDegrees?: number;
    verifiedReportCount?: number;
  };
}

interface SystemDataState {
  riskZones: RiskZoneFeature[];
  incidents: any[];
  pendingReports: any[];
  verifiedReports: any[];
  roads: any[];
  shelters: any[];
  weather: any[];
  integrationHealth: any;
  loading: boolean;
  errors: string[];
  lastFetched: string | null;
}

const RISK_COLORS = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  HIGH: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  MODERATE: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
  LOW: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' }
};

function validateGeoJSONFeature(f: any): f is RiskZoneFeature {
  if (!f || typeof f !== 'object') return false;
  if (f.type !== 'Feature') return false;
  if (!f.geometry || !['Polygon', 'MultiPolygon'].includes(f.geometry?.type)) return false;
  if (!Array.isArray(f.geometry.coordinates) || f.geometry.coordinates.length === 0) return false;
  return true;
}

export const DistrictOfficerRiskPage: React.FC<DistrictOfficerRiskPageProps> = ({
  onNavigateToProofToProtection
}) => {
  const [data, setData] = useState<SystemDataState>({
    riskZones: [],
    incidents: [],
    pendingReports: [],
    verifiedReports: [],
    roads: [],
    shelters: [],
    weather: [],
    integrationHealth: null,
    loading: false,
    errors: [],
    lastFetched: null
  });

  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [recalcResult, setRecalcResult] = useState<Record<string, any>>({});
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, errors: [] }));

    const endpoints = [
      { key: 'riskZones',     url: '/api/v1/risk-zones',                          label: 'Risk Zones' },
      { key: 'incidents',     url: '/api/v1/incidents',                            label: 'Incidents' },
      { key: 'pendingReports',url: '/api/v1/reports?verificationStatus=UNDER_VERIFICATION&limit=50', label: 'Pending Reports' },
      { key: 'verifiedReports',url: '/api/v1/reports?verificationStatus=VERIFIED&limit=50', label: 'Verified Reports' },
      { key: 'roads',         url: '/api/v1/roads',                                label: 'Roads' },
      { key: 'shelters',      url: '/api/v1/shelters',                             label: 'Shelters' },
      { key: 'weather',       url: '/api/v1/weather',                              label: 'Weather' },
      { key: 'integrationHealth', url: '/api/v1/integrations/health',             label: 'Integration Health' }
    ];

    const errors: string[] = [];
    const results: Partial<SystemDataState> = {};

    await Promise.all(
      endpoints.map(async ({ key, url, label }) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          (results as any)[key] = json;
        } catch (err: any) {
          errors.push(`${label}: ${err.message}`);
          (results as any)[key] = key === 'riskZones' ? { features: [] } : key === 'integrationHealth' ? null : { data: [] };
        }
      })
    );

    // Validate and extract risk zones with GeoJSON safety check
    let validZones: RiskZoneFeature[] = [];
    const rz = results.riskZones as any;
    if (rz?.type === 'FeatureCollection' && Array.isArray(rz.features)) {
      validZones = rz.features.filter(validateGeoJSONFeature);
    } else if (Array.isArray(rz?.data)) {
      validZones = rz.data.filter(validateGeoJSONFeature);
    }

    setData(prev => ({
      ...prev,
      loading: false,
      errors,
      lastFetched: new Date().toLocaleTimeString(),
      riskZones: validZones,
      incidents: (results.incidents as any)?.data ?? [],
      pendingReports: (results.pendingReports as any)?.data ?? [],
      verifiedReports: (results.verifiedReports as any)?.data ?? [],
      roads: (results.roads as any)?.data ?? [],
      shelters: (results.shelters as any)?.data ?? [],
      weather: Array.isArray((results.weather as any)?.data) ? (results.weather as any).data : [(results.weather as any)].filter(Boolean),
      integrationHealth: results.integrationHealth
    }));
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRecalculate = async (zoneId: string) => {
    setRecalculating(zoneId);
    setRecalcResult(prev => ({ ...prev, [zoneId]: null }));
    try {
      const res = await fetch(`/api/v1/risk-zones/${zoneId}/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setRecalcResult(prev => ({ ...prev, [zoneId]: data }));
      // Refresh zones after recalculation
      await fetchAllData();
    } catch (err: any) {
      setRecalcResult(prev => ({ ...prev, [zoneId]: { error: err.message } }));
    } finally {
      setRecalculating(null);
    }
  };

  const getRiskColor = (level?: string) => {
    return RISK_COLORS[(level as keyof typeof RISK_COLORS) ?? 'LOW'] ?? RISK_COLORS.LOW;
  };

  const totalPending = data.pendingReports.length;
  const totalVerified = data.verifiedReports.length;
  const blockedRoads = data.roads.filter((r: any) => r.status === 'BLOCKED').length;
  const openShelters = data.shelters.filter((s: any) => s.isOpen !== false).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-6 md:px-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">District Officer Risk Console</h1>
                <p className="text-xs text-gray-500 font-medium">North Eastern Region — PARVAAH Risk Advisory Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-2">
              <span className="text-xs text-gray-400">
                {data.lastFetched ? `Last refreshed: ${data.lastFetched}` : 'Loading…'}
              </span>
              {data.errors.length > 0 && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {data.errors.length} source{data.errors.length > 1 ? 's' : ''} unavailable
                </span>
              )}
            </div>
          </div>

          <button
            id="district-risk-refresh-btn"
            onClick={fetchAllData}
            disabled={data.loading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${data.loading ? 'animate-spin' : ''}`} />
            <span>Refresh All Sources</span>
          </button>
        </div>

        {/* Operational Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Risk Zones', value: data.riskZones.length, icon: <MapPin className="w-5 h-5" />, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
            { label: 'Pending Reports', value: totalPending, icon: <Activity className="w-5 h-5" />, color: 'text-amber-600', bgColor: 'bg-amber-50' },
            { label: 'Blocked Roads', value: blockedRoads, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600', bgColor: 'bg-red-50' },
            { label: 'Open Shelters', value: openShelters, icon: <Shield className="w-5 h-5" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${card.bgColor} flex items-center justify-center mb-3 ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.loading ? '—' : card.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Error notices */}
        {data.errors.length > 0 && !data.loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Some data sources unavailable</p>
                <ul className="mt-1 text-xs text-amber-700 space-y-0.5">
                  {data.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Zones Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-bold text-gray-900">Risk Zone Analysis</h2>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full font-medium">
                  PRACTICE · DECISION-SUPPORT ADVISORY
                </span>
              </div>

              {data.loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  <span className="text-sm">Loading risk zone data from 8 sources…</span>
                </div>
              ) : data.riskZones.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium text-sm">No calculated risk zones available.</p>
                  <p className="text-xs text-gray-400 mt-1">Run a demo scenario or risk calculation to populate zones.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.riskZones.map((zone, idx) => {
                    const zoneId = (zone.id as string) || `ZONE-${idx}`;
                    const props = zone.properties;
                    const level = (props.riskLevel ?? 'LOW') as keyof typeof RISK_COLORS;
                    const rc = getRiskColor(level);
                    const isExpanded = expandedZone === zoneId;
                    const result = recalcResult[zoneId];
                    const isRecalculating = recalculating === zoneId;
                    const corroborating = totalVerified;

                    return (
                      <div
                        key={zoneId}
                        className={`px-5 py-4 transition-colors ${isExpanded ? rc.bg : 'hover:bg-gray-50'}`}
                      >
                        <div
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => setExpandedZone(isExpanded ? null : zoneId)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${rc.dot}`}></div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-bold text-gray-900 text-sm">{props.name ?? zoneId}</p>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${rc.badge}`}>
                                  {level}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {props.district ?? 'North East India'} · Score: <strong>{props.riskScore ?? '—'}</strong>/100
                              </p>
                              {props.modelMode && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">
                                  {props.modelMode}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              id={`recalc-zone-${zoneId}-btn`}
                              onClick={e => { e.stopPropagation(); handleRecalculate(zoneId); }}
                              disabled={isRecalculating}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isRecalculating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Zap className="w-3.5 h-3.5" />
                              )}
                              <span>{isRecalculating ? 'Recalculating…' : 'Recalculate'}</span>
                            </button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 space-y-4">
                            {/* Why Now Factors */}
                            <div className={`rounded-xl p-4 border ${rc.border} ${rc.bg}`}>
                              <p className="text-xs font-bold text-gray-700 mb-3 flex items-center space-x-1.5">
                                <Info className="w-3.5 h-3.5" />
                                <span>Why Now — Risk Factor Breakdown</span>
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { label: 'Rainfall 24h', value: `${props.rainfall24hMm ?? '—'} mm`, icon: <Cloud className="w-3.5 h-3.5" /> },
                                  { label: 'Soil Moisture', value: `${props.soilMoisturePct ?? '—'}%`, icon: <Thermometer className="w-3.5 h-3.5" /> },
                                  { label: 'Slope Grade', value: `${props.slopeDegrees ?? '—'}°`, icon: <Activity className="w-3.5 h-3.5" /> },
                                  { label: 'Verified Reports', value: `${props.verifiedReportCount ?? corroborating} reports`, icon: <CheckCircle2 className="w-3.5 h-3.5" /> }
                                ].map(f => (
                                  <div key={f.label} className="flex items-center space-x-2">
                                    <span className={`${rc.text} opacity-70`}>{f.icon}</span>
                                    <div>
                                      <p className="text-[10px] text-gray-500 font-medium">{f.label}</p>
                                      <p className="text-xs font-bold text-gray-800">{f.value}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Recalculation result */}
                            {result && (
                              <div className={`rounded-xl p-3 border text-xs ${result.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                {result.error ? (
                                  <div className="flex items-center space-x-2">
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{result.error}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    <span>
                                      Recalculated: Score {result.data?.riskScore ?? '—'} ({result.data?.riskLevel ?? '—'}) · 
                                      Model: <span className="font-mono">{result.data?.modelMode ?? result.modelMode ?? 'DEMO_RULE_BASED'}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Disclaimer */}
                            <p className="text-[10px] text-gray-400 italic">
                              {props.disclaimer ?? 'This risk score is a prototype decision-support advisory. It is not an official warning or evacuation order.'}
                            </p>

                            {/* Proof to Protection link */}
                            {onNavigateToProofToProtection && (
                              <button
                                id={`zone-${zoneId}-proof-to-protection-btn`}
                                onClick={onNavigateToProofToProtection}
                                className="w-full py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-1.5"
                              >
                                <Radio className="w-3.5 h-3.5" />
                                <span>View Proof → Protection Chain for this zone</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Weather, Roads, Shelters */}
          <div className="space-y-4">
            {/* Weather Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-gray-900 text-sm">Weather Conditions</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                {data.loading ? (
                  <div className="text-center py-4 text-gray-400 text-xs"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />Loading…</div>
                ) : data.weather.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No weather data available.</p>
                ) : (
                  data.weather.slice(0, 4).map((w: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{w.district ?? w.stationName ?? `Station ${i + 1}`}</p>
                        <p className="text-[11px] text-gray-500">{w.forecast24h ?? w.forecastDescription ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-700">{w.currentRainfall ?? w.rainfall24h ?? '—'} mm</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          w.riskOutlook === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          w.riskOutlook === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{w.riskOutlook ?? 'UNKNOWN'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Roads Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-gray-900 text-sm">Road Corridor Status</h3>
              </div>
              <div className="px-5 py-4 space-y-2">
                {data.loading ? (
                  <div className="text-center py-4 text-gray-400 text-xs"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />Loading…</div>
                ) : data.roads.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No road data available.</p>
                ) : (
                  data.roads.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <p className="text-xs font-medium text-gray-800 truncate max-w-[70%]">{r.name ?? r.roadName ?? `Road ${i + 1}`}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                        r.status === 'SINGLE_LANE' ? 'bg-amber-100 text-amber-700' :
                        r.status === 'HIGH_RISK' ? 'bg-orange-100 text-orange-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>{r.status ?? 'UNKNOWN'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shelters Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm">Relief Shelters</h3>
              </div>
              <div className="px-5 py-4 space-y-2">
                {data.loading ? (
                  <div className="text-center py-4 text-gray-400 text-xs"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />Loading…</div>
                ) : data.shelters.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No shelter data available.</p>
                ) : (
                  data.shelters.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{s.name ?? `Shelter ${i + 1}`}</p>
                        <p className="text-[11px] text-gray-400">{s.district ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-700">{s.occupied ?? 0}/{s.capacity ?? '—'}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.isOpen !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {s.isOpen !== false ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Integration Health Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-600" />
                <h3 className="font-bold text-gray-900 text-sm">System Integration Health</h3>
              </div>
              <div className="px-5 py-4">
                {data.integrationHealth ? (
                  <div className="space-y-2">
                    {['database', 'mlService', 'weatherProvider', 'objectStorage'].map(key => {
                      const status = data.integrationHealth?.[key] ?? data.integrationHealth?.services?.[key];
                      const statusLabel = typeof status === 'string' ? status : (status?.status ?? 'UNKNOWN');
                      const ok = statusLabel === 'CONNECTED' || statusLabel === 'LIVE' || statusLabel === 'LIVE_CHECK_OK' || statusLabel === 'AVAILABLE';
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <p className="text-xs text-gray-600 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Health check unavailable.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pending & Verified Reports Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <h3 className="font-bold text-gray-900 text-sm">Pending Verification ({totalPending})</h3>
              </div>
            </div>
            <div className="px-5 py-4">
              {data.loading ? (
                <div className="text-center text-xs text-gray-400 py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />Loading…</div>
              ) : totalPending === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No pending reports. Triage queue clear.</p>
              ) : (
                <div className="space-y-2">
                  {data.pendingReports.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{r.serverReportId ?? r.id ?? `Report ${i + 1}`}</p>
                        <p className="text-[11px] text-gray-500">{r.hazardType?.toLowerCase().replace('_', ' ')} · {r.district ?? '—'}</p>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">PENDING</span>
                    </div>
                  ))}
                  {totalPending > 5 && <p className="text-xs text-gray-400 text-center pt-1">+{totalPending - 5} more in queue</p>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm">Verified Reports ({totalVerified})</h3>
              </div>
            </div>
            <div className="px-5 py-4">
              {data.loading ? (
                <div className="text-center text-xs text-gray-400 py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />Loading…</div>
              ) : totalVerified === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No verified reports. Verify field reports to strengthen risk analysis.</p>
              ) : (
                <div className="space-y-2">
                  {data.verifiedReports.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{r.serverReportId ?? r.id ?? `Report ${i + 1}`}</p>
                        <p className="text-[11px] text-gray-500">{r.hazardType?.toLowerCase().replace('_', ' ')} · {r.district ?? '—'}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">VERIFIED</span>
                    </div>
                  ))}
                  {totalVerified > 5 && <p className="text-xs text-gray-400 text-center pt-1">+{totalVerified - 5} more verified</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start space-x-3">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Decision-Support Advisory:</strong> All risk scores displayed are generated by a practice prototype model for college demonstration and preparedness planning purposes. They are not official SDMA/NDMA risk assessments, warnings, or evacuation orders. No actual public emergency alerts are sent; no official evacuation orders are automatically issued.
          </p>
        </div>
      </div>
    </div>
  );
};
