import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Video, 
  AlertTriangle, 
  CheckCircle, 
  WifiOff, 
  MapPin, 
  Save, 
  RefreshCw,
  Info,
  Mic,
  MicOff,
  Trash2
} from 'lucide-react';
import type { Language, LandslideIncident, UserRole, HazardType } from '../types';
import { DISTRICTS } from '../data/mockData';
import { saveReportToOfflineQueue } from '../services/api/dataIntegrationService';
import { submitCitizenReport } from '../api/reports';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  role: UserRole;
  isOffline: boolean;
  onSubmitReport: (newReport: LandslideIncident) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  lang,
  role,
  isOffline,
  onSubmitReport,
}) => {
  const [district, setDistrict] = useState('east_sikkim');
  const [hazardType, setHazardType] = useState<HazardType>('landslide');
  const [roadName, setRoadName] = useState('');
  const [roadCondition, setRoadCondition] = useState<'OPEN' | 'PARTIAL' | 'BLOCKED' | 'UNKNOWN'>('BLOCKED');
  const [severity, setSeverity] = useState<'HIGH' | 'MODERATE' | 'LOW'>('HIGH');
  const [description, setDescription] = useState('');
  const [affectedPeopleCount, setAffectedPeopleCount] = useState<number>(5);
  const [reporterContact, setReporterContact] = useState('');
  const [isSafeToApproach, setIsSafeToApproach] = useState(false);
  
  // Speech-to-Text states
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>(lang === 'hi' ? 'hi-IN' : 'en-IN');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync speech language default when global lang changes
  useEffect(() => {
    setSpeechLang(lang === 'hi' ? 'hi-IN' : 'en-IN');
  }, [lang]);

  // Geolocation states
  const [latInput, setLatInput] = useState<string>('26.9012');
  const [lngInput, setLngInput] = useState<string>('88.4715');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsDisplay, setGpsDisplay] = useState<string>('');

  // Media uploads
  const [photoUploaded, setPhotoUploaded] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);


  // Automatically attempt real browser geolocation detection on open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && navigator.geolocation) {
      setIsDetectingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          const acc = Math.round(pos.coords.accuracy || 10);
          setLatInput(lat.toString());
          setLngInput(lng.toString());
          setGpsDisplay(`${lat}°N, ${lng}°E (Accuracy ±${acc}m)`);
          setIsDetectingGps(false);
        },
        () => {
          setLatInput('26.9012');
          setLngInput('88.4715');
          setGpsDisplay('26.9012°N, 88.4715°E (Himalayan Default)');
          setIsDetectingGps(false);
        },
        { timeout: 6000 }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualDetectGps = () => {
    setIsDetectingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          const acc = Math.round(pos.coords.accuracy || 10);
          setLatInput(lat.toString());
          setLngInput(lng.toString());
          setGpsDisplay(`${lat}°N, ${lng}°E (Accuracy ±${acc}m)`);
          setIsDetectingGps(false);
        },
        () => {
          setIsDetectingGps(false);
        }
      );
    }
  };

  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

  const handleToggleSpeechRecognition = () => {
    setSpeechError(null);

    if (!SpeechRecognitionAPI) {
      setSpeechError('Voice input is not supported in this browser. Please type your report.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcriptBuffer = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcriptBuffer += event.results[i][0].transcript;
          }
        }
        if (transcriptBuffer.trim()) {
          setDescription(prev => (prev ? `${prev} ${transcriptBuffer.trim()}` : transcriptBuffer.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access or type your report.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please speak clearly into your microphone.');
        } else if (event.error === 'network') {
          setSpeechError('Speech recognition requires online connection in this browser. Please type your report.');
        } else {
          setSpeechError(`Voice input notice: ${event.error || 'Stopped'}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError('Voice input is not supported in this browser. Please type your report.');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('Photo size exceeds 10MB limit.');
        return;
      }
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoUploaded(url);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        setVideoError('Video exceeds maximum limit of 50MB.');
        return;
      }
      setVideoFile(file);
      setVideoName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const lat = parseFloat(latInput) || 26.9012;
    const lng = parseFloat(lngInput) || 88.4715;

    const clientReportId = `CLI-REP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Constructed incident strictly enters UNDER_VERIFICATION lifecycle
    const newReport: LandslideIncident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      hazardType,
      title: `${hazardType.replace('_', ' ').toUpperCase()}: ${roadName || 'Regional Mountain Pass'}`,
      titleHi: `${roadName || 'पहाड़ी मार्ग अवरोध'}`,
      district,
      state: 'North East India',
      locationName: roadName || 'Hill Corridor Pass',
      locationNameHi: roadName || 'पहाड़ी दर्रा मार्ग',
      coordinates: [lat, lng],
      latitude: lat,
      longitude: lng,
      severity,
      riskLevel: severity,
      // Strictly set to UNDER_VERIFICATION to never fabricate confirmed incident
      status: 'UNDER_VERIFICATION',
      verificationStatus: role === 'field_officer' ? 'COMMUNITY_CONFIRMED' : 'UNVERIFIED',
      confidence: role === 'field_officer' ? 82 : 65,
      source: isOffline ? 'OFFLINE CITIZEN QUEUE' : 'CITIZEN FIELD REPORT (UNDER VERIFICATION)',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      freshness: isOffline ? 'OFFLINE_SYNCED' : 'FRESH',
      roadId: 'RD-LOCAL',
      roadName: roadName || 'Regional Mountain Road',
      roadStatus: roadCondition === 'BLOCKED' ? 'BLOCKED' : roadCondition === 'PARTIAL' ? 'SINGLE_LANE' : 'OPEN',
      clearanceEta: 'Pending DDMA Triage Assessment',
      rainfall24h: 85,
      soilMoisture: 80,
      slope: 35,
      evacuationLevel: severity === 'HIGH' ? 'ADVISORY' : 'NONE',
      evacuationOrderStatus: 'NO_ADVICE',
      recommendedActions: [
        'Report placed under official triage by District Emergency Control.',
        'Avoid approaching the slope toe until SDRF / PWD confirms safety.'
      ],
      assignedAgency: 'District Disaster Management Authority (DDMA)',
      assignedOfficer: role === 'field_officer' ? 'Field Officer (Awaiting Dispatch)' : 'Citizen Triage Desk',
      affectedVillagesCount: 1,
      affectedPopulationEstimate: affectedPeopleCount,
      description: description || 'Hazard blockage reported by ground observer.',
      descriptionHi: description || 'स्थानीय नागरिक द्वारा अवरोध की सूचना दी गई।',
      photoUrl: photoUploaded || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
      timeline: [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: role === 'field_officer' ? 'Field Officer' : 'Citizen Reporter',
          note: isOffline ? 'Report saved to local device queue; will sync when network returns.' : 'Report submitted and logged to DDMA triage console.'
        }
      ],
      reportedAt: lang === 'hi' ? 'अभी-अभी' : 'Just now',
      verifiedBy: role === 'field_officer' ? 'Field Officer (Verification Pending)' : 'Awaiting SDMA Verification',
      reporterRole: role,
      citizenReportCount: 1,
    };

    setSubmitError(null);


    if (isOffline) {
      try {
        const { saveOfflineReport } = await import('../services/offlineQueueService');
        const attachmentBlobs: any[] = [];
        const attachmentMetadata: any[] = [];

        if (photoFile) {
          attachmentBlobs.push({ name: photoFile.name, type: photoFile.type, size: photoFile.size, blob: photoFile });
          attachmentMetadata.push({ fileName: photoFile.name, fileSizeBytes: photoFile.size, mimeType: photoFile.type });
        }
        if (videoFile) {
          attachmentBlobs.push({ name: videoFile.name, type: videoFile.type, size: videoFile.size, blob: videoFile });
          attachmentMetadata.push({ fileName: videoFile.name, fileSizeBytes: videoFile.size, mimeType: videoFile.type });
        }

        await saveOfflineReport({
          clientReportId,
          title: newReport.title,
          description: description || 'Hazard blockage reported by ground observer.',
          hazardType: hazardType.toUpperCase(),
          severity,
          latitude: lat,
          longitude: lng,
          district,
          state: 'North East India',
          roadCondition: roadCondition === 'BLOCKED' ? 'CLOSED' : roadCondition === 'PARTIAL' ? 'PARTIALLY_BLOCKED' : 'OPEN',
          numberOfPeopleAffected: affectedPeopleCount,
          contactNumber: reporterContact.trim() || undefined,
          reporterRole: role,
          selectedLanguage: lang,
          captureTimestamp: new Date().toISOString(),
          localCreatedAt: new Date().toISOString(),
          attachmentBlobs,
          attachmentMetadata,
          queueStatus: 'QUEUED_FOR_SYNC',
          retryCount: 0
        });

        setSubmitFeedback('Saved offline. Waiting for connection. It will automatically sync once mobile network returns.');
        onSubmitReport(newReport);
        setIsSubmitting(false);
        setTimeout(() => {
          setSubmitFeedback(null);
          onClose();
        }, 2800);
      } catch (err: any) {
        console.error('[ReportModal] IndexedDB save error:', err);
        setSubmitError('Failed to store report offline on device.');
        setIsSubmitting(false);
      }
    } else {
      // Submit to backend REST API, including any uploaded media evidence.
      try {
        const formData = new FormData();
        formData.append('clientReportId', clientReportId);
        formData.append('hazardType', hazardType.toUpperCase());
        formData.append('description', description || 'Hazard blockage reported by ground observer.');
        formData.append('latitude', String(lat));
        formData.append('longitude', String(lng));
        formData.append('district', district);
        formData.append('state', 'North East India');
        formData.append('roadCondition', roadCondition === 'BLOCKED' ? 'CLOSED' : roadCondition === 'PARTIAL' ? 'PARTIALLY_BLOCKED' : 'OPEN');
        formData.append('numberOfPeopleAffected', String(affectedPeopleCount));
        if (reporterContact.trim()) formData.append('contactNumber', reporterContact.trim());
        formData.append('reporterRole', role);
        formData.append('captureTimestamp', new Date().toISOString());
        if (photoFile) formData.append('photo', photoFile, photoFile.name);
        if (videoFile) formData.append('video', videoFile, videoFile.name);

        const res = await submitCitizenReport(formData);

        if (!res || !res.success) {
          throw new Error(res?.message || 'Failed to submit citizen report.');
        }

        const returnedId = res.serverReportId || res.clientReportId;
        newReport.id = returnedId;

        setSubmitFeedback(
          `Report successfully transmitted! Report ID: #${returnedId} (Status: UNDER_VERIFICATION). Queued in Field & District Officer triage console.`
        );

        onSubmitReport(newReport);
        setIsSubmitting(false);

        setTimeout(() => {
          setSubmitFeedback(null);
          onClose();
        }, 2800);
      } catch (err: any) {
        console.error('[ReportModal] API submission error:', err);
        setSubmitError(
          err.message || 'Submission failed. The disaster management service could not be reached. Please retry or check network connectivity.'
        );
        setIsSubmitting(false);
      }
    }
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  {role === 'field_officer' ? 'Official Field Observation' : 'Citizen Hazard Report'}
                </span>
                {isOffline && (
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline Mode Active
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                {lang === 'hi' ? 'मैदानी आपदा रिपोर्ट दर्ज करें' : 'Submit Ground Hazard Report'}
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Lifecycle Notice */}
        <div className="bg-teal-50 border-b border-teal-200 px-5 py-2.5 text-xs text-teal-950 flex items-center gap-2 font-medium">
          <Info className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <strong>Data Integrity:</strong> All reports enter <em>Under Verification</em> status and are cross-checked by district officers before public alert broadcast.
          </span>
        </div>

        {/* Form Body */}
        {submitFeedback ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-base font-black text-gray-900">Submission Recorded</h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto">{submitFeedback}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            
            {/* Real Submission Error Banner */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Transmission Error</div>
                  <div className="text-[11px] mt-0.5 leading-relaxed">{submitError}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        saveReportToOfflineQueue({
                          id: `INC-${Date.now().toString().slice(-4)}`,
                          hazardType,
                          title: `${hazardType.replace('_', ' ').toUpperCase()}: ${roadName || 'Local Road'}`,
                          description,
                          district,
                          state: 'North East India',
                          latitude: parseFloat(latInput) || 26.9012,
                          longitude: parseFloat(lngInput) || 88.4715,
                          coordinates: [parseFloat(latInput) || 26.9012, parseFloat(lngInput) || 88.4715],
                          severity,
                          status: 'UNDER_VERIFICATION',
                          verificationStatus: 'UNVERIFIED',
                          clientReportId: `CLI-OFF-${Date.now()}`
                        } as any);
                        setSubmitError(null);
                        setSubmitFeedback('Saved to offline storage queue. Report will sync automatically once server is reachable.');
                        setTimeout(() => {
                          setSubmitFeedback(null);
                          onClose();
                        }, 2500);
                      }}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded font-bold text-[10px] cursor-pointer"
                    >
                      Save to Offline Queue
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmitError(null)}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-red-200 text-gray-700 rounded font-bold text-[10px] cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            
            {/* 1. Hazard Type & Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hazard Type:
                </label>
                <select
                  value={hazardType}
                  onChange={e => setHazardType(e.target.value as HazardType)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                >
                  <option value="landslide">Landslide / Mudslide</option>
                  <option value="flash_flood">Flash Flood / Torrent</option>
                  <option value="river_flood">River Flood Inundation</option>
                  <option value="road_blockage">Road Blockage / Debris</option>
                  <option value="bridge_damage">Bridge Damage / Scour</option>
                  <option value="slope_crack">Slope Tension Crack</option>
                  <option value="cyclone">Cyclone / Severe Wind Damage</option>
                  <option value="infrastructure_failure">Infrastructure / Retaining Wall Collapse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observed Severity:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['LOW', 'MODERATE', 'HIGH'] as const).map(sev => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        severity === sev
                          ? sev === 'HIGH' ? 'bg-red-600 text-white border-red-600' : sev === 'MODERATE' ? 'bg-amber-600 text-white border-amber-600' : 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. District & Road Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Administrative District:
                </label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                >
                  {DISTRICTS.filter(d => d.id !== 'all').map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Road / Village / Landmark Name:
                </label>
                <input
                  type="text"
                  required
                  value={roadName}
                  onChange={e => setRoadName(e.target.value)}
                  placeholder="e.g. NH-10 KM 24 near Coronation Bridge"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* 3. Automatic GPS + Manual Pin Coordinates */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Geospatial Coordinates (WGS84)</span>
                </span>
                <button
                  type="button"
                  onClick={handleManualDetectGps}
                  className="text-teal-700 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'Detecting...' : 'Redetect GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-gray-500 block">Latitude (°N)</span>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latInput}
                    onChange={e => setLatInput(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Longitude (°E)</span>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lngInput}
                    onChange={e => setLngInput(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>
              {gpsDisplay && (
                <span className="text-[10px] text-gray-500 block font-mono">
                  {gpsDisplay}
                </span>
              )}
            </div>

            {/* 4. Description with Speech-to-Text */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-gray-700">
                  Detailed Hazard Description:
                </label>

                {/* Speech Input Controls */}
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 text-[11px]">
                  {/* Language Selector for STT */}
                  <select
                    value={speechLang}
                    onChange={e => setSpeechLang(e.target.value as any)}
                    className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-700"
                    title="Select voice input language"
                  >
                    <option value="en-IN">🇬🇧 English (IN)</option>
                    <option value="hi-IN">🇮🇳 हिन्दी (IN)</option>
                  </select>

                  {/* Mic Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleSpeechRecognition}
                    className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer text-[10px] ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-teal-700 text-white hover:bg-teal-800'
                    }`}
                    title="Toggle speech recognition"
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3 h-3" />
                        <span>Listening… (Click to Stop)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        <span>Voice Input</span>
                      </>
                    )}
                  </button>

                  {/* Clear Transcript Button */}
                  {description.trim() && (
                    <button
                      type="button"
                      onClick={() => setDescription('')}
                      className="p-1 text-gray-500 hover:text-red-600 rounded cursor-pointer"
                      title="Clear transcript"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Privacy Notice before/during use */}
              <div className="text-[10px] text-gray-500 bg-teal-50/60 border border-teal-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Info className="w-3 h-3 text-teal-700 shrink-0" />
                <span>
                  Speech recognition may be processed by your browser or device service. Review and edit the text before submitting.
                </span>
              </div>

              {/* Speech Error Banner */}
              {speechError && (
                <div className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg flex items-center justify-between gap-1.5 animate-in fade-in">
                  <span>{speechError}</span>
                  <button
                    type="button"
                    onClick={() => setSpeechError(null)}
                    className="text-red-800 font-bold hover:underline shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <textarea
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe extent of mud, boulder dimensions, whether water is overflowing, or visible structural cracking..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 leading-relaxed"
              ></textarea>
            </div>

            {/* 5. Road Condition & People Affected */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Current Road Condition:
                </label>
                <select
                  value={roadCondition}
                  onChange={e => setRoadCondition(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="BLOCKED">Completely Blocked (No Vehicles)</option>
                  <option value="PARTIAL">Partially Blocked (Single Lane Only)</option>
                  <option value="OPEN">Passable with Extreme Caution</option>
                  <option value="UNKNOWN">Condition Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Estimated People Affected / Stranded:
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={affectedPeopleCount}
                  onChange={e => setAffectedPeopleCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* 6. Media Uploads (Photo & Video) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-dashed border-gray-300 rounded-xl text-center space-y-1 bg-gray-50">
                <Camera className="w-5 h-5 text-gray-500 mx-auto" />
                <span className="text-[11px] font-bold text-gray-700 block">Attach Photo (Max 10MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
                {photoUploaded && (
                  <span className="text-[10px] text-emerald-600 font-bold block">✓ Photo attached</span>
                )}
              </div>

              <div className="p-3 border border-dashed border-gray-300 rounded-xl text-center space-y-1 bg-gray-50">
                <Video className="w-5 h-5 text-gray-500 mx-auto" />
                <span className="text-[11px] font-bold text-gray-700 block">Attach Video (Max 40MB)</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
                {videoName && (
                  <span className="text-[10px] text-emerald-600 font-bold block">✓ {videoName}</span>
                )}
                {videoError && (
                  <span className="text-[10px] text-red-600 font-bold block">{videoError}</span>
                )}
              </div>
            </div>

            {/* 7. Safety Confirmation & Reporter Contact */}
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSafeToApproach}
                  onChange={e => setIsSafeToApproach(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-0"
                />
                <span className="font-semibold text-xs text-gray-800">
                  I confirm I am reporting from a safe distance and not in immediate path of debris or floodwater.
                </span>
              </label>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                  Reporter Contact (Optional, for field officer follow-up):
                </label>
                <input
                  type="tel"
                  value={reporterContact}
                  onChange={e => setReporterContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-gray-700 font-bold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isOffline ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Offline Device Queue</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Transmit Hazard Report</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
