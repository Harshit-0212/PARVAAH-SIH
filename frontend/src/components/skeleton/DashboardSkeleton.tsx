import React from 'react';
import type { Language } from '../../types';
import { Compass, Radio, Shield, MapPin, AlertTriangle } from 'lucide-react';

interface DashboardSkeletonProps {
  lang?: Language;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ lang: _lang = 'en' }) => {
  return (
    <div className="min-h-screen bg-[#F6F7F5] flex flex-col font-sans text-[#1F2937] pb-16 animate-fadeIn">
      {/* 1. Top Banner Telemetry Skeleton */}
      <div className="bg-slate-900 text-slate-400 px-4 py-2 text-xs border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping shrink-0"></span>
          <span className="font-mono text-[11px] text-teal-300 font-bold uppercase tracking-wider">
            SYNCHRONIZING OPERATIONAL TELEMETRY & GIS MESH...
          </span>
        </div>
        <div className="h-4 w-32 skeleton-shimmer-dark rounded"></div>
      </div>

      {/* 2. Top Dashboard Control & Status Bar Skeleton */}
      <div className="bg-white border-b border-[#E5E7EB] shadow-2xs sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-3">
          {/* District selector skeleton */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-56 skeleton-shimmer rounded-lg border border-gray-200"></div>
            <div className="h-4 w-32 skeleton-shimmer rounded hidden md:block"></div>
          </div>
          {/* Action buttons skeleton */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-44 skeleton-shimmer rounded-full"></div>
            <div className="h-8 w-36 skeleton-shimmer rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Viewport */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full space-y-6">
        
        {/* Operational Header Card Skeleton */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-900/50 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-72 skeleton-shimmer-dark rounded"></div>
              <div className="h-3.5 w-96 skeleton-shimmer-dark rounded opacity-70"></div>
            </div>
          </div>
          <div className="h-8 w-36 skeleton-shimmer-dark rounded-lg"></div>
        </div>

        {/* 4. KPI Metrics Cards Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* High Risk Card */}
          <div className="bg-white p-4 rounded-xl border border-red-100 shadow-xs flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 skeleton-shimmer rounded"></div>
              <div className="h-8 w-12 skeleton-shimmer rounded bg-red-100"></div>
              <div className="h-2.5 w-28 skeleton-shimmer rounded opacity-60"></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Road Blocks Card */}
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-28 skeleton-shimmer rounded"></div>
              <div className="h-8 w-12 skeleton-shimmer rounded bg-amber-100"></div>
              <div className="h-2.5 w-24 skeleton-shimmer rounded opacity-60"></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <MapPin className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Active Sensors Card */}
          <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-xs flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 skeleton-shimmer rounded"></div>
              <div className="h-8 w-12 skeleton-shimmer rounded bg-teal-100"></div>
              <div className="h-2.5 w-32 skeleton-shimmer rounded opacity-60"></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Shelters Card */}
          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-xs flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-28 skeleton-shimmer rounded"></div>
              <div className="h-8 w-16 skeleton-shimmer rounded bg-purple-100"></div>
              <div className="h-2.5 w-24 skeleton-shimmer rounded opacity-60"></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 5. GIS LIVE RISK MAP SKELETON (TACTICAL VIEWPORT) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-[#1F2937] flex items-center space-x-2">
                <Compass className="w-5 h-5 text-[#0F766E]" />
                <span>Live Risk Map — Geospatial Early Warning Engine</span>
              </h3>
              <p className="text-xs text-gray-500">
                Loading high-precision WGS84 vector layers, terrain susceptibility contours, and live telemetry mesh.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Initializing Spatial Buffers...
            </span>
          </div>

          {/* The Large Map Container Placeholder with Radar Grid */}
          <div className="relative w-full h-[540px] sm:h-[620px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col justify-between p-4 skeleton-radar-grid">
            {/* Top Status Bar Skeleton */}
            <div className="w-full flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <div className="h-3.5 w-64 skeleton-shimmer-dark rounded"></div>
              </div>
              <div className="h-4 w-24 skeleton-shimmer-dark rounded"></div>
            </div>

            {/* Layer Controls Skeleton floating top */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="h-7 w-28 skeleton-shimmer-dark rounded-lg"></div>
              <div className="h-7 w-32 skeleton-shimmer-dark rounded-lg"></div>
              <div className="h-7 w-24 skeleton-shimmer-dark rounded-lg"></div>
              <div className="h-7 w-24 skeleton-shimmer-dark rounded-lg"></div>
              <div className="h-7 w-24 skeleton-shimmer-dark rounded-lg"></div>
            </div>

            {/* Center Pulsing Radar Hub */}
            <div className="self-center flex flex-col items-center space-y-3 text-center my-auto">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-teal-500/40 animate-ping absolute"></div>
                <div className="w-16 h-16 rounded-full border border-teal-400/60 bg-teal-950/40 backdrop-blur-xs flex items-center justify-center text-teal-300 shadow-lg shadow-teal-500/20">
                  <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-teal-300 tracking-wider uppercase">
                  CALIBRATING SATELLITE & GROUND TELEMETRY
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  Connecting to Sevoke, Mawkdok, Haflong, Sela Pass, and Kohima early-warning telemetry nodes.
                </p>
              </div>
            </div>

            {/* Bottom Row: Legend Skeleton & Action Buttons */}
            <div className="flex justify-between items-end">
              <div className="w-56 h-28 skeleton-shimmer-dark rounded-xl border border-slate-800"></div>
              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 skeleton-shimmer-dark rounded-xl"></div>
                <div className="w-9 h-9 skeleton-shimmer-dark rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Incident Triage Queue Table Skeleton */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="h-5 w-64 skeleton-shimmer rounded"></div>
            <div className="h-4 w-24 skeleton-shimmer rounded"></div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-100">
                <div className="space-y-1.5 flex-1 max-w-md">
                  <div className="h-4 w-48 skeleton-shimmer rounded"></div>
                  <div className="h-3 w-64 skeleton-shimmer rounded opacity-60"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-24 skeleton-shimmer rounded-full"></div>
                  <div className="h-6 w-20 skeleton-shimmer rounded"></div>
                  <div className="h-7 w-20 skeleton-shimmer rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
