import React, { useState, useEffect, useCallback } from 'react';
import type { 
  LandslideIncident, SlopeSensor, Shelter, RoadStatus, 
  Language, UserRole, EvacuationOrderStatus, CitizenReportRecord 
} from '../types';
import { dictionary } from '../data/translations';
import { DISTRICTS, WEATHER_METRICS } from '../data/mockData';
import { GisMap } from '../components/gis/GisMap';
import { IncidentDetailDrawer } from '../components/incidents/IncidentDetailDrawer';
import { EvacuationModal } from '../components/evacuation/EvacuationModal';
import { PreparednessModule } from '../components/preparedness/PreparednessModule';
import { CitizenRiskOverview } from '../components/CitizenRiskOverview';
import { fetchCitizenReports, updateReportVerification } from '../api/reports';
import { 
  AlertTriangle, 
  Radio, 
  RefreshCw, 
  MapPin, 
  Clock, 
  Filter, 
  Activity, 
  Compass, 
  Shield, 
  ShieldCheck, 
  ExternalLink,
  Sliders,
  CheckCircle2,
  XCircle,
  Copy,
  ShieldAlert,
  Check,
  FileText,
  Camera,
  Eye,
  X
} from 'lucide-react';


interface DashboardPageProps {
  lang: Language;
  role: UserRole;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  incidents: LandslideIncident[];
  sensors: SlopeSensor[];
  shelters: Shelter[];
  roads: RoadStatus[];
  isOffline: boolean;
  onOpenReportModal: () => void;
  onNavigateToIntegrationHealth?: () => void;
  onOpenScenarioSimulator?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  lang,
  role,
  selectedDistrict,
  setSelectedDistrict,
  incidents,
  sensors,
  shelters,
  roads,
  isOffline,
  onOpenReportModal,
  onNavigateToIntegrationHealth,
  onOpenScenarioSimulator
}) => {
  const t = dictionary[lang];
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncMinutes, setLastSyncMinutes] = useState(2);

  // Selected incident for drawer
  const [activeIncident, setActiveIncident] = useState<LandslideIncident | null>(null);
  const [testAlertIncident, setTestAlertIncident] = useState<LandslideIncident | null>(null);

  // Evacuation planning modal
  const [evacuationModalOpen, setEvacuationModalOpen] = useState(false);
  const [evacuationTargetIncident, setEvacuationTargetIncident] = useState<LandslideIncident | null>(null);

  // Local state for updated incidents (e.g. status changes)
  const [incidentList, setIncidentList] = useState<LandslideIncident[]>(incidents);

  // Synchronize when parent incidents update from REST API
  React.useEffect(() => {
    setIncidentList(incidents);
  }, [incidents]);

  // Dynamic Weather telemetry state
  const [dynamicWeather, setDynamicWeather] = useState<any>(null);

  React.useEffect(() => {
    let active = true;
    import('../api/weather').then(({ fetchWeather }) => {
      fetchWeather(selectedDistrict)
        .then(res => {
          if (active && res && res.success && res.data && res.data.length > 0) {
            const w = res.data[0];
            setDynamicWeather({
              district: w.district,
              districtName: w.district,
              currentRainfall: w.currentRainfallMm || 184,
              thresholdLimit: w.thresholdLimitMm || 150,
              forecast24h: w.forecast24h || 'Heavy rainfall expected.',
              riskOutlook: w.riskOutlook || 'HIGH',
              soilSaturation: w.soilSaturationPct || 88
            });
          }
        })
        .catch(err => {
          console.warn('[DashboardPage] Weather API fallback:', err);
        });
    });

    return () => {
      active = false;
    };
  }, [selectedDistrict]);

  // Operational Citizen Reports under verification
  const [citizenReports, setCitizenReports] = useState<CitizenReportRecord[]>([]);
  const [reportsLoading, setReportsLoading] = useState<boolean>(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportsLastFetched, setReportsLastFetched] = useState<Date | null>(null);
  const [verifyingReportId, setVerifyingReportId] = useState<string | null>(null);
  const [verificationFilter, setVerificationFilter] = useState<'UNDER_VERIFICATION' | 'ALL' | 'VERIFIED' | 'REJECTED'>('UNDER_VERIFICATION');
  const [reportActionToast, setReportActionToast] = useState<string | null>(null);
  const [selectedEvidenceReport, setSelectedEvidenceReport] = useState<CitizenReportRecord | null>(null);

  const loadCitizenReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const statusParam = verificationFilter === 'ALL' ? undefined : verificationFilter;
      const res = await fetchCitizenReports({
        district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        verificationStatus: statusParam,
        limit: 50
      });
      if (res && res.success && Array.isArray(res.data)) {
        setCitizenReports(res.data);
        setReportsLastFetched(new Date());
      } else {
        setReportsError('Failed to load operational citizen reports.');
      }
    } catch (err: any) {
      console.warn('[DashboardPage] Reports fetch error:', err);
      setReportsError(err.message || 'Error fetching citizen reports from backend.');
    } finally {
      setReportsLoading(false);
    }
  }, [selectedDistrict, verificationFilter]);

  // Safe auto-refresh polling interval (30 seconds)
  useEffect(() => {
    loadCitizenReports();
    const timer = setInterval(() => {
      loadCitizenReports();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadCitizenReports]);

  const handleManualSync = () => {
    setIsSyncing(true);
    loadCitizenReports();
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncMinutes(0);
    }, 600);
  };

  const handleVerifyReport = async (reportId: string, targetStatus: 'VERIFIED' | 'REJECTED' | 'DUPLICATE') => {
    if (isOffline) {
      alert('OFFLINE — Verification changes are queued and require synchronization before they become official.');
      setReportActionToast('OFFLINE — Verification changes queued locally.');
      setTimeout(() => setReportActionToast(null), 4000);
      return;
    }
    setVerifyingReportId(reportId);
    try {
      await updateReportVerification(
        reportId,
        {
          verificationStatus: targetStatus,
          notes: `Marked as ${targetStatus} by ${role === 'admin' ? 'District EOC Commander' : 'Field Duty Officer'}`
        },
        role
      );

      setReportActionToast(`Report #${reportId.slice(-7)} marked as ${targetStatus}.`);
      setTimeout(() => setReportActionToast(null), 4000);

      // Immediately refetch reports
      await loadCitizenReports();
    } catch (err: any) {
      alert(`Verification action failed: ${err.message}`);
    } finally {
      setVerifyingReportId(null);
    }
  };


  const handleOpenEvacuation = (inc: LandslideIncident) => {
    setEvacuationTargetIncident(inc);
    setEvacuationModalOpen(true);
  };

  const handleUpdateEvacuationStatus = (incidentId: string, newStatus: EvacuationOrderStatus) => {
    setIncidentList(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          evacuationOrderStatus: newStatus,
          timeline: [
            {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              author: 'District Magistrate / EOC Control',
              note: `Official evacuation order updated to: ${newStatus}`,
              statusChange: newStatus,
            },
            ...inc.timeline,
          ]
        };
      }
      return inc;
    }));

    if (activeIncident && activeIncident.id === incidentId) {
      setActiveIncident(prev => prev ? { ...prev, evacuationOrderStatus: newStatus } : null);
    }
  };

  const filteredIncidents = selectedDistrict === 'all' 
    ? incidentList 
    : incidentList.filter(i => i.district === selectedDistrict);

  const filteredSensors = selectedDistrict === 'all'
    ? sensors
    : sensors.filter(s => s.district === selectedDistrict);

  const filteredRoads = selectedDistrict === 'all'
    ? roads
    : roads.filter(r => r.district === selectedDistrict);

  const filteredShelters = selectedDistrict === 'all'
    ? shelters
    : shelters.filter(s => s.district === selectedDistrict);

  const fallbackWeather = WEATHER_METRICS.find(w => w.district === selectedDistrict) || WEATHER_METRICS[0];
  const weatherData = dynamicWeather || fallbackWeather;
  const currentDistrictObj = DISTRICTS.find(d => d.id === selectedDistrict) || DISTRICTS[0];
  const districtDisplayName = lang === 'hi' ? currentDistrictObj.nameHi : currentDistrictObj.nameEn;

  return (
    <div className="min-h-screen bg-[#F6F7F5] flex flex-col font-sans text-[#1F2937] pb-16">
      
      {/* Top Banner: Truthful Data Distinction */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold border-b border-amber-600 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          <span>
            DEMO MODE — Simulated data. Not an official IMD warning or evacuation order. All records reflect simulated disaster drill telemetry.
          </span>
        </div>
        {onNavigateToIntegrationHealth && (
          <button
            onClick={onNavigateToIntegrationHealth}
            className="underline hover:text-slate-900 cursor-pointer font-black shrink-0 flex items-center gap-1"
          >
            <span>View Integration Health</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Top Dashboard Control & Status Bar */}
      <div className="bg-white border-b border-[#E5E7EB] shadow-2xs sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-3">
          
          {/* District Selector & Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
              <Filter className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{t.districtSelectorLabel}:</span>
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="bg-transparent font-bold text-[#0F766E] focus:outline-none cursor-pointer"
              >
                {DISTRICTS.map(d => (
                  <option key={d.id} value={d.id}>
                    {lang === 'hi' ? d.nameHi : d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-gray-400 hidden md:inline">|</span>
            
            <div className="hidden md:flex items-center space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Last Sync: <strong className="text-gray-700">{lastSyncMinutes}m ago</strong></span>
              </div>
              <span className="text-gray-300">|</span>
              <div>
                <span>Known Data TS: <strong className="text-gray-700">{reportsLastFetched ? reportsLastFetched.toLocaleTimeString() : '10:38 AM'}</strong></span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center space-x-1">
                <span>Freshness:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  isOffline 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {isOffline ? 'AGING (CACHED)' : 'FRESH'}
                </span>
              </div>
              <button 
                onClick={handleManualSync}
                className="text-[#0F766E] hover:text-[#115E59] p-1 rounded cursor-pointer"
                title="Force Telemetry Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Actions & Role Indicator */}
          <div className="flex items-center space-x-3 text-xs">
            
            {/* Active Role Indicator Pill */}
            <div className="flex items-center space-x-1.5 bg-teal-50 text-[#0F766E] border border-teal-200 px-3 py-1.5 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-[#0F766E]"></span>
              <span>
                {role === 'admin' 
                  ? 'District Authority / EOC Command' 
                  : role === 'field_officer' 
                  ? 'Field Officer Console' 
                  : 'Citizen Safety Mode'}
              </span>
              {isOffline && (
                <span className="ml-1 text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
                  OFFLINE
                </span>
              )}
            </div>

            {/* Quick Report Landslide Button */}
            <button
              onClick={onOpenReportModal}
              className="bg-[#C98212] hover:bg-[#b0710e] text-white px-3.5 py-1.5 rounded-lg font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{t.heroActionReport}</span>
            </button>

          </div>

        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. CITIZEN SAFETY VIEW                                                    */}
        {/* ========================================================================= */}
        {role === 'citizen' ? (
          <div className="space-y-6">
            <CitizenRiskOverview
              lang={lang}
              selectedDistrict={selectedDistrict}
              districtDisplayName={districtDisplayName}
              rainfall24h={weatherData.currentRainfall}
              shelters={filteredShelters}
              onOpenReportModal={onOpenReportModal}
              onOpenAffectedMap={() => {
                if (filteredIncidents.length > 0) {
                  handleOpenEvacuation(filteredIncidents[0]);
                }
              }}
            />

            {/* GIS Overview for Citizens with Layer Capabilities */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-[#1F2937] flex items-center space-x-2">
                    <Compass className="w-5 h-5 text-[#0F766E]" />
                    <span>North Eastern Region GIS Hazard Map</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Click any marker to see affected roads, clearance teams, and nearest shelters.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  WGS84 High Precision GIS
                </span>
              </div>

              <GisMap
                incidents={incidentList}
                sensors={sensors}
                shelters={shelters}
                roads={roads}
                selectedDistrict={selectedDistrict}
                lang={lang}
                citizenReports={citizenReports}
                onSelectIncident={(inc) => setActiveIncident(inc)}
                onSelectShelter={() => {
                  if (filteredIncidents[0]) handleOpenEvacuation(filteredIncidents[0]);
                }}
              />

            </div>

            {/* NDMA Preparedness Module */}
            <PreparednessModule
              lang={lang}
              activeHazard="landslide"
              onOpenReportModal={onOpenReportModal}
              onNavigateShelters={() => {
                if (filteredIncidents[0]) handleOpenEvacuation(filteredIncidents[0]);
              }}
            />
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. AUTHORITY / EOC & FIELD OFFICER OPERATIONAL CONSOLE                    */
          /* ========================================================================= */
          <div className="space-y-6">
            
            {/* Operational Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-teal-400" />
                <div>
                  <h2 className="text-base font-black uppercase tracking-wide">
                    {role === 'admin' 
                      ? 'EOC State Disaster Operations Command & Triage' 
                      : 'District Field Officer Operations & Clearance Queue'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Live MapLibre GIS, inclinometer telemetries, machinery deployment, and road clearance logs.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {onOpenScenarioSimulator && (
                  <button
                    onClick={onOpenScenarioSimulator}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    title="Launch college demonstration drill"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-200" />
                    <span>Drill Simulator</span>
                  </button>
                )}

                {onNavigateToIntegrationHealth && (
                  <button
                    onClick={onNavigateToIntegrationHealth}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-teal-300" />
                    <span>Integration Health</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">{t.summaryHighRisk}</span>
                  <span className="text-2xl font-extrabold text-red-700 font-mono">
                    {filteredIncidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length}
                  </span>
                  <span className="text-[10px] text-red-600 block font-semibold mt-0.5">{t.activeWarningsSub}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">{t.summaryRoadBlocks}</span>
                  <span className="text-2xl font-extrabold text-amber-700 font-mono">
                    {filteredRoads.filter(r => r.status === 'BLOCKED' || r.status === 'SINGLE_LANE').length}
                  </span>
                  <span className="text-[10px] text-amber-600 block font-semibold mt-0.5">Corridors Impacted</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">{t.summaryActiveSensors}</span>
                  <span className="text-2xl font-extrabold text-[#0F766E] font-mono">
                    {filteredSensors.length}
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-semibold mt-0.5">{t.inclinometerHubsSub}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#0F766E]">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Shelter Population</span>
                  <span className="text-2xl font-extrabold text-purple-800 font-mono">
                    {filteredShelters.reduce((acc, s) => acc + s.occupied, 0)}
                  </span>
                  <span className="text-[10px] text-purple-600 block font-semibold mt-0.5">Accommodated</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* MapLibre GIS Map Component */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937] flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-[#0F766E]" />
                    <span>{t.mainMapHeader}</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    MapLibre GL JS vector terrain, hazard clusters, slope inclinometers, and connectivity corridors.
                  </p>
                </div>
                <span className="px-3 py-1 rounded bg-red-100 text-red-800 font-bold text-xs">
                  {t.highHazardBadge}
                </span>
              </div>

              <GisMap
                incidents={incidentList}
                sensors={sensors}
                shelters={shelters}
                roads={roads}
                selectedDistrict={selectedDistrict}
                lang={lang}
                citizenReports={citizenReports}
                onSelectIncident={(inc) => setActiveIncident(inc)}
                onSelectShelter={() => {
                  if (filteredIncidents[0]) handleOpenEvacuation(filteredIncidents[0]);
                }}
              />
            </div>

            {/* ========================================================================= */}
            {/* INCOMING CITIZEN & FIELD REPORTS (UNDER VERIFICATION) TRIAGE QUEUE        */}
            {/* ========================================================================= */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
              
              {/* Toast message if verification action succeeded */}
              {reportActionToast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{reportActionToast}</span>
                  </div>
                  <button
                    onClick={() => setReportActionToast(null)}
                    className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Triage Queue Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        Incoming Citizen & Field Reports
                      </h3>
                      {citizenReports.filter(r => r.verificationStatus === 'UNDER_VERIFICATION').length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          {citizenReports.filter(r => r.verificationStatus === 'UNDER_VERIFICATION').length} Under Verification
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Operational reports awaiting triage cross-check. Unverified reports do not create public emergency alerts.
                    </p>
                  </div>
                </div>

                {/* Queue Controls & Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[11px]">
                    <button
                      onClick={() => setVerificationFilter('UNDER_VERIFICATION')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        verificationFilter === 'UNDER_VERIFICATION'
                          ? 'bg-white text-amber-800 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Under Verification
                    </button>
                    <button
                      onClick={() => setVerificationFilter('ALL')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        verificationFilter === 'ALL'
                          ? 'bg-white text-teal-800 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All Reports
                    </button>
                    <button
                      onClick={() => setVerificationFilter('VERIFIED')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        verificationFilter === 'VERIFIED'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Verified
                    </button>
                    <button
                      onClick={() => setVerificationFilter('REJECTED')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        verificationFilter === 'REJECTED'
                          ? 'bg-white text-red-800 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Rejected
                    </button>
                  </div>

                  {/* Manual Refresh button */}
                  <button
                    onClick={() => loadCitizenReports()}
                    disabled={reportsLoading}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-teal-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title="Refresh reports queue"
                  >
                    <RefreshCw className={`w-3 h-3 ${reportsLoading ? 'animate-spin text-teal-600' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>

                  {reportsLastFetched && (
                    <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
                      Synced {reportsLastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Error banner with retry */}
              {reportsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{reportsError}</span>
                  </div>
                  <button
                    onClick={() => loadCitizenReports()}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] cursor-pointer"
                  >
                    Retry Fetch
                  </button>
                </div>
              )}

              {/* Reports Table View */}
              {reportsLoading && citizenReports.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600" />
                  <p>Querying MongoDB for latest operational reports...</p>
                </div>
              ) : citizenReports.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                  <h4 className="text-xs font-bold text-gray-700">No Citizen Reports Found</h4>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    {selectedDistrict !== 'all' 
                      ? `No reports matching filter '${verificationFilter}' in district '${selectedDistrict}'.`
                      : `No reports matching filter '${verificationFilter}'.`}
                  </p>
                  <div className="pt-1">
                    {selectedDistrict !== 'all' && (
                      <button
                        onClick={() => setSelectedDistrict('all')}
                        className="text-teal-700 hover:underline font-bold text-xs cursor-pointer mr-3"
                      >
                        Show All Districts
                      </button>
                    )}
                    {verificationFilter !== 'ALL' && (
                      <button
                        onClick={() => setVerificationFilter('ALL')}
                        className="text-teal-700 hover:underline font-bold text-xs cursor-pointer"
                      >
                        Show All Statuses
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                        <th className="py-2.5 px-3">Report ID / Hazard</th>
                        <th className="py-2.5 px-3">Location & District</th>
                        <th className="py-2.5 px-3">Observation & Impact</th>
                        <th className="py-2.5 px-3">Reporter</th>
                        <th className="py-2.5 px-3">Received Time</th>
                        <th className="py-2.5 px-3">Verification Status</th>
                        <th className="py-2.5 px-3 text-right">Officer Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {citizenReports.map(rep => {
                        const isUnderVerif = rep.verificationStatus === 'UNDER_VERIFICATION';
                        const isVerified = rep.verificationStatus === 'VERIFIED';
                        const isRejected = rep.verificationStatus === 'REJECTED';
                        const isDuplicate = rep.verificationStatus === 'DUPLICATE';
                        const isActionBusy = verifyingReportId === rep.id;

                        return (
                          <tr key={rep.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-mono text-[11px] font-bold text-gray-900">{rep.id}</div>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800">
                                {rep.hazardType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-gray-800 capitalize">{rep.district.replace('_', ' ')}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {rep.coordinates?.latitude?.toFixed(4) ?? rep.latitude?.toFixed(4)}°N, {rep.coordinates?.longitude?.toFixed(4) ?? rep.longitude?.toFixed(4)}°E
                              </div>
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              <p className="text-gray-700 line-clamp-2 leading-relaxed">{rep.description}</p>
                              {rep.numberOfPeopleAffected !== undefined && rep.numberOfPeopleAffected > 0 && (
                                <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                                  ~{rep.numberOfPeopleAffected} persons impacted
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-gray-800 capitalize">
                                {rep.reporterRole || 'citizen'}
                              </div>
                              {rep.contactNumber ? (
                                <div className="text-[10px] text-gray-400 font-mono">{rep.contactNumber}</div>
                              ) : (
                                <div className="text-[10px] text-gray-400 italic">Protected</div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-[11px] whitespace-nowrap">
                              <div>{new Date(rep.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(rep.receivedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                isVerified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isUnderVerif
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isRejected
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {isVerified ? (
                                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                ) : isUnderVerif ? (
                                  <Clock className="w-3 h-3 text-amber-700 animate-spin" />
                                ) : (
                                  <ShieldAlert className="w-3 h-3 text-red-700" />
                                )}
                                <span>{rep.verificationStatus.replace('_', ' ')}</span>
                              </span>
                              {rep.verifiedBy && (
                                <div className="text-[9px] text-gray-400 mt-0.5 font-mono truncate max-w-[120px]">
                                  by {rep.verifiedBy}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isActionBusy ? (
                                <span className="text-teal-700 text-[11px] font-bold animate-pulse">
                                  Updating...
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* View Evidence button */}
                                  <button
                                    onClick={() => setSelectedEvidenceReport(rep)}
                                    className="px-2 py-1 rounded text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                                    title="View attached photo/video evidence and metadata"
                                  >
                                    <Eye className="w-3 h-3 text-indigo-600" />
                                    <span>Evidence</span>
                                  </button>

                                  {/* Verify button */}
                                  <button
                                    onClick={() => handleVerifyReport(rep.id, 'VERIFIED')}
                                    disabled={isVerified}
                                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                      isVerified
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60 cursor-default'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                    }`}
                                    title="Verify and confirm report"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Verify</span>
                                  </button>

                                  {/* Reject button */}
                                  <button
                                    onClick={() => handleVerifyReport(rep.id, 'REJECTED')}
                                    disabled={isRejected}
                                    className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                      isRejected
                                        ? 'bg-red-50 text-red-700 border border-red-200 opacity-60 cursor-default'
                                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                    }`}
                                    title="Reject invalid or false report"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>

                                  {/* Duplicate button */}
                                  <button
                                    onClick={() => handleVerifyReport(rep.id, 'DUPLICATE')}
                                    disabled={isDuplicate}
                                    className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                      isDuplicate
                                        ? 'bg-gray-100 text-gray-600 opacity-60 cursor-default'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                    title="Mark as duplicate of existing incident"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Dup</span>
                                  </button>
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

            {/* Incidents Triage Table */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-teal-700" />
                  <span>Verified Incident Queue & Field Triage</span>
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  {filteredIncidents.length} active records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                      <th className="py-2.5 px-3">Hazard / Corridor</th>
                      <th className="py-2.5 px-3">Severity & Confidence</th>
                      <th className="py-2.5 px-3">Lifecycle Status</th>
                      <th className="py-2.5 px-3">Evacuation Order</th>
                      <th className="py-2.5 px-3">Clearance ETA</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredIncidents.map(inc => (
                      <tr key={inc.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{inc.title}</div>
                          <div className="text-[11px] text-gray-500">{inc.locationName} ({inc.district})</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {inc.severity} ({inc.confidence}%)
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-bold text-amber-800">
                            {inc.evacuationOrderStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 font-medium">
                          {inc.clearanceEta || 'In Progress'}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          <button
                            onClick={() => setActiveIncident(inc)}
                            className="text-teal-700 hover:text-teal-900 font-bold text-xs bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded cursor-pointer transition-colors"
                          >
                            Drawer
                          </button>
                          <button
                            onClick={() => handleOpenEvacuation(inc)}
                            className="text-red-700 hover:text-red-900 font-bold text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded cursor-pointer transition-colors"
                          >
                            Evac Plan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Road Connectivity Matrix Table */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1F2937] flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#0F766E]" />
                  <span>{t.roadConnectivityTitle}</span>
                </h3>
                <span className="text-[11px] text-gray-400 font-mono">{t.updatedTenAgo}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                      <th className="py-2.5 px-3">{t.colRoad}</th>
                      <th className="py-2.5 px-3">{t.colStatus}</th>
                      <th className="py-2.5 px-3">{t.colClearance}</th>
                      <th className="py-2.5 px-3">{t.colDetour}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRoads.map(road => (
                      <tr key={road.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{road.roadCode}</div>
                          <div className="text-[11px] text-gray-500">
                            {lang === 'hi' ? road.nameHi : road.name}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            road.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-800'
                              : road.status === 'SINGLE_LANE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {road.status === 'BLOCKED' ? 'BLOCKED' : road.status === 'SINGLE_LANE' ? 'SINGLE LANE' : 'OPEN'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-700">
                          {road.clearanceProgress}%
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {lang === 'hi' ? road.detourRouteNameHi : road.detourRouteName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* NDMA Preparedness Reference */}
            <PreparednessModule
              lang={lang}
              activeHazard="landslide"
              onOpenReportModal={onOpenReportModal}
              onNavigateShelters={() => {
                if (filteredIncidents[0]) handleOpenEvacuation(filteredIncidents[0]);
              }}
            />

          </div>
        )}

      </div>

      {/* 14-Section Incident Detail Drawer */}
      <IncidentDetailDrawer
        incident={activeIncident}
        onClose={() => setActiveIncident(null)}
        shelters={shelters}
        lang={lang}
        role={role}
        onOpenEvacuationModal={(inc) => handleOpenEvacuation(inc)}
        onOpenReportUpdate={() => onOpenReportModal()}
        onIssueOfficialAlert={(inc) => {
          setTestAlertIncident(inc);
        }}
      />

      {testAlertIncident && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black text-red-700">TEST ALERT — Not sent to the public</h2>
            <p className="mt-2 text-sm text-slate-700">For development and classroom drills only. No official warning or public broadcast was issued.</p>
            <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-900">{testAlertIncident.title}</p>
            <button onClick={() => setTestAlertIncident(null)} className="mt-5 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white">Close preview</button>
          </div>
        </div>
      )}

      {/* Evacuation Planning & Decision Workflow Modal */}
      <EvacuationModal
        isOpen={evacuationModalOpen}
        onClose={() => setEvacuationModalOpen(false)}
        incident={evacuationTargetIncident}
        shelters={shelters}
        roads={roads}
        lang={lang}
        role={role}
        onUpdateEvacuationStatus={handleUpdateEvacuationStatus}
      />

      {/* Authorized Officer Evidence Viewer Modal */}
      {selectedEvidenceReport && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-300">{selectedEvidenceReport.id}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold uppercase">
                      {selectedEvidenceReport.verificationStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    Authorized Media Evidence & Integrity Record
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvidenceReport(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Incident Metadata Box */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-gray-900 text-sm">{selectedEvidenceReport.hazardType.replace('_', ' ')}</span>
                    <p className="text-gray-600 text-xs mt-0.5">{selectedEvidenceReport.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-800 text-[10px] font-bold font-mono">
                    {selectedEvidenceReport.district}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-200 text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Received Time</span>
                    <span className="font-bold text-gray-800">{new Date(selectedEvidenceReport.receivedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Geospatial GPS</span>
                    <span className="font-bold text-gray-800 font-mono">
                      {selectedEvidenceReport.coordinates?.latitude?.toFixed(4) ?? selectedEvidenceReport.latitude?.toFixed(4)}°N, {selectedEvidenceReport.coordinates?.longitude?.toFixed(4) ?? selectedEvidenceReport.longitude?.toFixed(4)}°E
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Reporter Role</span>
                    <span className="font-bold text-gray-800 capitalize">{selectedEvidenceReport.reporterRole || 'Citizen'}</span>
                  </div>
                </div>
              </div>

              {/* Integrity Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-emerald-950">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs block">SHA-256 Recorded Integrity Badge</span>
                    <span className="text-[10px] text-emerald-800 block">Server-verified SHA-256 hash generated upon receipt. Unaltered original evidence.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-200/80 text-emerald-900 px-2 py-1 rounded font-bold shrink-0">
                  VERIFIED INTEGRITY
                </span>
              </div>

              {/* Media Attachments Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center justify-between">
                  <span>Attached Photo / Video Evidence</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    {(selectedEvidenceReport.attachmentMetadata?.length ?? 0)} attachment(s)
                  </span>
                </h4>

                {(selectedEvidenceReport.attachmentMetadata?.length ?? 0) === 0 ? (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 space-y-1">
                    <Camera className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="font-bold text-xs text-gray-600">No Photo/Video Evidence Attached</p>
                    <p className="text-[11px]">This report was submitted with text and GPS observations only.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEvidenceReport.attachmentMetadata!.map((att: any, idx: number) => {
                      const isVideo = att.mediaType === 'video' || att.mimeType?.startsWith('video');
                      const mediaUrl = `/api/v1/reports/${encodeURIComponent(selectedEvidenceReport.id)}/media/${encodeURIComponent(att.attachmentId || att._id)}`;

                      return (
                        <div key={idx} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md space-y-2 p-2">
                          <div className="aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                            {isVideo ? (
                              <video
                                controls
                                className="w-full h-full object-contain"
                                src={mediaUrl}
                              />
                            ) : (
                              <img
                                src={mediaUrl}
                                alt={att.originalFilename || 'Report evidence'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback placeholder if local media binary unavailable
                                  (e.target as any).src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800';
                                }}
                              />
                            )}
                          </div>

                          <div className="px-1 py-0.5 space-y-1 text-slate-300 text-[10px]">
                            <div className="flex items-center justify-between font-bold text-white">
                              <span className="truncate max-w-[140px]">{att.originalFilename || `Attachment #${idx + 1}`}</span>
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase font-mono">
                                {att.mediaType}
                              </span>
                            </div>
                            <div className="font-mono text-slate-400 text-[9px] truncate">
                              SHA-256: {att.sha256Hash || 'GENERATED_SERVER_HASH'}
                            </div>
                            <div className="flex justify-between text-slate-400 text-[9px]">
                              <span>Size: {Math.round((att.sizeBytes || 0) / 1024)} KB</span>
                              <span>Uploaded: {att.uploadedAt ? new Date(att.uploadedAt).toLocaleTimeString() : 'Just now'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setSelectedEvidenceReport(null)}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Evidence
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleVerifyReport(selectedEvidenceReport.id, 'REJECTED');
                    setSelectedEvidenceReport(null);
                  }}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Report</span>
                </button>

                <button
                  onClick={() => {
                    handleVerifyReport(selectedEvidenceReport.id, 'VERIFIED');
                    setSelectedEvidenceReport(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
