import { useState, useEffect } from 'react';
import type { Language, UserRole, PageState, SystemMode, LandslideIncident } from './types';
import { INITIAL_INCIDENTS, INITIAL_SENSORS, INITIAL_SHELTERS, INITIAL_ROADS, SYSTEM_ALERTS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StateIndicatorBar } from './components/StateIndicatorBar';
import { ReportModal } from './components/ReportModal';
import { LanguageSelectionModal } from './components/LanguageSelectionModal';
import { AlertBanner } from './components/alerts/AlertBanner';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { IntegrationHealthPage } from './pages/IntegrationHealthPage';
import { EmptyStatePage } from './pages/EmptyStatePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RiskSimulatorPage } from './pages/RiskSimulatorPage';
import { OperationalTelemetryPage } from './pages/OperationalTelemetryPage';
import { DistrictOfficerRiskPage } from './pages/DistrictOfficerRiskPage';
import { ProofToProtectionPage } from './pages/ProofToProtectionPage';
import { RedZonesRelocationPage } from './pages/RedZonesRelocationPage';
import { AboutPage } from './pages/AboutPage';

import { DashboardSkeleton } from './components/skeleton/DashboardSkeleton';
import { LandingSkeleton } from './components/skeleton/LandingSkeleton';
import { fetchIncidents } from './api/incidents';
import { submitCitizenReport } from './api/reports';
import { ScenarioSimulatorModal } from './components/admin/ScenarioSimulatorModal';
import { clearDemoState, fetchScenarios } from './api/scenarios';
import { ApiDebugPanel, type ApiDebugInfo } from './components/common/ApiDebugPanel';
import type { ScenarioRecord } from './types';

export function App() {

  // Global State with localStorage Language Persistence
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parvaah_language');
      if (saved === 'en' || saved === 'hi' || saved === 'as' || saved === 'bn' || saved === 'ne') {
        return saved as Language;
      }
    }
    return 'en';
  });

  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('parvaah_language');
    }
    return false;
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parvaah_language', newLang);
    }
  };

  const [role, setRole] = useState<UserRole>('citizen');

  const [currentPage, setCurrentPage] = useState<PageState>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/admin/overview' || p === '/overview') return 'landing';
      if (p === '/admin/map' || p === '/map') return 'dashboard';
      if (p === '/admin/district-risk' || p === '/district-risk') return 'district-risk';
      if (p === '/admin/relocation' || p === '/relocation' || p === '/red-zones') return 'red-zones';
      if (p === '/admin/proof-protection' || p === '/proof-to-protection') return 'proof-to-protection';
      if (p === '/admin/clear-state-demo') return 'empty';
      if (p === '/admin/telemetry') return 'telemetry';
      if (p === '/admin/risk-simulator') return 'risk-simulator';
      if (p === '/about') return 'about';
      if (p === '/auth/signin' || p === '/login') return 'login';
    }
    return 'landing';
  });

  const [systemMode, setSystemMode] = useState<SystemMode>('live');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioRecord | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync route and path on browser back/forward and initial navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin/overview' || path === '/overview') {
        setCurrentPage('landing');
      } else if (path === '/admin/map' || path === '/map') {
        setCurrentPage('dashboard');
      } else if (path === '/admin/district-risk') {
        setCurrentPage('district-risk');
      } else if (path === '/admin/relocation' || path === '/relocation' || path === '/red-zones') {
        setCurrentPage('red-zones');
      } else if (path === '/admin/proof-protection' || path === '/proof-to-protection') {
        setCurrentPage('proof-to-protection');
      } else if (path === '/admin/clear-state-demo') {
        setCurrentPage('empty');
      } else if (path === '/admin/telemetry') {
        setCurrentPage('telemetry');
      } else if (path === '/admin/risk-simulator') {
        setCurrentPage('risk-simulator');
      } else if (path === '/about') {
        setCurrentPage('about');
      } else if (path === '/auth/signin' || path === '/login') {
        setCurrentPage('login');
      } else if (path === '/report') {
        setReportModalOpen(true);
      } else if (path === '/') {
        setCurrentPage('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    fetchScenarios()
      .then(res => {
        if (res && res.success) {
          setActiveScenario(res.activeScenario);
        }
      })
      .catch(() => {});
  }, []);

  // Dynamic Incidents & Roads with Local Fallback Baseline
  const [incidents, setIncidents] = useState<LandslideIncident[]>(INITIAL_INCIDENTS);
  const [roads] = useState(INITIAL_ROADS);

  // Fetch incidents from Backend API on mount & on district change
  useEffect(() => {
    let isMounted = true;

    async function loadBackendIncidents() {
      try {
        const response = await fetchIncidents(selectedDistrict);
        if (isMounted && response && response.success && Array.isArray(response.data)) {
          const normalized: LandslideIncident[] = response.data.map(raw => {
            const lat = raw.coordinates?.latitude ?? 26.9;
            const lng = raw.coordinates?.longitude ?? 88.47;
            return {
              id: raw.id,
              hazardType: String(raw.hazardType || 'landslide').toLowerCase() as any,
              title: raw.title,
              titleHi: (raw as any).titleHi || raw.title,
              locationName: `${raw.district || 'Regional'} Corridor`,
              locationNameHi: `${raw.district || 'Regional'} गलियारा`,
              description: raw.description || 'Hazard reported along corridor.',
              descriptionHi: (raw as any).descriptionHi || raw.description || 'आपदा की सूचना।',
              status: (raw.status || 'ACTIVE') as any,
              verificationStatus: (raw.verificationStatus || 'DEMO') as any,
              severity: (raw.severity || 'HIGH') as any,
              riskLevel: (raw.severity || 'HIGH') as any,
              confidence: raw.confidence || 90,
              source: raw.source || 'DEMO_DATA',
              isDemo: raw.isDemo ?? true,
              createdAt: raw.createdAt || new Date().toISOString(),
              updatedAt: raw.updatedAt || new Date().toISOString(),
              freshness: (raw.dataFreshness === 'AGING' || raw.dataFreshness === 'STALE') ? raw.dataFreshness : 'FRESH',
              coordinates: [lat, lng],
              latitude: lat,
              longitude: lng,
              district: raw.district || 'all',
              state: raw.state || 'North East India',
              roadId: 'RD-NH',
              roadName: `${raw.state || 'Regional'} Highway`,
              roadStatus: raw.roadStatus === 'CLOSED' ? 'BLOCKED' : raw.roadStatus === 'PARTIALLY_BLOCKED' ? 'SINGLE_LANE' : 'OPEN',
              clearanceEta: 'In Progress (Demo)',
              rainfall24h: raw.rainfall24hMm || 120,
              rainfallForecast: raw.forecastRainfall24hMm ? `${raw.forecastRainfall24hMm}mm expected next 24h` : 'Intermittent showers',
              soilMoisture: raw.soilMoisturePercent || 80,
              slope: raw.slopeDegrees || 35,
              evacuationLevel: (raw.evacuationRecommendation as any) || 'ADVISORY',
              evacuationOrderStatus: (raw.officialEvacuationStatus as any) || 'PREPARE',
              nearestShelterId: raw.nearestShelterId || 'SHL-01',
              affectedVillagesCount: 3,
              affectedPopulationEstimate: 800,
              recommendedActions: raw.recommendedActions || ['Follow official broadcasts and emergency helplines.'],
              assignedAgency: raw.assignedAgency || 'Disaster Operations (Demo)',
              assignedOfficer: raw.assignedOfficer || 'Duty Officer (Demo)',
              reportedAt: (raw as any).reportedAt || 'Just now',
              verifiedBy: (raw as any).verifiedBy || raw.assignedOfficer || 'DDMA Verification Unit',
              reporterRole: ((raw as any).reporterRole || 'field_officer') as any,
              timeline: (raw.timeline || []).map((t: any) => ({
                time: t.time || '10:00 IST',
                author: t.author || 'Duty Officer',
                note: t.note || 'Observation recorded',
                statusChange: t.statusChange
              }))
            };
          });

          if (normalized.length > 0) {
            setIncidents(normalized);
          }
        }
      } catch (err) {
        // Graceful fallback to INITIAL_INCIDENTS if backend is temporarily unreachable
        console.warn('[App] Backend REST API query fallback to local demo baseline:', err);
      }
    }

    loadBackendIncidents();

    return () => {
      isMounted = false;
    };
  }, [selectedDistrict, activeScenario]);

  // Register Service Worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
      }).catch(err => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
    }
  }, []);

  // Automatic Offline / Online Synchronization Engine with IndexedDB
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      try {
        const { syncOfflineReportQueue } = await import('./services/offlineQueueService');
        const res = await syncOfflineReportQueue(submitCitizenReport);
        if (res.synced > 0) {
          setSuccessToast(`Online reconnect: ${res.synced} offline report(s) synchronized with District EOC.`);
          setTimeout(() => setSuccessToast(null), 5000);
        } else {
          setSuccessToast('Online connectivity restored. REST API telemetry active.');
          setTimeout(() => setSuccessToast(null), 3000);
        }
      } catch (err) {
        console.warn('[OfflineSync] IndexedDB sync error:', err);
        setSuccessToast('Online connectivity restored.');
        setTimeout(() => setSuccessToast(null), 3000);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSuccessToast('Network disconnected. Offline storage mode engaged.');
      setTimeout(() => setSuccessToast(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [lastPostDebug, setLastPostDebug] = useState<ApiDebugInfo['lastPostStatus']>(null);
  const [lastApiRequest, setLastApiRequest] = useState<{ method: string; path: string } | null>(null);
  const [lastApiStatus, setLastApiStatus] = useState<number | null>(null);
  const [lastApiRecords] = useState<number>(0);
  const [lastApiFetchTime, setLastApiFetchTime] = useState<string | null>(null);

  const handleAddReport = (newReport: LandslideIncident) => {
    setLastPostDebug({
      statusCode: 201,
      serverReportId: newReport.id,
      clientReportId: (newReport as any).clientReportId || newReport.id,
      timestamp: new Date().toLocaleTimeString(),
      isDuplicate: false
    });
    setLastApiRequest({ method: 'POST', path: '/api/v1/reports' });
    setLastApiStatus(201);
    setLastApiFetchTime(new Date().toLocaleTimeString());

    setSuccessToast(
      isOffline
        ? `Report stored in device offline queue (ID: ${newReport.id}).`
        : `Report #${newReport.id} registered! Queued under Field Officer triage.`
    );
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };


  const handleResetFilters = () => {
    setSelectedDistrict('all');
    setIncidents(INITIAL_INCIDENTS);
  };

  const handleClearDemoState = async () => {
    const confirmed = window.confirm('Clear active demo scenario? This will remove temporary simulated changes. It will not delete stored reports or official records.');
    if (!confirmed) return;
    try {
      const response = await clearDemoState();
      setActiveScenario(null);
      setSuccessToast(response.message);
      setCurrentPage('dashboard');
    } catch (error) {
      setSuccessToast(error instanceof Error ? `Clear state failed: ${error.message}` : 'Clear state failed.');
    }
    setTimeout(() => setSuccessToast(null), 5000);
  };



  // Page Content Component
  const renderPageContent = () => {
    if (systemMode === 'skeleton') {
      return currentPage === 'dashboard' ? <DashboardSkeleton lang={lang} /> : <LandingSkeleton />;
    }

    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            lang={lang}
            setCurrentPage={setCurrentPage}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        );
      case 'about':
        return (
          <AboutPage
            lang={lang}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'login':
        return (
          <LoginPage
            lang={lang}
            role={role}
            setRole={setRole}
            setCurrentPage={setCurrentPage}
            isOffline={isOffline}
          />
        );
      case 'dashboard':
        return (
          <DashboardPage
            lang={lang}
            role={role}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            incidents={incidents}
            sensors={INITIAL_SENSORS}
            shelters={INITIAL_SHELTERS}
            roads={roads}
            isOffline={isOffline}
            onOpenReportModal={() => setReportModalOpen(true)}
            onNavigateToIntegrationHealth={() => setCurrentPage('integration-health')}
            onOpenScenarioSimulator={() => setScenarioModalOpen(true)}
          />
        );
      case 'district-risk':
        return (
          <DistrictOfficerRiskPage
            lang={lang}
            onNavigateToProofToProtection={() => setCurrentPage('proof-to-protection')}
          />
        );
      case 'red-zones':
        return <RedZonesRelocationPage lang={lang} />;
      case 'proof-to-protection':
        return <ProofToProtectionPage lang={lang} />;
      case 'telemetry':
        return <OperationalTelemetryPage />;
      case 'risk-simulator':
        return <RiskSimulatorPage />;
      case 'integration-health':
        return <IntegrationHealthPage lang={lang} />;
      case 'empty':
        return (
          <EmptyStatePage
            lang={lang}
            setCurrentPage={setCurrentPage}
            onResetFilters={handleResetFilters}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        );
      case '404':
        return <NotFoundPage lang={lang} setCurrentPage={setCurrentPage} />;
      default:
        return (
          <LandingPage
            lang={lang}
            setCurrentPage={setCurrentPage}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F5] flex flex-col font-sans text-[#1F2937] selection:bg-[#DFF4F1] selection:text-[#0F766E]">
      
      {/* Top Demo Interactive State Bar */}
      <StateIndicatorBar
        systemMode={systemMode}
        setSystemMode={setSystemMode}
        lang={lang}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        successToast={successToast}
        setSuccessToast={setSuccessToast}
        onOpenScenarioSimulator={() => setScenarioModalOpen(true)}
        activeScenario={activeScenario}
      />

      {/* Main Navbar — all routes */}
      <Navbar
        lang={lang}
        setLang={setLang}
        role={role}
        setRole={setRole}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOffline={isOffline}
        onOpenReportModal={() => setReportModalOpen(true)}
        onOpenLanguageModal={() => setShowLanguageModal(true)}
        onClearDemoState={handleClearDemoState}
      />

      {/* Multilingual Emergency Alert Banner */}
      <AlertBanner
        alerts={SYSTEM_ALERTS}
        lang={lang}
        onViewIncidentAlert={(alert) => {
          setCurrentPage('dashboard');
          if (alert.district) setSelectedDistrict(alert.district);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {renderPageContent()}
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Ground Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        lang={lang}
        role={role}
        isOffline={isOffline}
        onSubmitReport={handleAddReport}
      />

      {/* Scenario Simulator Modal for College Drills */}
      <ScenarioSimulatorModal
        isOpen={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
        onScenarioChange={(sc) => setActiveScenario(sc)}
      />

      {/* First-Visit / Explicit Language Selection Modal */}
      <LanguageSelectionModal
        isOpen={showLanguageModal}
        currentLang={lang}
        onSelectLanguage={(selected) => {
          setLang(selected);
          setShowLanguageModal(false);
        }}
        onClose={() => setShowLanguageModal(false)}
        isFirstVisit={typeof window !== 'undefined' ? !localStorage.getItem('parvaah_language') : false}
      />

      {/* Development Operational Telemetry & DB Debug Panel */}
      <ApiDebugPanel
        debugInfo={{
          lastPostStatus: lastPostDebug,
          currentRole: role,
          activeDistrict: selectedDistrict,
          activeStatusFilter: 'UNDER_VERIFICATION',
          lastFetchTimestamp: lastApiFetchTime,
          lastRequest: lastApiRequest,
          lastHttpStatus: lastApiStatus,
          recordsLoaded: lastApiRecords,
          dataMode: (import.meta.env.VITE_DATA_MODE as string) || 'demo',
          getReportsCount: lastApiRecords,
          reportIdsLoaded: []
        }}
        onRefreshTelemetry={() => {
          setLastApiFetchTime(new Date().toLocaleTimeString());
        }}
      />

    </div>
  );
}

export default App;
