import React, { useState } from 'react';
import type { LandslideIncident, SlopeSensor, Shelter, Language } from '../types';
import { AlertTriangle, Radio, Shield, Layers, MapPin, CheckCircle } from 'lucide-react';
import { dictionary } from '../data/translations';

interface MapComponentProps {
  incidents: LandslideIncident[];
  sensors: SlopeSensor[];
  shelters: Shelter[];
  selectedDistrict: string;
  lang: Language;
  onSelectIncident?: (incident: LandslideIncident) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  incidents,
  sensors,
  shelters,
  selectedDistrict,
  lang,
  onSelectIncident
}) => {
  const t = dictionary[lang];
  const [activeIncident, setActiveIncident] = useState<LandslideIncident | null>(incidents[0] || null);
  const [activeSensor, setActiveSensor] = useState<SlopeSensor | null>(null);
  const [activeShelter, setActiveShelter] = useState<Shelter | null>(null);
  
  // Layer visibility toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showShelters, setShowShelters] = useState(true);

  // Map view mode (Satellite vs Topographic Terrain)
  const [mapStyle, setMapStyle] = useState<'terrain' | 'satellite'>('terrain');

  const filteredIncidents = selectedDistrict === 'all' 
    ? incidents 
    : incidents.filter(i => i.district === selectedDistrict);

  const filteredSensors = selectedDistrict === 'all' 
    ? sensors 
    : sensors.filter(s => s.district === selectedDistrict);

  const filteredShelters = selectedDistrict === 'all' 
    ? shelters 
    : shelters.filter(sh => sh.district === selectedDistrict);

  return (
    <div className="relative w-full h-[520px] bg-[#1E293B] rounded-lg overflow-hidden border border-[#D1D5DB] shadow-inner flex flex-col">
      
      {/* Map Control Bar Top */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Layer Filters */}
        <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-md shadow-md border border-gray-200 flex items-center space-x-3 text-xs pointer-events-auto">
          <span className="font-semibold text-gray-700 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>{t.mapLayersLabel}</span>
          </span>

          <label className="flex items-center space-x-1 cursor-pointer hover:text-gray-900">
            <input 
              type="checkbox" 
              checked={showIncidents} 
              onChange={e => setShowIncidents(e.target.checked)}
              className="rounded text-[#C24141] focus:ring-0"
            />
            <span className="flex items-center space-x-1 text-gray-800">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>{t.layerBlockages} ({filteredIncidents.length})</span>
            </span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer hover:text-gray-900">
            <input 
              type="checkbox" 
              checked={showSensors} 
              onChange={e => setShowSensors(e.target.checked)}
              className="rounded text-[#0F766E] focus:ring-0"
            />
            <span className="flex items-center space-x-1 text-gray-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{t.layerSensors} ({filteredSensors.length})</span>
            </span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer hover:text-gray-900">
            <input 
              type="checkbox" 
              checked={showShelters} 
              onChange={e => setShowShelters(e.target.checked)}
              className="rounded text-[#C98212] focus:ring-0"
            />
            <span className="flex items-center space-x-1 text-gray-800">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{t.layerShelters} ({filteredShelters.length})</span>
            </span>
          </label>
        </div>

        {/* Map Style Toggle */}
        <div className="bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md shadow-md border border-gray-200 flex items-center space-x-1 text-xs pointer-events-auto">
          <button
            onClick={() => setMapStyle('terrain')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              mapStyle === 'terrain' ? 'bg-[#0F766E] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.mapStyleTerrain}
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              mapStyle === 'satellite' ? 'bg-[#0F766E] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.mapStyleRadar}
          </button>
        </div>

      </div>

      {/* Vector Interactive Map Canvas */}
      <div className={`relative flex-1 w-full h-full ${mapStyle === 'terrain' ? 'bg-[#1E293B]' : 'bg-[#0F172A]'}`}>
        
        {/* Background Mountain Contours & Regional Grid Graphics */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="highRiskZone" cx="30%" cy="40%" r="25%">
              <stop offset="0%" stopColor="#C24141" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C24141" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="medRiskZone" cx="70%" cy="30%" r="20%">
              <stop offset="0%" stopColor="#C98212" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C98212" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Topographic Contour Lines */}
          <path d="M 0 100 Q 200 80 400 140 T 800 120 T 1200 180" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />
          <path d="M 0 220 Q 300 190 600 260 T 1200 240" fill="none" stroke="#334155" strokeWidth="1" />
          <path d="M 0 380 Q 250 320 500 400 T 1200 360" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 3" />
          
          {/* Risk Heatmap Orbs */}
          <circle cx="35%" cy="42%" r="140" fill="url(#highRiskZone)" />
          <circle cx="68%" cy="32%" r="110" fill="url(#medRiskZone)" />

          {/* National Highway Line Paths */}
          <path d="M 120 420 L 220 340 L 320 280 L 410 220" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray="8 4" className="animate-pulse" />
          <path d="M 520 180 L 620 240 L 720 310" fill="none" stroke="#F59E0B" strokeWidth="3" />
          <path d="M 780 140 L 880 210 L 960 280" fill="none" stroke="#10B981" strokeWidth="3" />
        </svg>

        {/* Live Legend Box */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white text-[11px] px-3 py-2 rounded-md border border-slate-700 shadow-lg z-10 font-mono space-y-1">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">{t.radarLegendTitle}</div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span>{t.legendSevoke}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>{t.legendShillong}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>{t.legendDirang}</span>
          </div>
        </div>

        {/* Interactive Pins - Landslide Incidents */}
        {showIncidents && filteredIncidents.map((incident, idx) => {
          const posX = 22 + (idx * 24) % 65;
          const posY = 28 + (idx * 18) % 55;
          const isSelected = activeIncident?.id === incident.id;

          return (
            <button
              key={incident.id}
              onClick={() => {
                setActiveIncident(incident);
                setActiveSensor(null);
                setActiveShelter(null);
                if (onSelectIncident) onSelectIncident(incident);
              }}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="relative">
                <span className={`absolute -inset-1 rounded-full animate-ping opacity-75 ${
                  incident.riskLevel === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'
                }`}></span>
                
                <div className={`relative px-2 py-1 rounded-md text-white font-bold text-[11px] shadow-lg flex items-center space-x-1 border ${
                  incident.riskLevel === 'HIGH'
                    ? 'bg-red-600 border-red-400'
                    : 'bg-amber-600 border-amber-400'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-mono">{incident.id}</span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Interactive Pins - Slope Sensors */}
        {showSensors && filteredSensors.map((sensor, idx) => {
          const posX = 18 + (idx * 28) % 70;
          const posY = 55 - (idx * 14) % 40;
          const isSelected = activeSensor?.id === sensor.id;

          return (
            <button
              key={sensor.id}
              onClick={() => {
                setActiveSensor(sensor);
                setActiveIncident(null);
                setActiveShelter(null);
              }}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center border-2 border-emerald-300 shadow-md">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
            </button>
          );
        })}

        {/* Interactive Pins - Relief Shelters */}
        {showShelters && filteredShelters.map((shelter, idx) => {
          const posX = 35 + (idx * 30) % 55;
          const posY = 75 - (idx * 20) % 50;
          const isSelected = activeShelter?.id === shelter.id;

          return (
            <button
              key={shelter.id}
              onClick={() => {
                setActiveShelter(shelter);
                setActiveIncident(null);
                setActiveSensor(null);
              }}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center border-2 border-amber-200 shadow-md">
                <Shield className="w-4 h-4" />
              </div>
            </button>
          );
        })}

        {/* Floating Detail Popup Modal Box */}
        {activeIncident && (
          <div className="absolute bottom-4 right-4 z-30 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-gray-800 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${
                  activeIncident.riskLevel === 'HIGH' ? 'bg-red-600' : 'bg-amber-600'
                }`}>
                  {activeIncident.riskLevel} {t.popupRiskSuffix} • {activeIncident.status}
                </span>
                <h4 className="text-xs font-bold text-gray-900 mt-1 leading-snug">
                  {lang === 'hi' ? activeIncident.locationNameHi : activeIncident.locationName}
                </h4>
              </div>
              <button 
                onClick={() => setActiveIncident(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-2 mt-2">
              <div className="flex items-center space-x-1 text-gray-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{activeIncident.roadName}</span>
              </div>
              
              <p className="bg-gray-50 p-2 rounded border border-gray-100 text-[11px] leading-relaxed">
                {lang === 'hi' ? activeIncident.descriptionHi : activeIncident.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-emerald-50 p-1.5 rounded border border-emerald-100">
                  <span className="text-gray-500 block">{t.popupRainfall}</span>
                  <span className="font-bold text-emerald-800">{activeIncident.rainfall24h} mm</span>
                </div>
                <div className="bg-amber-50 p-1.5 rounded border border-amber-100">
                  <span className="text-gray-500 block">{t.popupClearanceEta}</span>
                  <span className="font-bold text-amber-800">{activeIncident.clearanceEta}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                <span className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>{activeIncident.verifiedBy}</span>
                </span>
                <span>{activeIncident.reportedAt}</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Detail Popup for Slope Sensor */}
        {activeSensor && (
          <div className="absolute bottom-4 right-4 z-30 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {t.popupSensorNode}
                </span>
                <h4 className="text-xs font-bold text-gray-900 mt-1">{activeSensor.stationName}</h4>
              </div>
              <button onClick={() => setActiveSensor(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs my-2">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 block text-[10px]">{t.popupInclinometerTilt}</span>
                <span className="font-bold text-gray-800">{activeSensor.inclinometerMm} mm</span>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 block text-[10px]">{t.popupSoilMoisture}</span>
                <span className="font-bold text-gray-800">{activeSensor.soilMoisturePct}%</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 text-right">{t.popupPing} {activeSensor.lastPing}</div>
          </div>
        )}

        {/* Floating Detail Popup for Shelter */}
        {activeShelter && (
          <div className="absolute bottom-4 right-4 z-30 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                  {t.popupReliefCamp}
                </span>
                <h4 className="text-xs font-bold text-gray-900 mt-1">{activeShelter.name}</h4>
              </div>
              <button onClick={() => setActiveShelter(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <p>{t.popupCapacity} <strong className="text-gray-900">{activeShelter.occupied} / {activeShelter.capacity}</strong> {t.popupAccommodated}</p>
              <div className="pt-2 border-t border-gray-100">
                <a href={`tel:${activeShelter.contactPhone}`} className="text-[#0F766E] font-semibold text-xs flex items-center space-x-1">
                  <span>{t.popupCallHelpline} {activeShelter.contactPhone}</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
