import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Database, 
  Cpu, 
  PhoneCall, 
  ArrowRight,
  Droplets,
  Mountain
} from 'lucide-react';
import type { Language, PageState } from '../types';
import { dictionary } from '../data/translations';
import { AnimatedHeroHeading } from '../components/AnimatedHeroHeading';
import { FloodMap } from '../components/FloodMap';
import { AlertsPanel } from '../components/AlertsPanel';
import { fetchWardRisks, fetchAlerts } from '../services/riskApi';
import type { WardRisk, WardAlert } from '../types/risk';

interface LandingPageProps {
  lang: Language;
  setCurrentPage: (p: PageState) => void;
  onOpenReportModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lang,
  setCurrentPage,
  onOpenReportModal,
}) => {
  const t = dictionary[lang];
  const [wardRisks, setWardRisks] = React.useState<WardRisk[]>([]);
  const [alerts, setAlerts] = React.useState<WardAlert[]>([]);
  const [selectedWardId, setSelectedWardId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchWardRisks().then((data) => setWardRisks(data)).catch(console.error);
    fetchAlerts().then((data) => setAlerts(data)).catch(console.error);
  }, []);

  return (
    <div className={`min-h-screen bg-[#F6F7F5] flex flex-col font-sans text-[#1F2937] ${lang === 'hi' ? 'lang-hi' : ''}`}>
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-[#FEF2F2] border-b border-red-200 px-4 py-2.5 text-xs text-red-900">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-medium">
            <span className="bg-red-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full shrink-0 animate-pulse">
              {lang === 'hi' ? 'मानसून अलर्ट' : 'Monsoon Advisory'}
            </span>
            <span className="text-red-900 font-bold">
              {t.monsoonAlert}
            </span>
          </div>

          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center space-x-1 text-red-700 hover:text-red-950 font-extrabold underline shrink-0 cursor-pointer ml-auto text-xs"
          >
            <span>{t.checkRiskNow}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. HERO SECTION — Animated Heading */}
      <section className="bg-white border-b border-gray-200 py-16 md:py-24 relative overflow-hidden">
        
        {/* Subtle decorative background gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-50/60 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">

          {/* Platform badge */}
          <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-200/80 text-[#0F766E] px-4 py-1.5 rounded-full text-xs font-bold shadow-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <span>{t.heroNodalBadge}</span>
          </div>

          {/* Animated Hero Heading */}
          <AnimatedHeroHeading lang={lang} />

          {/* Hero description */}
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed font-normal">
            {t.heroDesc}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-3 pt-2">

            <button
              id="hero-cta-dashboard"
              onClick={() => setCurrentPage('dashboard')}
              className="bg-[#0F766E] hover:bg-[#0d655e] text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-teal-200" />
              <span>{t.heroCtaDashboard}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-cta-report"
              onClick={onOpenReportModal}
              className="bg-[#C98212] hover:bg-[#b0710e] text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-200" />
              <span>{t.heroCtaReport}</span>
            </button>

          </div>

          {/* Fast telemetry status */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              {lang === 'hi' ? 'सक्रिय जलवैज्ञानिक टेलीमेट्री' : 'Live Hydrological Telemetry Active'}
            </span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#0F766E]" />
              MongoDB Atlas 2dsphere Spatial
            </span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              Google Gemini 2.5 Flash AI
            </span>
          </div>

        </div>
      </section>

      {/* 2.5 HYPER-LOCAL FLASH FLOOD EARLY WARNING SYSTEM (SIH CORE) */}
      <section className="py-12 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                SIH26191 Hyper-Local Early Warning Engine
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Live Ward-Level Flash Flood Hazard & Early Warnings
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl mt-1">
                Combining INDOFLOODS historical catalog, IMD/Open-Meteo precipitation, and DEM stream-proximity modeling to calculate lead times and actionable evacuations.
              </p>
            </div>
          </div>

          {/* Interactive GIS Map & Alerts Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <FloodMap
                wardRisks={wardRisks}
                selectedWardId={selectedWardId}
                onSelectWard={(ward) => setSelectedWardId(ward.wardId)}
              />
            </div>
            <div className="lg:col-span-5">
              <AlertsPanel
                alerts={alerts}
                selectedWardId={selectedWardId}
                onSelectAlert={(wardId) => setSelectedWardId(wardId)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW THE PLATFORM WORKS (3 Functional Modules) */}
      <section className="py-16 md:py-20 bg-[#F6F7F5] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {lang === 'hi' ? 'प्रणाली संरचना' : 'System Architecture'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {t.systemArchitectureTitle}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {t.systemArchitectureSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <Droplets className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t.module1Title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.module1Desc}</p>
              <ul className="space-y-2 pt-2 text-xs text-gray-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F766E]" /><span>{t.module1Point1}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F766E]" /><span>{t.module1Point2}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F766E]" /><span>{t.module1Point3}</span></li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t.module2Title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.module2Desc}</p>
              <ul className="space-y-2 pt-2 text-xs text-gray-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /><span>{t.module2Point1}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /><span>{t.module2Point2}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /><span>{t.module2Point3}</span></li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <Mountain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t.module3Title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.module3Desc}</p>
              <ul className="space-y-2 pt-2 text-xs text-gray-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-red-600" /><span>{t.module3Point1}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-red-600" /><span>{t.module3Point2}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-red-600" /><span>{t.module3Point3}</span></li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 4. TECHNICAL IMPLEMENTATION */}
      <section className="py-16 md:py-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#C98212] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {lang === 'hi' ? 'तकनीकी कार्यान्वयन' : 'Technical Implementation'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {t.techTitle}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {t.techSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">TS</div>
              <h4 className="text-base font-bold text-gray-900">{t.tech1Title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{t.tech1Desc}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm"><Database className="w-5 h-5" /></div>
              <h4 className="text-base font-bold text-gray-900">{t.tech2Title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{t.tech2Desc}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm"><Layers className="w-5 h-5" /></div>
              <h4 className="text-base font-bold text-gray-900">{t.tech3Title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{t.tech3Desc}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm"><Cpu className="w-5 h-5" /></div>
              <h4 className="text-base font-bold text-gray-900">{t.tech4Title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{t.tech4Desc}</p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="bg-[#0F766E] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {t.readyToCheckTitle}
          </h2>
          <p className="text-sm sm:text-base text-teal-100 max-w-2xl mx-auto leading-relaxed">
            {t.readyToCheckDesc}
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="bg-white hover:bg-teal-50 text-[#0F766E] px-8 py-4 rounded-2xl font-black text-base shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{t.btnGoDashboard}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenReportModal}
              className="bg-[#C98212] hover:bg-[#b0710e] text-white px-7 py-4 rounded-2xl font-bold text-base shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 text-amber-200" />
              <span>{t.btnReportIncident}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. EMERGENCY HELPLINES */}
      <div className="bg-slate-900 text-white py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-teal-400" />
            <span className="font-bold">{t.officialHelplines}</span>
            <span className="text-slate-400">{t.helplineNumbers}</span>
          </div>
          <div className="text-slate-400">
            {t.govtAffiliation}
          </div>
        </div>
      </div>

    </div>
  );
};

export default LandingPage;
