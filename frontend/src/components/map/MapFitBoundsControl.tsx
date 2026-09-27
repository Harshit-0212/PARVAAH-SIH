import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Maximize2, AlertCircle } from 'lucide-react';
import type { Incident } from '../../types';
import { isValidCoordinatePair } from './geoUtils';

interface MapFitBoundsControlProps {
  incidents: Incident[];
  onUserLocationFound?: (lat: number, lng: number) => void;
}

export const MapFitBoundsControl: React.FC<MapFitBoundsControlProps> = ({
  incidents,
  onUserLocationFound
}) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Fit view to active incidents
  const handleFitIncidents = () => {
    const validCoords: L.LatLngTuple[] = incidents
      .filter((i) => isValidCoordinatePair(i.coordinates?.latitude, i.coordinates?.longitude))
      .map((i) => [i.coordinates.latitude, i.coordinates.longitude]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  };

  // Locate me with browser geolocation
  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setTimeout(() => setGeoError(null), 4000);
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 13, { duration: 1.5 });
        if (onUserLocationFound) {
          onUserLocationFound(latitude, longitude);
        }
      },
      (err) => {
        setLocating(false);
        let msg = 'Unable to determine location.';
        if (err.code === 1) msg = 'Location permission denied by user.';
        else if (err.code === 2) msg = 'Location position unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';
        setGeoError(msg);
        setTimeout(() => setGeoError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  return (
    <div className="absolute top-14 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
      <button
        onClick={handleFitIncidents}
        className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-md flex items-center justify-center cursor-pointer transition-colors"
        title="Fit map to active disaster incidents"
        aria-label="Fit to active incidents"
      >
        <Maximize2 className="w-4 h-4 text-teal-400" />
      </button>

      <button
        onClick={handleLocateMe}
        disabled={locating}
        className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-md flex items-center justify-center cursor-pointer transition-colors"
        title="Find my location (approximate, local browser only)"
        aria-label="Find my current location"
      >
        <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin text-teal-400' : 'text-slate-300'}`} />
      </button>

      {geoError && (
        <div className="absolute right-12 top-9 bg-red-900/95 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg border border-red-700 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 text-red-300 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}
    </div>
  );
};
