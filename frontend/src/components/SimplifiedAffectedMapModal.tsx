import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Home, 
  AlertTriangle, 
  Navigation, 
  Phone, 
  Users,
  Compass,
  AlertOctagon
} from 'lucide-react';
import type { Language, LandslideIncident, Shelter, RoadStatus } from '../types';

interface SimplifiedAffectedMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  districtName: string;
  incidents: LandslideIncident[];
  shelters: Shelter[];
  roads: RoadStatus[];
}

export const SimplifiedAffectedMapModal: React.FC<SimplifiedAffectedMapModalProps> = ({
  isOpen,
  onClose,
  lang,
  districtName,
  incidents,
  shelters,
  roads,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'danger' | 'shelters' | 'roads'>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    title: string;
    type: 'landslide' | 'shelter' | 'road';
    severity?: string;
    details: string;
    contact?: string;
    coordinates?: [number, number];
  } | null>(null);

  useEffect(() => {
    if (isOpen && !userLocation && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to regional center
          setUserLocation({ lat: 26.1445, lng: 91.7362 });
        },
        { timeout: 5000 }
      );
    }
  }, [isOpen, userLocation]);

  if (!isOpen) return null;

  const blockedRoads = roads.filter((r) => r.status === 'BLOCKED' || r.status === 'SINGLE_LANE');
  const activeLandslides = incidents.filter((i) => i.status === 'OPEN' || i.riskLevel === 'HIGH');
  const activeShelters = shelters;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[90vh] max-h-[820px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>{lang === 'hi' ? 'प्रभावित क्षेत्र एवं सुरक्षित आश्रय' : 'Affected Areas & Safe Shelters'}</span>
                <span className="text-xs font-bold text-[#0F766E] bg-teal-50 px-2.5 py-0.5 rounded-full">
                  {districtName}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                {lang === 'hi' ? 'नागरिक सुरक्षा मानचित्र - खतरे के क्षेत्र और निकटतम सुरक्षित आश्रय' : 'Simplified Disaster Risk Map for Residents'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips Bar */}
        <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2 overflow-x-auto text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Critical Points ({activeLandslides.length + activeShelters.length + blockedRoads.length})
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            Landslides ({activeLandslides.length})
          </button>

          <button
            onClick={() => setActiveTab('shelters')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'shelters'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-emerald-500" />
            Safe Shelters ({activeShelters.length})
          </button>

          <button
            onClick={() => setActiveTab('roads')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'roads'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
            Road Closures ({blockedRoads.length})
          </button>
        </div>

        {/* Main Content Area: Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Points of Interest List */}
          <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 bg-gray-50/50 p-4 overflow-y-auto space-y-3 shrink-0">
            
            {/* User GPS Status Pill */}
            <div className="bg-white border border-teal-200 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-teal-900">
              <Navigation className="w-4 h-4 text-[#0F766E] shrink-0 animate-pulse" />
              <div>
                <span className="font-bold block">Your Detected Location</span>
                <span className="text-[11px] text-gray-500 font-mono">
                  {userLocation ? `${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E` : 'Locating GPS...'}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block px-1 pt-1">
              Active Relief Points & Danger Corridors
            </span>

            {/* List: Shelters */}
            {(activeTab === 'all' || activeTab === 'shelters') &&
              activeShelters.map((shelter) => (
                <div
                  key={shelter.id}
                  onClick={() =>
                    setSelectedItem({
                      title: shelter.name,
                      type: 'shelter',
                      details: `Capacity: ${shelter.occupied}/${shelter.capacity} people. Helpline: ${shelter.contactPhone}`,
                      contact: shelter.contactPhone,
                      coordinates: shelter.coordinates,
                    })
                  }
                  className="bg-white border border-gray-200 hover:border-emerald-500 rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all hover:shadow-sm"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Home className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {shelter.name}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                          OPEN
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 font-medium">
                        <Users className="w-3 h-3 text-gray-400" />
                        {shelter.capacity - shelter.occupied} beds available
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {/* List: Landslides */}
            {(activeTab === 'all' || activeTab === 'danger') &&
              activeLandslides.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() =>
                    setSelectedItem({
                      title: lang === 'hi' ? incident.locationNameHi : incident.locationName,
                      type: 'landslide',
                      severity: incident.riskLevel,
                      details: incident.description,
                      coordinates: incident.coordinates,
                    })
                  }
                  className="bg-white border border-gray-200 hover:border-red-500 rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all hover:shadow-sm"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {lang === 'hi' ? incident.locationNameHi : incident.locationName}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-1.5 py-0.5 rounded">
                          {incident.riskLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                        {incident.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            {/* List: Road Closures */}
            {(activeTab === 'all' || activeTab === 'roads') &&
              blockedRoads.map((road) => (
                <div
                  key={road.id}
                  onClick={() =>
                    setSelectedItem({
                      title: `${road.roadCode}: ${road.name}`,
                      type: 'road',
                      details: `Status: ${road.status}. Detour: ${road.detourRouteName}`,
                    })
                  }
                  className="bg-white border border-gray-200 hover:border-amber-500 rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all hover:shadow-sm"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {road.roadCode}: {road.name}
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded">
                          {road.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 block">
                        Detour: {road.detourRouteName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

          </div>

          {/* Right Panel: Clean Map Canvas */}
          <div className="flex-1 relative bg-slate-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
            
            {/* Ambient Grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0F766E_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Selected Item Detail Callout */}
            {selectedItem ? (
              <div className="z-10 bg-white text-gray-900 p-6 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    {selectedItem.type === 'shelter' && <Home className="w-5 h-5 text-emerald-600" />}
                    {selectedItem.type === 'landslide' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                    {selectedItem.type === 'road' && <AlertOctagon className="w-5 h-5 text-amber-600" />}
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
                      {selectedItem.type}
                    </span>
                  </div>
                  {selectedItem.severity && (
                    <span className="text-xs font-black bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      {selectedItem.severity}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-3">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {selectedItem.details}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400">
                    {selectedItem.coordinates
                      ? `Coords: ${selectedItem.coordinates[0].toFixed(3)}, ${selectedItem.coordinates[1].toFixed(3)}`
                      : 'Mountain Highway Pass'}
                  </span>
                  {selectedItem.contact && (
                    <a
                      href={`tel:${selectedItem.contact}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Shelter
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="z-10 text-center max-w-sm space-y-3 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="w-12 h-12 rounded-full bg-[#0F766E]/30 text-teal-300 flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  Select Any Location from the Left List
                </h3>
                <p className="text-xs text-slate-300">
                  Tap any safe shelter, blocked mountain corridor, or active landslide area to view live distance, contact, and evacuation advice.
                </p>
              </div>
            )}

            {/* Bottom Legend */}
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-800/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl flex flex-wrap items-center justify-around gap-2 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Active Landslide Zone
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Safe Relief Shelter
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> Blocked Road
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-400"></span> Your GPS Location
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
