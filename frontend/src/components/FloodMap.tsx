import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { WardRisk, RiskCategory } from '../types/risk';
import { ShieldAlert, Droplets, Clock, AlertTriangle } from 'lucide-react';

interface FloodMapProps {
  wardRisks: WardRisk[];
  selectedWardId?: string | null;
  onSelectWard?: (ward: WardRisk) => void;
}

export const FloodMap: React.FC<FloodMapProps> = ({
  wardRisks,
  selectedWardId,
  onSelectWard
}) => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('/data/ward_boundaries.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load GeoJSON');
        return res.json();
      })
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Error loading ward boundaries GeoJSON:', err));
  }, []);

  const getRiskColor = (category?: RiskCategory): string => {
    switch (category) {
      case 'Very High':
        return '#ef4444'; // Red
      case 'High':
        return '#f97316'; // Orange
      case 'Medium':
        return '#eab308'; // Amber/Yellow
      case 'Low':
        return '#10b981'; // Emerald Green
      default:
        return '#64748b'; // Slate Gray
    }
  };

  const getWardRiskInfo = (wardId: string): WardRisk | undefined => {
    return wardRisks.find((w) => w.wardId.toUpperCase() === wardId.toUpperCase());
  };

  const styleFeature = (feature: any) => {
    const wardId = feature.properties?.wardId || '';
    const risk = getWardRiskInfo(wardId);
    const isSelected = selectedWardId === wardId;

    return {
      fillColor: getRiskColor(risk?.riskCategory),
      weight: isSelected ? 3 : 1.5,
      opacity: 1,
      color: isSelected ? '#ffffff' : '#1e293b',
      dashArray: isSelected ? '4' : '',
      fillOpacity: isSelected ? 0.75 : 0.55
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const wardId = feature.properties?.wardId;
    const ward = getWardRiskInfo(wardId);

    layer.on({
      click: () => {
        if (ward && onSelectWard) {
          onSelectWard(ward);
        }
      },
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.85, weight: 2.5 });
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle(styleFeature(feature));
      }
    });
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden shadow-xl border border-slate-700 bg-slate-900">
      <MapContainer
        center={[26.16, 91.76]} // Centered on Guwahati/Kamrup (Assam)
        zoom={12}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoData && (
          <GeoJSON
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-lg border border-slate-700 text-xs shadow-lg text-slate-200">
        <div className="font-semibold text-sm mb-2 flex items-center gap-1.5 text-white">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          Flood Hazard Index
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red-500 inline-block border border-red-700"></span>
            <span>Very High (&ge; 70)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-orange-500 inline-block border border-orange-700"></span>
            <span>High (50 - 69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-yellow-500 inline-block border border-yellow-700"></span>
            <span>Medium (30 - 49)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block border border-emerald-700"></span>
            <span>Low (&lt; 30)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FloodMap;
