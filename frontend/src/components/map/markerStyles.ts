/**
 * Custom SVG & DivIcon Styling for Disaster Markers
 * Avoids broken default image URLs in Vite production bundles.
 */

import L from 'leaflet';
import type { Severity, HazardType } from '../../types';

// Hazard icon symbol representation
function getHazardSvgPath(hazardType?: HazardType | string): string {
  const type = String(hazardType || '').toUpperCase();
  if (type.includes('FLOOD')) {
    // Water wave icon
    return `<path d="M2 12c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M2 16c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  }
  if (type.includes('BRIDGE')) {
    // Bridge/infrastructure icon
    return `<path d="M4 19V7l8-4 8 4v12M4 11h16M12 3v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  }
  if (type.includes('ROAD') || type.includes('BLOCK')) {
    // Barrier / stop icon
    return `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4.93 4.93l14.14 14.14" stroke="currentColor" stroke-width="2"/>`;
  }
  // Default landslide triangle / rockfall
  return `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
}

export function createIncidentIcon(severity: Severity | string, hazardType?: HazardType | string): L.DivIcon {
  const sev = String(severity || '').toUpperCase();
  let bgClass = 'bg-amber-500 text-white border-amber-300';
  let pulseHtml = '';

  if (sev === 'CRITICAL') {
    bgClass = 'bg-red-600 text-white border-red-300 shadow-lg shadow-red-500/50';
    pulseHtml = '<span class="absolute -inset-1 rounded-full bg-red-500 opacity-75 animate-ping"></span>';
  } else if (sev === 'HIGH') {
    bgClass = 'bg-orange-500 text-white border-orange-200 shadow-md shadow-orange-500/40';
    pulseHtml = '<span class="absolute -inset-0.5 rounded-full bg-orange-400 opacity-60 animate-pulse"></span>';
  } else if (sev === 'MODERATE') {
    bgClass = 'bg-amber-500 text-white border-amber-200';
  } else {
    bgClass = 'bg-emerald-600 text-white border-emerald-200';
  }

  const svgIcon = getHazardSvgPath(hazardType);

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125" style="width: 32px; height: 32px;">
      ${pulseHtml}
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${bgClass} shadow-md">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
          ${svgIcon}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-incident-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export function createShelterIcon(): L.DivIcon {
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125" style="width: 30px; height: 30px;">
      <div class="w-7 h-7 rounded-full bg-teal-600 text-white border-2 border-white shadow-md flex items-center justify-center">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-shelter-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

export function createSensorIcon(status: string): L.DivIcon {
  const isWarn = status === 'WARNING' || status === 'CRITICAL';
  const colorClass = status === 'CRITICAL' 
    ? 'bg-purple-700 border-purple-300 text-white' 
    : isWarn 
    ? 'bg-purple-600 border-purple-200 text-white' 
    : 'bg-indigo-600 border-indigo-200 text-white';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125" style="width: 26px; height: 26px;">
      <div class="w-6 h-6 rounded-md ${colorClass} border shadow-md flex items-center justify-center">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
          <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
          <circle cx="12" cy="12" r="2"></circle>
          <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
          <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"></path>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-sensor-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

export function createCitizenReportIcon(status: string): L.DivIcon {
  const isVerified = status === 'VERIFIED';
  const isUnderVerification = status === 'UNDER_VERIFICATION' || !status;
  
  const colorClass = isVerified 
    ? 'bg-emerald-600 border-emerald-200 text-white' 
    : isUnderVerification
    ? 'bg-amber-500 border-amber-200 text-slate-950'
    : 'bg-violet-600 border-violet-200 text-white';

  const pulseRing = isUnderVerification
    ? `<span class="absolute -inset-1 rounded-full bg-amber-400 opacity-75 animate-ping"></span>`
    : '';

  const iconSvg = isUnderVerification
    ? `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
       </svg>`
    : `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
       </svg>`;

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125" style="width: 28px; height: 28px;" title="${isUnderVerification ? 'Citizen Report (Under Verification)' : 'Verified Report'}">
      ${pulseRing}
      <div class="relative w-6 h-6 rounded-full ${colorClass} border-2 shadow-lg flex items-center justify-center font-bold">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-report-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}


export function createUserLocationIcon(): L.DivIcon {
  const html = `
    <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
      <span class="absolute -inset-1 rounded-full bg-blue-500 opacity-60 animate-ping"></span>
      <div class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-location-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}
