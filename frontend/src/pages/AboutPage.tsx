import React from 'react';
import { ShieldCheck, Mountain, Users, Building, ArrowRight } from 'lucide-react';
import type { Language, PageState } from '../types';

interface AboutPageProps {
  lang?: Language;
  setCurrentPage: (p: PageState) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-[#F6F7F5] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#1F2937]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-200 text-[#0F766E] px-3.5 py-1 rounded-full text-xs font-bold font-mono">
            <span>SIH26191 Problem Statement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            About PARVAAH • SIH26191
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations in the North Eastern Region.
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mountain className="w-5 h-5 text-teal-700" />
            <span>Problem Context & Objectives</span>
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            The North Eastern Region (NER) of India—spanning Sikkim, Assam, Meghalaya, Arunachal Pradesh, Manipur, Nagaland, Mizoram, and Tripura—is subject to severe monsoon-induced slope instabilities, flash floods, and geohazard vulnerabilities.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            PARVAAH translates historical landslide inventories, multi-day precipitation telemetry (IMD & Open-Meteo), terrain morphometry, and shelter logistics into an operational spatial decision support system for district administrators and state disaster management authorities.
          </p>
        </div>

        {/* Built For Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Citizens</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Provides live hyper-local risk visualization, crowd-sourced ground blockage reports, and direct emergency evacuation shelter directions.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">District Administrators</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Interactive district officer risk dashboards with verifiable ground report triage, road clearance status, and real-time hazard alerts.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">State Disaster Management</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Comprehensive Carrying Capacity & Relocation Planning suite, priority staging queues (IMMEDIATE vs SHORT_TERM), and downloadable gazette-ready reports.
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-[#1E293B] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Explore the Live System</h3>
            <p className="text-xs text-gray-300">View real-time risk maps or inspect data-driven relocation plans.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentPage('dashboard');
                if (typeof window !== 'undefined' && window.history?.pushState) {
                  window.history.pushState(null, '', '/map');
                }
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Live Risk Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setCurrentPage('red-zones');
                if (typeof window !== 'undefined' && window.history?.pushState) {
                  window.history.pushState(null, '', '/relocation');
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Relocation Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
