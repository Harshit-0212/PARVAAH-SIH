import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { CitizenReportRecord } from '../../types';
import { isValidCoordinatePair } from './geoUtils';
import { createCitizenReportIcon } from './markerStyles';
import { Camera, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';

interface CitizenReportLayerProps {
  reports: CitizenReportRecord[];
}

export const CitizenReportLayer: React.FC<CitizenReportLayerProps> = ({ reports }) => {
  return (
    <>
      {reports.map((rep) => {
        const lat = rep.coordinates?.latitude ?? rep.latitude ?? (Array.isArray(rep.coordinates) ? (rep.coordinates as any)[0] : undefined);
        const lng = rep.coordinates?.longitude ?? rep.longitude ?? (Array.isArray(rep.coordinates) ? (rep.coordinates as any)[1] : undefined);

        if (!isValidCoordinatePair(lat, lng)) {
          return null;
        }

        // Hide rejected reports
        if (rep.verificationStatus === 'REJECTED') return null;


        const icon = createCitizenReportIcon(rep.verificationStatus);

        return (
          <Marker key={rep.id} position={[lat, lng]} icon={icon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 max-w-xs font-sans text-slate-900">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                    rep.verificationStatus === 'VERIFIED'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-purple-100 text-purple-900'
                  }`}>
                    {rep.verificationStatus === 'VERIFIED' ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <ShieldAlert className="w-3 h-3" />
                    )}
                    <span>{rep.verificationStatus.replace('_', ' ')}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{rep.id}</span>
                </div>

                <div className="text-xs font-bold text-gray-900 mb-1">
                  Citizen Hazard Report ({rep.hazardType.replace('_', ' ')})
                </div>

                <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 mb-2 leading-relaxed">
                  {rep.description}
                </p>

                <div className="space-y-1 text-[10px] text-gray-500 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3 text-gray-400" />
                      <span>Evidence Media:</span>
                    </span>
                    <span className="font-semibold text-gray-700">{rep.mediaCount} attached item(s)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>Received:</span>
                    </span>
                    <span>{new Date(rep.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="text-[9px] text-gray-400 pt-1 border-t border-gray-100 flex items-center justify-between">
                  <span>Privacy Protected</span>
                  <span className="text-purple-700 font-semibold">{rep.source}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
