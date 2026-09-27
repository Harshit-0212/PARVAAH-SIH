import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { SensorRecord } from '../../types';
import { isValidCoordinatePair } from './geoUtils';
import { createSensorIcon } from './markerStyles';
import { Battery } from 'lucide-react';

interface SensorLayerProps {
  sensors: SensorRecord[];
}

export const SensorLayer: React.FC<SensorLayerProps> = ({ sensors }) => {
  return (
    <>
      {sensors.map((sensor) => {
        const lat = sensor.coordinates?.latitude;
        const lng = sensor.coordinates?.longitude;

        if (!isValidCoordinatePair(lat, lng)) {
          return null;
        }

        const icon = createSensorIcon(sensor.thresholdStatus);

        return (
          <Marker key={sensor.id} position={[lat, lng]} icon={icon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 max-w-xs font-sans text-slate-900">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1.5">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    sensor.thresholdStatus === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    sensor.thresholdStatus === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {sensor.thresholdStatus}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{sensor.id}</span>
                </div>

                <h4 className="text-xs font-bold text-gray-900 mb-0.5">{sensor.stationName}</h4>
                <div className="text-[10px] text-gray-500 mb-2">{sensor.sensorType}</div>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1 mb-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Live Reading:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {sensor.reading} {sensor.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Battery className="w-3 h-3 text-emerald-600" />
                      <span>Battery:</span>
                    </span>
                    <span className="font-semibold">{sensor.batteryPercent}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Elevation:</span>
                    <span className="font-semibold">{sensor.elevationMeters}m MSL</span>
                  </div>
                </div>

                <div className="text-[9px] text-gray-400 flex items-center justify-between border-t border-gray-100 pt-1">
                  <span>{sensor.source}</span>
                  <span className="font-mono text-teal-700">{sensor.isDemo ? 'DEMO' : 'LIVE'}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
