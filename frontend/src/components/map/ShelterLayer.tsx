import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { ShelterRecord } from '../../types';
import { isValidCoordinatePair } from './geoUtils';
import { createShelterIcon } from './markerStyles';
import { Navigation, Phone, ShieldCheck } from 'lucide-react';

interface ShelterLayerProps {
  shelters: ShelterRecord[];
  onSelectShelterDestination?: (shelter: ShelterRecord) => void;
}

export const ShelterLayer: React.FC<ShelterLayerProps> = ({
  shelters,
  onSelectShelterDestination
}) => {
  return (
    <>
      {shelters.map((shelter) => {
        const lat = shelter.coordinates?.latitude;
        const lng = shelter.coordinates?.longitude;

        if (!isValidCoordinatePair(lat, lng)) {
          return null;
        }

        const icon = createShelterIcon();
        const availableBeds = Math.max(0, shelter.capacity - shelter.occupancy);
        const occupancyPct = Math.round((shelter.occupancy / shelter.capacity) * 100);

        return (
          <Marker key={shelter.id} position={[lat, lng]} icon={icon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 max-w-xs font-sans text-slate-900">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1.5">
                  <span className="text-[10px] font-bold uppercase bg-teal-100 text-teal-900 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Safe Shelter</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{shelter.id}</span>
                </div>

                <h4 className="text-xs font-bold text-gray-900 mb-1">{shelter.name}</h4>

                <div className="space-y-1.5 text-[11px] text-gray-600 mb-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">Occupancy:</span>
                    <span className="font-bold text-gray-800">
                      {shelter.occupancy} / {shelter.capacity} ({occupancyPct}% • {availableBeds} beds free)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 ${occupancyPct > 90 ? 'bg-red-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-gray-700">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span className="font-mono">{shelter.contactPhone}</span>
                  </div>

                  {shelter.accessibilityFeatures && shelter.accessibilityFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {shelter.accessibilityFeatures.map((feat, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 text-[9px] px-1.5 py-0.5 rounded">
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-gray-400 pt-1 border-t border-gray-100 flex justify-between">
                    <span>{shelter.source}</span>
                    <span className="text-teal-700 font-bold">{shelter.isOpen ? 'OPEN' : 'CLOSED'}</span>
                  </div>
                </div>

                {onSelectShelterDestination && (
                  <button
                    onClick={() => onSelectShelterDestination(shelter)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Select as Target Destination</span>
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
