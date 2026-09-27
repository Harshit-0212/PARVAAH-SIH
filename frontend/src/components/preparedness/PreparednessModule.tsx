import React, { useState } from 'react';
import type { HazardType, Language } from '../../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CloudRain, 
  Wind, 
  Mountain, 
  PhoneCall, 
  Share2, 
  CheckCircle2, 
  HeartHandshake, 
  Navigation, 
  CheckSquare, 
  Square,
  Check
} from 'lucide-react';

interface PreparednessModuleProps {
  lang: Language;
  activeHazard?: HazardType;
  onOpenReportModal: () => void;
  onNavigateShelters: () => void;
}

export const PreparednessModule: React.FC<PreparednessModuleProps> = ({
  lang,
  activeHazard = 'landslide',
  onOpenReportModal,
  onNavigateShelters,
}) => {
  const [selectedHazard, setSelectedHazard] = useState<HazardType>(activeHazard);
  const [activePhase, setActivePhase] = useState<'before' | 'during' | 'after'>('during');
  const [safeCheckinName, setSafeCheckinName] = useState('');
  const [safeCheckinSuccess, setSafeCheckinSuccess] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  // Interactive Checklist with localStorage persistence
  const defaultChecklist = [
    { id: 'water', label: 'Drinking water (minimum 3L per family member)', done: true },
    { id: 'food', label: 'Ready-to-eat dry rations (biscuits, roasted grams, chura)', done: true },
    { id: 'meds', label: 'Regular prescriptions and first-aid bandaging kit', done: false },
    { id: 'torch', label: 'Flashlight / Torch with extra dry cells', done: false },
    { id: 'power', label: 'Mobile phone fully charged + power bank', done: true },
    { id: 'whistle', label: 'Safety whistle for emergency debris distress signal', done: false },
    { id: 'docs', label: 'Aadhaar, Land deeds, Bank passbook in waterproof bag', done: false },
    { id: 'cash', label: 'Emergency cash in small denomination notes', done: true },
    { id: 'warmth', label: 'Lightweight thermal blanket and rain jacket', done: false },
  ];

  const [checklist, setChecklist] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parvaah_gobag_checklist');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    return defaultChecklist;
  });

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map((item: any) => 
      item.id === id ? { ...item, done: !item.done } : item
    );
    setChecklist(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parvaah_gobag_checklist', JSON.stringify(updated));
    }
  };

  const handleShareAlert = () => {
    const alertText = `⚠️ PARVAAH Emergency Alert (North East India): Landslide and flood advisories active in our district. Check safe shelters, open roads, and emergency helplines at PARVAAH platform. Helplines: National 112, SDMA 1070. Stay safe and avoid vulnerable slopes.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(alertText);
      setCopiedAlert(true);
      setTimeout(() => setCopiedAlert(false), 3000);
    }
  };

  const handleSafeCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safeCheckinName.trim()) return;
    
    // Save to local checkin log
    const checkinRecord = {
      name: safeCheckinName.trim(),
      timestamp: new Date().toISOString(),
      status: 'SAFE',
    };
    const saved = localStorage.getItem('parvaah_safe_checkins');
    const records = saved ? JSON.parse(saved) : [];
    records.unshift(checkinRecord);
    localStorage.setItem('parvaah_safe_checkins', JSON.stringify(records));

    setSafeCheckinSuccess(true);
    setTimeout(() => {
      setSafeCheckinSuccess(false);
      setShowCheckinModal(false);
      setSafeCheckinName('');
    }, 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-teal-700 block">
            {lang === 'hi' ? 'नागरिक आपदा तैयारी व सुरक्षा' : 'NDMA Citizen Preparedness Protocol'}
          </span>
          <h2 className="text-xl font-black text-gray-900 mt-0.5">
            {lang === 'hi' ? 'मुझे अभी क्या करना चाहिए?' : 'What Should I Do Now?'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Official Indian disaster-management guidance (NDMA & State Disaster Management Authorities).
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="tel:112"
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 112 (Emergency)</span>
          </a>

          <button
            onClick={onOpenReportModal}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Hazard</span>
          </button>

          <button
            onClick={() => setShowCheckinModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>I Am Safe Check-in</span>
          </button>

          <button
            onClick={onNavigateShelters}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Find Shelter</span>
          </button>

          <button
            onClick={handleShareAlert}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-gray-300 transition-colors cursor-pointer"
          >
            {copiedAlert ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedAlert ? 'Copied to Clipboard!' : 'Share Alert'}</span>
          </button>
        </div>
      </div>

      {/* Hazard Selector Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedHazard('landslide')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
            selectedHazard === 'landslide' ? 'bg-teal-700 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>Landslides & Slopes</span>
        </button>

        <button
          onClick={() => setSelectedHazard('flash_flood')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
            selectedHazard === 'flash_flood' ? 'bg-teal-700 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Floods & Flash Inundation</span>
        </button>

        <button
          onClick={() => setSelectedHazard('cyclone')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
            selectedHazard === 'cyclone' ? 'bg-teal-700 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Severe Storms & High Winds</span>
        </button>
      </div>

      {/* Phase Selector (Before / During / After) */}
      <div className="flex border-b border-gray-200 text-xs font-bold">
        <button
          onClick={() => setActivePhase('before')}
          className={`pb-2.5 px-4 border-b-2 cursor-pointer transition-colors ${
            activePhase === 'before' ? 'border-teal-600 text-teal-800' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          BEFORE (Early Warning & Prep)
        </button>
        <button
          onClick={() => setActivePhase('during')}
          className={`pb-2.5 px-4 border-b-2 cursor-pointer transition-colors ${
            activePhase === 'during' ? 'border-teal-600 text-teal-800' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          DURING (Active Impact & Escape)
        </button>
        <button
          onClick={() => setActivePhase('after')}
          className={`pb-2.5 px-4 border-b-2 cursor-pointer transition-colors ${
            activePhase === 'after' ? 'border-teal-600 text-teal-800' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          AFTER (Post-Disaster & Return)
        </button>
      </div>

      {/* Hazard Specific Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* LANDSLIDE GUIDANCE */}
        {selectedHazard === 'landslide' && (
          <>
            {activePhase === 'before' && (
              <>
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-teal-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    <span>Monitor Official Rainfall Advisories</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Track daily 24h rainfall totals via PARVAAH. High saturation exceeding 100mm triggers critical slope instability in Himalayan soils.
                  </p>
                </div>
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-teal-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    <span>Inspect Tension Cracks & Drainage</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Look for newly formed ground fissures, tilted utility poles, leaning pine trees, or muddy water seeping from retaining stone walls.
                  </p>
                </div>
              </>
            )}

            {activePhase === 'during' && (
              <>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Evacuate Perpendicularly to Higher Ground</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Never run downstream in the path of a debris avalanche. Move sideways/perpendicularly away from the slide axis to stable ridges.
                  </p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Avoid Crossing Fresh Highway Mud Deposits</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Secondary rockfalls frequently follow the initial slip. Do not walk or drive over fresh mud, boulders, or cracking asphalt.
                  </p>
                </div>
              </>
            )}

            {activePhase === 'after' && (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Do Not Return Without District Clearance</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Wait for BRO or PWD structural clearance. Saturated slopes can suffer catastrophic secondary collapse days after rain ceases.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Watch for Downed High-Tension Cables</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Report snapped power lines to electricity boards and disaster control. Stay at least 30 meters clear of touching lines.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* FLOOD GUIDANCE */}
        {selectedHazard === 'flash_flood' && (
          <>
            {activePhase === 'before' && (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-700" />
                    <span>Elevate Essential Medicines & Electronics</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Move food rations, drinking water, prescriptions, and identity paperwork to the upper floor or high shelves above flood line.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-700" />
                    <span>Pre-Identify Natural High Grounds</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Locate local concrete school buildings, stadiums, or community hillsides designated by DDMA as safe flood sanctuaries.
                  </p>
                </div>
              </>
            )}

            {activePhase === 'during' && (
              <>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Never Walk or Drive Through Moving Water</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Just 15 cm (6 inches) of rapid hill torrent can knock an adult off their feet; 30 cm can float and sweep away a vehicle.
                  </p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Disconnect Main Electric Supply</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Turn off the main breaker before floodwater touches ground plugs. Never touch switches while standing in water.
                  </p>
                </div>
              </>
            )}

            {activePhase === 'after' && (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Boil All Drinking Water Before Consumption</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Floodwaters contaminate wells and pipeline networks. Boil water vigorously or use chlorine tablets provided by relief teams.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Beware of Snakes & Vermin in Debris</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Displaced reptiles and insects shelter in dry crevices and hollows of evacuated homes. Use a stick while cleaning storage.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* CYCLONE / SEVERE STORM GUIDANCE */}
        {selectedHazard === 'cyclone' && (
          <>
            {activePhase === 'before' && (
              <>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    <span>Secure Tin Roofing & Loose Trim</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Fasten loose corrugated sheets with binding wire or sandbags. Prune heavy overhang tree branches touching utility lines.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    <span>Store Drinking Water & Emergency Lighting</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Storms often knock out electricity for 48-72 hours in hilly terrain. Stock candles, battery lanterns, and sealed water jars.
                  </p>
                </div>
              </>
            )}

            {activePhase === 'during' && (
              <>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Stay In Central Room Away From Glass Windows</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Gale-force gusts shatter glass panes and send flying projectiles. Shelter under strong wooden tables or reinforced doorways.
                  </p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Do Not Go Out During Temporary Calm</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    If the eye of the storm passes, winds will suddenly resume in the reverse direction with even greater destructive force.
                  </p>
                </div>
              </>
            )}

            {activePhase === 'after' && (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Stay Away From Weakened Buildings</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Damaged roofs, chimneys, and cracked brick pillars can collapse without warning. Report structural hazards via PARVAAH.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Avoid Non-Essential Phone Calls</span>
                  </h4>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    Keep telecom towers free for emergency medical and search-and-rescue dispatchers. Use SMS or text check-in instead of calls.
                  </p>
                </div>
              </>
            )}
          </>
        )}

      </div>

      {/* Interactive Emergency Go-Bag Checklist */}
      <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-teal-600" />
            <span>Interactive NDMA Emergency Go-Bag (Saved on Device)</span>
          </h3>
          <span className="text-xs font-bold text-teal-800">
            {checklist.filter((c: any) => c.done).length} / {checklist.length} Packed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {checklist.map((item: any) => (
            <div 
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`p-2.5 rounded-lg border flex items-center space-x-2 cursor-pointer transition-colors ${
                item.done ? 'bg-teal-50 border-teal-200 text-teal-900 font-semibold' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              {item.done ? (
                <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* "I Am Safe" Check-In Dialog */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                <span>I Am Safe Check-in</span>
              </h3>
              <button 
                onClick={() => setShowCheckinModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Register your safe status so your family and district disaster officers know you are out of immediate danger.
            </p>

            {safeCheckinSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm">Status Recorded!</div>
                <div className="text-xs">Your status has been logged to your device and family emergency roster.</div>
              </div>
            ) : (
              <form onSubmit={handleSafeCheckinSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={safeCheckinName}
                    onChange={e => setSafeCheckinName(e.target.value)}
                    placeholder="e.g. Tenzing Norbu / Sunita Sharma"
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                >
                  Mark Myself As Safe
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
