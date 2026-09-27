import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Camera, Clock, CheckCircle2, AlertTriangle,
  Loader2, FileText, Printer, Info, Hash, Radio,
  BarChart2, Star, XCircle, RefreshCw
} from 'lucide-react';
import type { Language } from '../types';

interface ProofToProtectionPageProps {
  lang?: Language;
}

interface ReportRecord {
  serverReportId: string;
  clientReportId?: string;
  hazardType: string;
  description: string;
  district: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  roadCondition?: string;
  numberOfPeopleAffected?: number;
  reporterRole?: string;
  status?: string;
  verificationStatus?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  captureTimestamp?: string;
  receivedAt?: string;
  attachmentMetadata?: any[];
  source?: string;
  dataFreshness?: string;
}

interface EvidenceConfidenceFactors {
  mediaFactor: number;
  gpsFactor: number;
  freshnessFactor: number;
  corroborationFactor: number;
  officerVerificationFactor: number;
  total: number;
}

function computeEvidenceConfidence(report: ReportRecord, corroboratingCount: number): EvidenceConfidenceFactors {
  const hasMedia = (report.attachmentMetadata?.length ?? 0) > 0;
  const hasGps = !!report.latitude && !!report.longitude;
  const captureTime = report.captureTimestamp ?? report.receivedAt;
  const ageHours = captureTime ? (Date.now() - new Date(captureTime).getTime()) / 3600000 : 48;
  const isVerified = report.verificationStatus === 'VERIFIED';

  const mediaFactor = hasMedia ? 25 : 0;
  const gpsFactor = hasGps ? 20 : 5;
  const freshnessFactor = ageHours < 1 ? 20 : ageHours < 6 ? 15 : ageHours < 24 ? 10 : 5;
  const corroborationFactor = corroboratingCount > 2 ? 20 : corroboratingCount > 0 ? 10 : 0;
  const officerVerificationFactor = isVerified ? 15 : 0;
  const total = mediaFactor + gpsFactor + freshnessFactor + corroborationFactor + officerVerificationFactor;

  return { mediaFactor, gpsFactor, freshnessFactor, corroborationFactor, officerVerificationFactor, total };
}

function computeAccessImpactScore(report: ReportRecord, confidence: number): {
  score: number;
  factors: Array<{ label: string; weight: number; rawScore: number; contribution: number }>;
} {
  const hazardRisk = 70; // placeholder from risk engine
  const roadImpact = report.roadCondition === 'CLOSED' || report.roadCondition === 'BLOCKED' ? 80 : report.roadCondition === 'PARTIALLY_BLOCKED' ? 50 : 20;
  const populationExposure = Math.min(100, ((report.numberOfPeopleAffected ?? 1) / 500) * 100);
  const evidenceConfidence = confidence;
  const responseDelay = 30; // placeholder minutes-based delay score

  const factors = [
    { label: 'Hazard Risk', weight: 0.35, rawScore: hazardRisk, contribution: 0.35 * hazardRisk },
    { label: 'Road Connectivity Impact', weight: 0.30, rawScore: roadImpact, contribution: 0.30 * roadImpact },
    { label: 'Population Exposure', weight: 0.15, rawScore: populationExposure, contribution: 0.15 * populationExposure },
    { label: 'Evidence Confidence', weight: 0.10, rawScore: evidenceConfidence, contribution: 0.10 * evidenceConfidence },
    { label: 'Response Delay Factor', weight: 0.10, rawScore: responseDelay, contribution: 0.10 * responseDelay }
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.contribution, 0));
  return { score, factors };
}

export const ProofToProtectionPage: React.FC<ProofToProtectionPageProps> = ({ lang: _lang = 'en' }) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/reports?limit=20&sort=receivedAt:desc');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: ReportRecord[] = data?.data ?? [];
      setReports(list);
      if (!selectedReport && list.length > 0) {
        setSelectedReport(list[0]);
      }
    } catch (err: any) {
      setError(`Failed to load reports: ${err.message}. Ensure the backend server is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  }, [selectedReport]);

  useEffect(() => {
    fetchReports();
  }, []);

  // Compute derived analytics for the selected report
  const nearbyCount = reports.filter(r =>
    r.serverReportId !== selectedReport?.serverReportId &&
    r.district === selectedReport?.district &&
    r.hazardType === selectedReport?.hazardType
  ).length;

  const confidence = selectedReport ? computeEvidenceConfidence(selectedReport, nearbyCount) : null;
  const accessScore = (selectedReport && confidence) ? computeAccessImpactScore(selectedReport, confidence.total) : null;

  // Build timeline from audit timestamps
  const buildTimeline = (r: ReportRecord): Array<{ step: string; time: string; status: 'done' | 'pending' }> => {
    const fmt = (d?: string) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(d).toLocaleDateString() : '—';
    return [
      { step: 'Report Captured', time: fmt(r.captureTimestamp), status: 'done' },
      { step: 'Synced to PARVAAH', time: fmt(r.receivedAt), status: 'done' },
      { step: 'Assigned for Triage', time: r.status === 'ASSIGNED' ? 'Assigned' : '—', status: r.status === 'ASSIGNED' || r.verificationStatus === 'VERIFIED' ? 'done' : 'pending' },
      { step: 'Officer Verified', time: fmt(r.verifiedAt), status: r.verificationStatus === 'VERIFIED' ? 'done' : 'pending' },
      { step: 'Risk Recalculated', time: r.verificationStatus === 'VERIFIED' ? 'Auto-triggered' : '—', status: r.verificationStatus === 'VERIFIED' ? 'done' : 'pending' },
      { step: 'Action Bulletin Issued', time: r.verificationStatus === 'VERIFIED' ? 'Advisory generated' : '—', status: r.verificationStatus === 'VERIFIED' ? 'done' : 'pending' }
    ];
  };

  const generateBulletin = (r: ReportRecord): string => {
    const safeDate = r.receivedAt ? new Date(r.receivedAt).toISOString().split('T')[0] : 'YYYY-MM-DD';
    return `
╔══════════════════════════════════════════════════════════════╗
║          TEST / DEMO BULLETIN — NOT AN OFFICIAL ORDER        ║
╠══════════════════════════════════════════════════════════════╣
║  PARVAAH FIELD ACTION BULLETIN                               ║
║  District Disaster Management Authority (DDMA)               ║
╠══════════════════════════════════════════════════════════════╣
  Date/Time : ${safeDate}
  Report ID : ${r.serverReportId}
  Hazard    : ${r.hazardType}
  District  : ${r.district ?? '—'}, ${r.state ?? 'NE India'}
  Status    : ${r.verificationStatus ?? r.status ?? 'UNDER_VERIFICATION'}
  Location  : ${r.latitude?.toFixed(4) ?? '—'}°N, ${r.longitude?.toFixed(4) ?? '—'}°E
  Road      : ${r.roadCondition ?? 'UNKNOWN'}
  Affected  : ~${r.numberOfPeopleAffected ?? 0} persons
  
  ACTION REQUIRED:
  - Dispatch SDRF / PWD team for field assessment
  - Issue advisory to affected villages
  - Activate nearest open shelter if needed
  - Do NOT approach slope toe without SDRF clearance
  - Reassess road access every 2 hours
  
  Nearest Shelter: Contact DDMA Control Room — 1077
  Verified by    : ${r.verifiedBy ?? 'Pending Verification'}

╠══════════════════════════════════════════════════════════════╣
║  ⚠  THIS IS A TEST/DEMO BULLETIN FOR COLLEGE DRILL USE ONLY  ║
║  No actual evacuation orders are triggered by this system.   ║
╚══════════════════════════════════════════════════════════════╝
`.trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proof → Protection Chain</h1>
              <p className="text-xs text-gray-500 font-medium">From citizen evidence to verified field action — PARVAAH's key differentiator</p>
            </div>
          </div>
          <button
            id="proof-to-protection-refresh-btn"
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Report</p>
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading reports…
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs px-4">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    No reports found. Submit a citizen report first.
                  </div>
                ) : (
                  reports.map((r, i) => (
                    <button
                      key={r.serverReportId}
                      id={`proof-report-select-${i}`}
                      onClick={() => setSelectedReport(r)}
                      className={`w-full text-left px-4 py-3 transition-colors ${selectedReport?.serverReportId === r.serverReportId ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-gray-900 truncate">{r.serverReportId}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ml-1 ${
                          r.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                          r.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{r.verificationStatus ?? r.status ?? 'PENDING'}</span>
                      </div>
                      <p className="text-[11px] text-gray-500">{r.hazardType?.toLowerCase().replace('_', ' ')} · {r.district}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Analysis Panel */}
          <div className="lg:col-span-3 space-y-5">
            {!selectedReport ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-24 text-center px-6">
                <div>
                  <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Select a report from the list to view the Proof → Protection chain</p>
                </div>
              </div>
            ) : (
              <>
                {/* Section 1: Evidence Receipt */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    <h2 className="font-bold text-gray-900">1. Evidence Receipt</h2>
                  </div>
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Report ID', value: selectedReport.serverReportId, mono: true },
                        { label: 'Hazard Type', value: selectedReport.hazardType?.replace('_', ' '), mono: false },
                        { label: 'Lifecycle Status', value: selectedReport.verificationStatus ?? selectedReport.status ?? '—', mono: false },
                        { label: 'Captured', value: selectedReport.captureTimestamp ? new Date(selectedReport.captureTimestamp).toLocaleString() : '—', mono: false },
                        { label: 'Received', value: selectedReport.receivedAt ? new Date(selectedReport.receivedAt).toLocaleString() : '—', mono: false },
                        { label: 'GPS Location', value: `${selectedReport.latitude?.toFixed(4) ?? '—'}°N, ${selectedReport.longitude?.toFixed(4) ?? '—'}°E`, mono: true },
                        { label: 'District', value: selectedReport.district ?? '—', mono: false },
                        { label: 'Road Condition', value: selectedReport.roadCondition ?? '—', mono: false },
                        { label: 'Sync State', value: selectedReport.source?.includes('OFFLINE') ? 'OFFLINE QUEUED' : 'LIVE REST API', mono: true }
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{item.label}</p>
                          <p className={`text-xs font-bold text-gray-800 mt-0.5 ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Attachments */}
                    <div className="mt-4">
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-2">Evidence Files</p>
                      {(selectedReport.attachmentMetadata?.length ?? 0) === 0 ? (
                        <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-400">
                          <Camera className="w-4 h-4" />
                          <span>No media attachments in this report.</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.attachmentMetadata!.map((a: any, i: number) => (
                            <div key={i} className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                              <Camera className="w-3.5 h-3.5 text-indigo-600" />
                              <div>
                                <p className="text-xs font-semibold text-indigo-800">{a.mediaType === 'video' ? '🎥' : '📷'} {a.originalFilename ?? `Attachment ${i + 1}`}</p>
                                {a.sha256Hash && (
                                  <p className="text-[10px] font-mono text-indigo-500">SHA-256: {a.sha256Hash.slice(0, 16)}…</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Evidence Confidence Engine */}
                {confidence && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <h2 className="font-bold text-gray-900">2. Evidence Confidence Engine</h2>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${confidence.total >= 70 ? 'bg-emerald-500' : confidence.total >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${confidence.total}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{confidence.total}/100</span>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { label: 'Media Attached', score: confidence.mediaFactor, max: 25 },
                          { label: 'GPS Quality', score: confidence.gpsFactor, max: 20 },
                          { label: 'Freshness', score: confidence.freshnessFactor, max: 20 },
                          { label: 'Corroboration', score: confidence.corroborationFactor, max: 20 },
                          { label: 'Officer Verified', score: confidence.officerVerificationFactor, max: 15 }
                        ].map(f => (
                          <div key={f.label} className="text-center">
                            <div className="relative w-12 h-12 mx-auto mb-2">
                              <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                <circle
                                  cx="18" cy="18" r="15.9" fill="none"
                                  stroke={f.score === f.max ? '#10b981' : f.score > 0 ? '#f59e0b' : '#d1d5db'}
                                  strokeWidth="3"
                                  strokeDasharray={`${(f.score / f.max) * 100} 100`}
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-700">{f.score}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium leading-tight">{f.label}</p>
                            <p className="text-[10px] text-gray-400">/{f.max}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Corroboration Detection */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-purple-600" />
                    <h2 className="font-bold text-gray-900">3. Corroboration Detection</h2>
                  </div>
                  <div className="px-5 py-4">
                    {nearbyCount > 0 ? (
                      <div className="flex items-start space-x-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-purple-900">
                            {nearbyCount} corroborating report{nearbyCount > 1 ? 's' : ''} detected
                          </p>
                          <p className="text-xs text-purple-700 mt-1">
                            Reports from same district ({selectedReport.district}) with same hazard type ({selectedReport.hazardType?.toLowerCase().replace('_', ' ')}) strengthen this event's risk signal. Reports are not auto-merged — field verification confirms the cluster.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        <span>No corroborating reports from same district and hazard type within the loaded dataset. More reports from field officers would strengthen this signal.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Dynamic Access Impact Score */}
                {accessScore && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BarChart2 className="w-4 h-4 text-rose-600" />
                        <h2 className="font-bold text-gray-900">4. Dynamic Access Impact Score</h2>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-gray-900">{accessScore.score}</span>
                        <span className="text-xs text-gray-400">/100</span>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="space-y-3 mb-4">
                        {accessScore.factors.map(f => (
                          <div key={f.label}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-700">{f.label} <span className="text-gray-400">({(f.weight * 100).toFixed(0)}%)</span></span>
                              <span className="text-xs font-bold text-gray-800">{f.contribution.toFixed(1)} pts</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all"
                                style={{ width: `${Math.min(f.rawScore, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 italic">
                        This composite score is for decision-support planning only. Weights: Hazard Risk 35%, Road Connectivity 30%, Population Exposure 15%, Evidence Confidence 10%, Response Delay 10%. Not an official authority score.
                      </p>
                    </div>
                  </div>
                )}

                {/* Section 5: Incident Replay Timeline */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h2 className="font-bold text-gray-900">5. Incident Replay Timeline</h2>
                  </div>
                  <div className="px-5 py-5">
                    <div className="relative">
                      {buildTimeline(selectedReport).map((step, i, arr) => (
                        <div key={i} className="flex items-start space-x-4 mb-4 last:mb-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'done' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                              {step.status === 'done' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                              )}
                            </div>
                            {i < arr.length - 1 && (
                              <div className={`w-0.5 h-6 mt-1 ${step.status === 'done' ? 'bg-emerald-200' : 'bg-gray-100'}`} />
                            )}
                          </div>
                          <div className="pb-1">
                            <p className={`text-sm font-semibold ${step.status === 'done' ? 'text-gray-900' : 'text-gray-400'}`}>{step.step}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 6: Offline Action Bulletin */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <h2 className="font-bold text-gray-900">6. Offline Action Bulletin</h2>
                    </div>
                    <button
                      id="print-action-bulletin-btn"
                      onClick={() => setPrintMode(!printMode)}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{printMode ? 'Close Bulletin' : 'View Bulletin'}</span>
                    </button>
                  </div>
                  {printMode && (
                    <div className="px-5 py-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-semibold">
                          TEST / DEMO BULLETIN — For college drill and preparedness training only. No actual evacuation orders are issued by this system.
                        </p>
                      </div>
                      <pre className="text-[11px] font-mono bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {generateBulletin(selectedReport)}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start space-x-3">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Decision-Support Advisory:</strong> The Proof → Protection chain is a practice prototype for college demonstration. Evidence confidence scores, access impact scores, and action bulletins are decision-support tools. No actual public emergency alerts are sent; no official evacuation orders are automatically issued.
          </p>
        </div>
      </div>
    </div>
  );
};
