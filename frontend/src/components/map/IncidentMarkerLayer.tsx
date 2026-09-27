import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { Incident } from '../../types';
import { isValidCoordinatePair } from './geoUtils';
import { createIncidentIcon } from './markerStyles';
import { ExternalLink, Clock, ShieldAlert } from 'lucide-react';

interface IncidentMarkerLayerProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  selectedIncidentId?: string | null;
}

export const IncidentMarkerLayer: React.FC<IncidentMarkerLayerProps> = ({
  incidents,
  onSelectIncident,
  selectedIncidentId: _selectedIncidentId
}) => {
  return (
    <>
      {incidents.map((incident) => {
        const lat = incident.coordinates?.latitude;
        const lng = incident.coordinates?.longitude;

        if (!isValidCoordinatePair(lat, lng)) {
          return null;
        }

        const icon = createIncidentIcon(incident.severity, incident.hazardType);

        return (
          <Marker
            key={incident.id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{
              click: () => {
                onSelectIncident(incident);
              }
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 max-w-xs text-slate-900 font-sans">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5 mb-1.5">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    incident.severity === 'MODERATE' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {incident.severity}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {incident.id}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-gray-900 leading-snug mb-1">
                  {incident.title}
                </h4>

                <div className="space-y-1 text-[11px] text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{incident.source}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>Updated: {new Date(incident.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectIncident(incident)}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <span>Open Operational Drawer</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
