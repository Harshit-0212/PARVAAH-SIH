import React from 'react';
import type { LandslideIncident, Shelter, Language, UserRole } from '../../types';
import { 
  X, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Shield, 
  PhoneCall, 
  CheckCircle2, 
  Activity, 
  Truck, 
  Users, 
  Download, 
  Send, 
  Navigation,
  FileText,
  AlertOctagon
} from 'lucide-react';

interface IncidentDetailDrawerProps {
  incident: LandslideIncident | null;
  onClose: () => void;
  shelters: Shelter[];
  lang: Language;
  role: UserRole;
  onOpenEvacuationModal: (incident: LandslideIncident) => void;
  onOpenReportUpdate: (incident: LandslideIncident) => void;
  onIssueOfficialAlert?: (incident: LandslideIncident) => void;
}

export const IncidentDetailDrawer: React.FC<IncidentDetailDrawerProps> = ({
  incident,
  onClose,
  shelters,
  lang,
  role,
  onOpenEvacuationModal,
  onOpenReportUpdate,
  onIssueOfficialAlert,
}) => {
  if (!incident) return null;

  const lat = incident.latitude ?? incident.coordinates[0];
  const lng = incident.longitude ?? incident.coordinates[1];

  const matchedShelter = shelters.find(s => s.id === incident.nearestShelterId) || shelters[0];

  // Generate low-network plain text bulletin for offline download
  const handleDownloadBulletin = () => {
    const textContent = `
============================================================
PARVAAH DISASTER EARLY WARNING BULLETIN (LOW-BANDWIDTH TEXT)
============================================================
INCIDENT ID: ${incident.id}
SEVERITY: ${incident.severity}
HAZARD: ${incident.hazardType.toUpperCase()}
TITLE: ${incident.title}
LOCATION: ${incident.locationName} (${incident.district}, ${incident.state})
COORDINATES: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
STATUS: ${incident.status}
DATA FRESHNESS: ${incident.freshness} (Reported: ${incident.reportedAt})
DATA SOURCE: ${incident.source} (${incident.isDemo ? 'SIMULATED DATA' : 'OFFICIAL LIVE FEED'})

1. SITUATION SUMMARY:
${incident.description}

2. EVACUATION ADVICE:
Recommended Status: ${incident.evacuationLevel || 'ADVISORY'}
Official Order Status: ${incident.evacuationOrderStatus}
Note: Follow instructions from District Magistrate / SDMA.

3. ROAD & CONNECTIVITY:
Affected Corridor: ${incident.roadName} (${incident.roadId})
Road Condition: ${incident.roadStatus}
Clearance ETA: ${incident.clearanceEta || 'In Progress'}

4. NEAREST VERIFIED SHELTER:
Name: ${matchedShelter ? matchedShelter.name : 'District Relief Center'}
Contact: ${matchedShelter ? matchedShelter.contactPhone : '1070 / 112'}

5. CITIZEN ACTIONS:
${incident.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

6. EMERGENCY HELPLINES:
- National Emergency: 112
- State Disaster Management Authority (SDMA): 1070
- District Disaster Control: 1077
- Ambulance: 108

ISSUED VIA PARVAAH DISASTER MONITORING NETWORK (NDMA / SDMA)
============================================================
`.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PARVAAH_BULLETIN_${incident.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out">
      
      {/* 1. Header & Badges */}
      <div className="p-5 border-b border-gray-200 bg-slate-900 text-white flex items-start justify-between">
        <div className="space-y-1.5 pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              incident.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
              incident.severity === 'HIGH' ? 'bg-orange-500 text-white' :
              incident.severity === 'MODERATE' ? 'bg-amber-500 text-white' :
              'bg-emerald-600 text-white'
            }`}>
              {incident.severity} RISK
            </span>

            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
              {incident.hazardType.replace('_', ' ').toUpperCase()}
            </span>

            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              {incident.source === 'SIMULATED_SCENARIO'
                ? 'SIMULATED SCENARIO — College demonstration only'
                : incident.isDemo
                ? 'THIRD-PARTY WEATHER DATA — Research/demo use; not an IMD warning'
                : 'OFFICIAL IMD WEATHER DATA — Check source and validity time'}
            </span>

            <span className="text-[10px] text-slate-400 font-mono">
              {incident.status}
            </span>
          </div>

          <h2 className="text-lg font-black tracking-tight text-white leading-snug">
            {lang === 'hi' && incident.titleHi ? incident.titleHi : incident.title}
          </h2>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{incident.reportedAt}</span>
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-300">{incident.id}</span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-gray-800">
        
        {/* 2. What Happened? */}
        <section className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>1. What Happened?</span>
          </h3>
          <p className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs leading-relaxed text-gray-800 font-medium">
            {lang === 'hi' && incident.descriptionHi ? incident.descriptionHi : incident.description}
          </p>
        </section>

        {/* 3. Where is it? */}
        <section className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>2. Where is it?</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-500 block text-[11px]">Location</span>
              <span className="font-bold text-gray-900">{incident.locationName}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">District / State</span>
              <span className="font-bold text-gray-900">{incident.district}, {incident.state}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Coordinates (WGS84)</span>
              <span className="font-mono text-gray-700 font-bold">{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Corridor</span>
              <span className="font-bold text-teal-700">{incident.roadName}</span>
            </div>
          </div>
        </section>

        {/* 4. Who May Be Affected? */}
        <section className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" />
            <span>3. Who May Be Affected?</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="text-purple-700 font-medium block text-[11px]">Estimated Population</span>
              <span className="text-xl font-extrabold text-purple-900 font-mono">
                {incident.affectedPopulationEstimate.toLocaleString()} <span className="text-xs font-normal">residents</span>
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-gray-500 font-medium block text-[11px]">Nearby Settlements</span>
              <span className="text-xl font-extrabold text-gray-900 font-mono">
                {incident.affectedVillagesCount} <span className="text-xs font-normal">villages / wards</span>
              </span>
            </div>
          </div>
        </section>

        {/* 5. Current Risk & Transparent Explanation */}
        <section className="space-y-2 bg-orange-50/70 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-orange-600" />
              <span>4. Risk Telemetry & Synthesis</span>
            </h3>
            <span className="text-xs font-bold text-orange-800 bg-orange-200/60 px-2 py-0.5 rounded">
              Confidence {incident.confidence}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-lg border border-orange-200">
              <span className="text-gray-500 block text-[10px]">24h Rainfall</span>
              <span className="font-bold font-mono text-gray-900">{incident.rainfall24h} mm</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-orange-200">
              <span className="text-gray-500 block text-[10px]">Soil Moisture</span>
              <span className="font-bold font-mono text-gray-900">{incident.soilMoisture || 88}%</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-orange-200">
              <span className="text-gray-500 block text-[10px]">Slope Incline</span>
              <span className="font-bold font-mono text-gray-900">{incident.slope || 38}°</span>
            </div>
          </div>

          <p className="text-[11px] text-orange-950 font-medium leading-relaxed mt-1">
            <strong>Why risk is high:</strong> 24h rainfall ({incident.rainfall24h}mm) has saturated hillside topsoil, reducing cohesion on steep slopes (&gt;35°).
          </p>
        </section>

        {/* 6 & 7. Evacuation Status & Official Authorization */}
        <section className="space-y-2 bg-slate-900 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-teal-400 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-teal-400" />
              <span>5. Evacuation Status</span>
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
              Authority: DM / SDMA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-slate-400 block text-[10px]">System Recommendation</span>
              <span className="font-bold text-amber-300">{incident.evacuationLevel || 'ADVISORY'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Official Administrative Order</span>
              <span className="font-bold text-white">{incident.evacuationOrderStatus}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
            ⚠️ AI output is decision support. Only authorized district magistrates may declare mandatory evacuation.
          </p>
        </section>

        {/* 8. Roads & Connectivity */}
        <section className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-600" />
            <span>6. Road & Bridge Connectivity</span>
          </h3>
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-amber-900">{incident.roadName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                {incident.roadStatus}
              </span>
            </div>
            <div className="text-gray-700 text-[11px]">
              <strong>Clearance ETA:</strong> {incident.clearanceEta || 'In Progress'}
            </div>
            <div className="text-teal-800 font-medium text-[11px] pt-1 border-t border-amber-200">
              <strong>Safe Detour:</strong> Melli - Jorethang Ridge Link Road
            </div>
          </div>
        </section>

        {/* 9. Nearest Shelters */}
        {matchedShelter && (
          <section className="space-y-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>7. Nearest Verified Shelter</span>
            </h3>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-950 block">{matchedShelter.name}</span>
                <span className="text-[11px] text-emerald-800 block mt-0.5">
                  Capacity: {matchedShelter.occupied} / {matchedShelter.capacity} people accommodated
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <a 
                    href={`tel:${matchedShelter.contactPhone}`} 
                    className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{matchedShelter.contactPhone}</span>
                  </a>
                </div>
              </div>
              <button
                onClick={() => onOpenEvacuationModal(incident)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Safe Route
              </button>
            </div>
          </section>
        )}

        {/* 10. What Citizens Should Do Now */}
        <section className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>8. What Citizens Should Do Now</span>
          </h3>
          <ul className="space-y-2">
            {incident.recommendedActions.map((action, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                  {idx + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 11. Assigned Response Teams */}
        <section className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
            9. Assigned Response Command
          </h3>
          <div className="text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
            <div><strong>Agency:</strong> {incident.assignedAgency}</div>
            <div><strong>Officer-in-Charge:</strong> {incident.assignedOfficer}</div>
          </div>
        </section>

        {/* 12. Incident Timeline */}
        {incident.timeline && incident.timeline.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
              10. Verified Incident Timeline
            </h3>
            <div className="space-y-2 border-l-2 border-teal-600 pl-3 ml-1 text-xs">
              {incident.timeline.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="font-mono text-teal-700">{item.time}</span>
                    <span className="text-gray-400">•</span>
                    <span>{item.author}</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">{item.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 13. Data Freshness & Attribution */}
        <section className="pt-2 border-t border-gray-200 text-[11px] text-gray-500 space-y-1 font-mono">
          <div>Data Source: {incident.source}</div>
          <div>Freshness: {incident.freshness} • Verified By: {incident.verifiedBy}</div>
        </section>

      </div>

      {/* Bottom Action Command Buttons */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => onOpenEvacuationModal(incident)}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer transition-colors"
        >
          <Navigation className="w-4 h-4" />
          <span>Evacuate & Safe Route</span>
        </button>

        <button
          onClick={() => onOpenReportUpdate(incident)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Report Status Update</span>
        </button>

        {role === 'admin' && onIssueOfficialAlert && (
          <button
            onClick={() => onIssueOfficialAlert(incident)}
            className="col-span-2 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Issue Official Emergency Alert (Admin Authority)</span>
          </button>
        )}

        <button
          onClick={handleDownloadBulletin}
          className="col-span-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Download Low-Network Text Bulletin</span>
        </button>
      </div>

    </div>
  );
};
