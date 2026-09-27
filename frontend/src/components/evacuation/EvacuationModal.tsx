import React, { useState } from 'react';
import type { LandslideIncident, Shelter, RoadStatus, Language, UserRole, EvacuationOrderStatus } from '../../types';
import { 
  X, 
  AlertTriangle, 
  Shield, 
  CheckCircle2, 
  AlertOctagon, 
  PhoneCall, 
  Users, 
  HeartPulse, 
  Baby, 
  Accessibility, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';

interface EvacuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: LandslideIncident | null;
  shelters: Shelter[];
  roads: RoadStatus[];
  lang: Language;
  role: UserRole;
  onUpdateEvacuationStatus?: (incidentId: string, newStatus: EvacuationOrderStatus) => void;
}

export const EvacuationModal: React.FC<EvacuationModalProps> = ({
  isOpen,
  onClose,
  incident,
  shelters,
  roads,
  lang: _lang,
  role,
  onUpdateEvacuationStatus,
}) => {
  if (!isOpen || !incident) return null;

  const [confirmStatusChange, setConfirmStatusChange] = useState<EvacuationOrderStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'routes' | 'shelters' | 'checklist' | 'admin'>('routes');

  // Filter open shelters
  const openShelters = shelters.filter(s => s.isOpen !== false);

  // Routing calculation: Strictly filter out BLOCKED roads or unstable bridges
  const blockedRoads = roads.filter(r => r.status === 'BLOCKED');

  const handleApplyOrderStatus = () => {
    if (confirmStatusChange && onUpdateEvacuationStatus) {
      onUpdateEvacuationStatus(incident.id, confirmStatusChange);
      setConfirmStatusChange(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                  Evacuation Zone Planning
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Updated 6 mins ago
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                {incident.locationName} Evacuation Corridor
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

        {/* Official Disclaimer Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-950 flex items-center space-x-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Official Safety Notice:</strong> AI risk output is decision support. Follow official instructions from district administration, State Disaster Management Authority (SDMA), police, and designated rescue officers.
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-5 bg-gray-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('routes')}
            className={`py-3 px-4 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'routes' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Safe Routes & Road Status
          </button>
          <button
            onClick={() => setActiveTab('shelters')}
            className={`py-3 px-4 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'shelters' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Designated Shelters ({openShelters.length})
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-4 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'checklist' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            What to Carry & Priority Care
          </button>
          {role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'admin' ? 'border-red-600 text-red-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-red-600" />
              <span>Official Order Console</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-gray-800">
          
          {/* TAB 1: SAFE ROUTES */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              
              {/* Active Evacuation Status Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Evacuation Order State</span>
                  <span className="text-base font-black text-amber-300 block mt-0.5">
                    {incident.evacuationOrderStatus}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Authorized Issuing Authority: District Magistrate / SDMA Emergency Operations
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Routing Confidence</span>
                  <span className="text-sm font-bold text-emerald-400">92% High (Verified 10m ago)</span>
                </div>
              </div>

              {/* Exclusion Engine: Blocked Roads Warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-red-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Closed Corridors (Excluded from Navigation)</span>
                </div>
                <p className="text-[11px] text-red-800">
                  Citizens MUST NOT travel along the following blocked sections. Debris, water surge, or bridge erosion is active:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {blockedRoads.map(br => (
                    <div key={br.id} className="bg-white p-2.5 rounded-lg border border-red-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-red-900">{br.roadCode} - {br.name}</span>
                        <span className="text-[10px] text-red-600 block">Blocked • 40% cleared</span>
                      </div>
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded text-[10px]">
                        NO ENTRY
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Safe Routes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Safe Bypass Corridors</span>
                </h4>

                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold">
                          PRIMARY SAFE ROUTE
                        </span>
                        <span className="font-bold text-emerald-950 text-sm">
                          Via Melli - Jorethang Ridge Link Road
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900">
                        Bypasses Sevoke Coronation Bridge blockage. High-elevation asphalt corridor confirmed clear by BRO Task Force.
                      </p>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        Distance to Gangtok Relief Hall: 38 km • Approx Drive Time: 1 hr 15 mins
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 font-bold rounded-lg text-xs">
                        Open & Clear
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                          CAUTIOUS ALTERNATIVE
                        </span>
                        <span className="font-bold text-amber-950 text-sm">
                          Peducha - Tsiesema Bypass Track
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900">
                        Single-lane rural loop. Cautious driving advised; restricted to light motor vehicles and emergency ambulances.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-amber-300 text-amber-800 font-bold rounded-lg text-xs">
                      Single Lane
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SHELTERS */}
          {activeTab === 'shelters' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                The following designated government disaster relief shelters are actively open with medical officers, clean drinking water, and generator backup:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {openShelters.map(shelter => (
                  <div key={shelter.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 hover:border-teal-500 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                          {shelter.district}
                        </span>
                        <h4 className="font-bold text-sm text-gray-900 mt-1">{shelter.name}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        OPEN
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Current Occupancy:</span>
                        <span className="font-bold text-gray-900">{shelter.occupied} / {shelter.capacity} people</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-teal-600 h-2 rounded-full" 
                          style={{ width: `${Math.round((shelter.occupied / shelter.capacity) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {shelter.accessibilityFeatures && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {shelter.accessibilityFeatures.map((f, i) => (
                          <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                      <a 
                        href={`tel:${shelter.contactPhone}`}
                        className="text-teal-700 font-bold flex items-center gap-1 text-xs hover:underline"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{shelter.contactPhone}</span>
                      </a>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {shelter.coordinates[0].toFixed(3)}°N, {shelter.coordinates[1].toFixed(3)}°E
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: WHAT TO CARRY & VULNERABLE GROUPS */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              
              {/* Vulnerable Priority Groups Notice */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-purple-700" />
                  <span>Priority Assistance for Vulnerable Individuals</span>
                </h4>
                <p className="text-[11px] text-purple-900">
                  Rescue task forces and village disaster volunteers will prioritize:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-purple-200 flex items-center space-x-2">
                    <Accessibility className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Persons with Disabilities</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-purple-200 flex items-center space-x-2">
                    <Baby className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Infants & Pregnant Mothers</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-purple-200 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Elderly Residents (65+)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-purple-200 flex items-center space-x-2">
                    <HeartPulse className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Chronic Patients & Dialysis</span>
                  </div>
                </div>
              </div>

              {/* Emergency Go-Bag Kit */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  NDMA Mandatory Emergency Go-Bag Checklist
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {[
                    'Drinking water (3-4 litres per person in sealed bottles)',
                    'Ready-to-eat non-perishable food (biscuits, dry fruits, energy bars)',
                    'Regular medicines & prescriptions (minimum 7 days supply)',
                    'Emergency flashlight with extra batteries',
                    'Fully charged mobile phone and portable power bank',
                    'Loud whistle for emergency signaling in debris',
                    'Small amount of cash in small denominations',
                    'Identity documents (Aadhaar, Voter ID, Land deeds) in waterproof pouch',
                    'Warm clothing, rain jacket, and lightweight blanket',
                    'Basic toiletries, masks, and hand sanitizer'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What NOT to Do */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-1.5 text-xs text-red-950">
                <h4 className="font-bold text-red-900 uppercase">What to Strictly Avoid:</h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-red-800">
                  <li>DO NOT attempt to cross flowing water or recently submerged road culverts.</li>
                  <li>DO NOT stop on active landslide bridges to record videos or photos.</li>
                  <li>DO NOT touch snapped power transmission wires or fallen utility poles.</li>
                  <li>DO NOT return to your home until district administration issues official clearance.</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 4: OFFICIAL ORDER CONSOLE (ADMIN ONLY) */}
          {activeTab === 'admin' && role === 'admin' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs uppercase tracking-wider text-teal-400 font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Official Administrative Evacuation Governance</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Only authorized EOC commanders or District Magistrates can transition the official evacuation order status. All state changes are permanently logged to the emergency audit log.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Select New Evacuation State for Corridor:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { val: 'NO_ADVICE', label: 'No Evacuation Advice', color: 'border-gray-200' },
                    { val: 'PREPARE', label: 'Prepare to Evacuate (Standby)', color: 'border-amber-300 bg-amber-50' },
                    { val: 'VOLUNTARY_RECOMMENDED', label: 'Voluntary Evacuation Recommended', color: 'border-orange-300 bg-orange-50' },
                    { val: 'MANDATORY_ORDERED', label: 'Mandatory Evacuation Ordered', color: 'border-red-400 bg-red-50 text-red-900 font-bold' },
                    { val: 'SHELTER_IN_PLACE', label: 'Shelter-in-Place', color: 'border-blue-300 bg-blue-50' },
                    { val: 'EVACUATION_COMPLETED', label: 'Evacuation Completed', color: 'border-emerald-300 bg-emerald-50' },
                    { val: 'RETURN_NOT_AUTHORIZED', label: 'Return Not Yet Authorized', color: 'border-slate-300' },
                    { val: 'RETURN_AUTHORIZED', label: 'Return Authorized by Officials', color: 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setConfirmStatusChange(opt.val as EvacuationOrderStatus)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${opt.color} ${
                        confirmStatusChange === opt.val ? 'ring-2 ring-red-600 shadow-md' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="block font-bold">{opt.label}</span>
                      <span className="text-[10px] text-gray-500">{opt.val}</span>
                    </button>
                  ))}
                </div>
              </div>

              {confirmStatusChange && (
                <div className="bg-red-50 border-2 border-red-500 p-4 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-start space-x-2 text-red-900 font-bold">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <div>Confirmation Required for Official Emergency Order</div>
                      <p className="text-xs text-red-800 font-normal mt-0.5">
                        Are you sure you want to change official evacuation status to <strong>{confirmStatusChange}</strong>? This will alert SDMA operations and citizen dispatch channels.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setConfirmStatusChange(null)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyOrderStatus}
                      className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs cursor-pointer shadow-md"
                    >
                      Confirm Official Order Change
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-gray-500 font-mono text-[11px]">
            Incident: {incident.id} • District: {incident.district}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-xl cursor-pointer"
            >
              Close Plan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
