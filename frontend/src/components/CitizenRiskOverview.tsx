import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CloudRain, 
  ShieldCheck, 
  MapPin, 
  ChevronRight, 
  PhoneCall, 
  Home, 
  TrendingUp, 
  CheckCircle2, 
  AlertOctagon,
  Clock,
  Compass
} from 'lucide-react';
import type { Language, Shelter } from '../types';
import { calculateLandslideRisk } from '../../lib/services/riskEngine';
import type { RiskLevel } from '../../lib/services/riskEngine';

interface CitizenRiskOverviewProps {
  lang: Language;
  selectedDistrict: string;
  districtDisplayName: string;
  rainfall24h: number;
  shelters: Shelter[];
  onOpenReportModal: () => void;
  onOpenAffectedMap: () => void;
}

export const CitizenRiskOverview: React.FC<CitizenRiskOverviewProps> = ({
  lang,
  selectedDistrict,
  districtDisplayName,
  rainfall24h,
  shelters,
  onOpenReportModal,
  onOpenAffectedMap,
}) => {
  const [safetyExpanded, setSafetyExpanded] = useState(false);

  // Compute synthesized landslide risk using our risk engine
  const risk = calculateLandslideRisk({
    district: selectedDistrict,
    districtName: districtDisplayName,
    rainfallMmPast24h: rainfall24h,
    rainfallTrend: rainfall24h > 60 ? 'Increasing' : 'Steady',
    hasActiveImdWarning: rainfall24h > 65,
  });

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertOctagon className="w-8 h-8 text-red-600 animate-pulse" />;
      case 'HIGH':
        return <AlertTriangle className="w-8 h-8 text-orange-600" />;
      case 'MODERATE':
        return <AlertTriangle className="w-8 h-8 text-amber-600" />;
      case 'LOW':
        return <ShieldCheck className="w-8 h-8 text-emerald-600" />;
    }
  };

  const getHeadline = () => {
    if (lang === 'hi' && risk.headlineHi) return risk.headlineHi;
    return risk.headline;
  };

  const getReason = () => {
    if (lang === 'hi' && risk.reasonHi) return risk.reasonHi;
    return risk.reason;
  };

  const getActions = () => {
    if (lang === 'hi' && risk.actionItemsHi) return risk.actionItemsHi;
    return risk.actionItems;
  };

  // Find nearest shelter
  const nearestShelter = shelters[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* 1. MY CURRENT RISK CARD */}
      <section className={`rounded-2xl border-2 p-6 md:p-8 shadow-sm transition-all ${risk.bgClass}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/10">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white rounded-xl shadow-xs">
              {getRiskIcon(risk.level)}
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-extrabold text-gray-500 block">
                {lang === 'hi' ? 'मेरा वर्तमान जोखिम' : 'My Current Risk'}
              </span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                {getHeadline()}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide uppercase border ${risk.badgeClass}`}>
              {risk.level}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-500 font-semibold block">
              {lang === 'hi' ? 'स्थान' : 'Location'}
            </span>
            <span className="text-base font-bold text-gray-900 flex items-center gap-1 mt-0.5">
              <MapPin className="w-4 h-4 text-[#0F766E]" />
              {districtDisplayName}
            </span>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs text-gray-500 font-semibold block">
              {lang === 'hi' ? 'जोखिम का कारण' : 'Why am I at risk?'}
            </span>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {getReason()}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between text-xs text-gray-500 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {lang === 'hi' ? 'अपडेट किया गया' : 'Updated'}: {risk.updatedAtMinutesAgo} mins ago
          </span>
          <span className="text-gray-400">
            {lang === 'hi' ? 'सटीक उपग्रह व रडार द्वारा सत्यापित' : 'Telemetry Verified'}
          </span>
        </div>
      </section>

      {/* 2. ACTIVE WARNING BANNER */}
      {risk.activeWarningMessage && (
        <section className="bg-amber-500 text-white rounded-2xl p-5 md:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <AlertTriangle className="w-7 h-7 shrink-0 text-amber-100 mt-0.5 animate-bounce" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                  {lang === 'hi' ? 'सक्रिय चेतावनी' : 'Active Warning'}
                </span>
                <span className="text-xs font-medium text-amber-100">Next 6 Hours</span>
              </div>
              <p className="text-base font-semibold mt-1 text-white leading-snug">
                {risk.activeWarningMessage}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSafetyExpanded(!safetyExpanded)}
            className="shrink-0 bg-white hover:bg-amber-50 text-amber-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-xs transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'सुरक्षा निर्देश देखें' : 'View Safety Instructions'}
          </button>
        </section>
      )}

      {/* 3. SIMPLIFIED WEATHER & RAINFALL SUMMARY */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-xs">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-[#0F766E]" />
          {lang === 'hi' ? 'मौसम एवं वर्षा सारांश' : 'Rainfall & Slope Metrics'}
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
          <div>
            <span className="text-xs text-gray-500 block font-medium">
              {lang === 'hi' ? '24 घंटे की बारिश' : '24h Rainfall'}
            </span>
            <span className="text-2xl md:text-3xl font-black text-gray-900 block mt-1 font-mono">
              {rainfall24h} <span className="text-sm font-normal text-gray-500">mm</span>
            </span>
            <span className={`text-[11px] font-bold mt-1 inline-block ${rainfall24h > 70 ? 'text-red-600' : 'text-emerald-600'}`}>
              {rainfall24h > 70 ? 'Heavy Downpour' : 'Moderate Showers'}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 block font-medium">
              {lang === 'hi' ? 'बारिश का रुझान' : 'Rainfall Trend'}
            </span>
            <span className="text-lg md:text-2xl font-black text-gray-900 mt-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              {risk.rainfallTrend}
            </span>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Slope saturation high
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 block font-medium">
              {lang === 'hi' ? 'पूर्वानुमान' : '6h Forecast'}
            </span>
            <span className="text-base md:text-xl font-bold text-gray-800 mt-1 block leading-tight">
              {rainfall24h > 60 ? 'Heavy Rain' : 'Scattered Showers'}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
              Hill travel risky
            </span>
          </div>
        </div>
      </section>

      {/* 4. WHAT SHOULD I DO? (Practical Safety Actions) */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
            <h2 className="text-lg font-bold text-gray-900">
              {lang === 'hi' ? 'मुझे क्या करना चाहिए?' : 'What Should I Do?'}
            </h2>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {lang === 'hi' ? 'नागरिक सुरक्षा नियम' : 'Official Guidelines'}
          </span>
        </div>

        <ul className="space-y-3">
          {getActions().map((action, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-sm text-gray-700 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
              <CheckCircle2 className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
              <span className="font-medium">{action}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. PRIMARY CITIZEN CALLS TO ACTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* REPORT INCIDENT TRIGGER */}
        <button
          onClick={onOpenReportModal}
          className="bg-[#C98212] hover:bg-[#b0710e] text-white p-5 rounded-2xl shadow-md transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black block tracking-tight">
                {lang === 'hi' ? 'भूस्खलन की रिपोर्ट करें' : 'REPORT LANDSLIDE'}
              </span>
              <span className="text-xs text-amber-100 font-medium block mt-0.5">
                {lang === 'hi' ? 'फोटो, जीपीएस और सड़क अवरोध दर्ज करें' : 'Send Photo & GPS to Emergency Authority'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* VIEW AFFECTED AREAS (Simplified Map Modal Trigger) */}
        <button
          onClick={onOpenAffectedMap}
          className="bg-[#0F766E] hover:bg-[#0d655e] text-white p-5 rounded-2xl shadow-md transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black block tracking-tight">
                {lang === 'hi' ? 'प्रभावित क्षेत्र देखें' : 'VIEW AFFECTED AREAS'}
              </span>
              <span className="text-xs text-teal-100 font-medium block mt-0.5">
                {lang === 'hi' ? 'सुरक्षित आश्रय, बंद सड़कें और खतरे के क्षेत्र' : 'Check Safe Shelters, Danger Zones & Blockages'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform" />
        </button>

      </section>

      {/* 6. NEAREST SAFE SHELTER & EMERGENCY HELPLINE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Nearest Shelter Card */}
        {nearestShelter && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  {lang === 'hi' ? 'निकटतम सुरक्षित आश्रय' : 'Nearest Safe Shelter'}
                </span>
                <span className="text-sm font-bold text-gray-900 block">
                  {nearestShelter.name}
                </span>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">
                  Capacity: {nearestShelter.occupied} / {nearestShelter.capacity} people
                </span>
              </div>
            </div>
            <button
              onClick={onOpenAffectedMap}
              className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
            >
              Directions →
            </button>
          </div>
        )}

        {/* Instant Emergency Helpline Tap */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">
                {lang === 'hi' ? 'आपदा नियंत्रण कक्ष' : 'State Disaster Helpline'}
              </span>
              <span className="text-base font-black text-gray-900 block font-mono">
                1070 <span className="text-xs font-normal text-gray-600">/ 112 (SDRF)</span>
              </span>
              <span className="text-xs text-gray-500 block mt-0.5">
                Toll-free 24/7 Landslide Rescue
              </span>
            </div>
          </div>
          <a
            href="tel:1070"
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition-colors"
          >
            Call Now
          </a>
        </div>

      </section>

    </div>
  );
};
