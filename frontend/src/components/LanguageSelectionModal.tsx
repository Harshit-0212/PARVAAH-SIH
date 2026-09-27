import React, { useState } from 'react';
import { ShieldAlert, Check, Globe, X } from 'lucide-react';
import type { Language } from '../types';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  currentLang: Language;
  onSelectLanguage: (lang: Language) => void;
  onClose?: () => void;
  isFirstVisit?: boolean;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isOpen,
  currentLang,
  onSelectLanguage,
  onClose,
  isFirstVisit = false,
}) => {
  const [selected, setSelected] = useState<Language>(currentLang);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectLanguage(selected);
    if (onClose) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden transform transition-all duration-300 scale-100"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0F766E] to-[#115E59] text-white px-6 py-6 relative">
          {!isFirstVisit && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-teal-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close language selector"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold tracking-tight font-mono">PARVAAH</span>
                <span className="text-base font-semibold text-teal-200 lang-hi">परवाह</span>
              </div>
              <p className="text-[11px] text-teal-100 font-medium">
                North Eastern Region Landslide Warning System
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 bg-teal-50 border border-teal-200/80 text-[#0F766E] px-3 py-1 rounded-full text-xs font-bold mb-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Language Preference / भाषा प्राथमिकता</span>
            </div>
            <h2 
              id="language-modal-title"
              className="text-2xl font-black text-gray-900 tracking-tight"
            >
              Choose your language / अपनी भाषा चुनें
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Select your preferred language to continue to PARVAAH
              <br />
              <span className="text-gray-500 lang-hi">पोर्टल पर आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें</span>
            </p>
          </div>

          {/* Language Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* English Option */}
            <button
              type="button"
              onClick={() => setSelected('en')}
              className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E] ${
                selected === 'en'
                  ? 'border-[#0F766E] bg-teal-50/50 shadow-sm ring-1 ring-[#0F766E]/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  EN
                </span>
                {selected === 'en' && (
                  <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="text-lg font-bold text-gray-900">English</div>
              <p className="text-xs text-gray-500 mt-1 leading-snug">
                Disaster Early Warning & Mitigation Platform
              </p>
            </button>

            {/* Hindi Option */}
            <button
              type="button"
              onClick={() => setSelected('hi')}
              className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E] ${
                selected === 'hi'
                  ? 'border-[#0F766E] bg-teal-50/50 shadow-sm ring-1 ring-[#0F766E]/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  HI
                </span>
                {selected === 'hi' && (
                  <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="text-lg font-bold text-gray-900 lang-hi">हिन्दी (Hindi)</div>
              <p className="text-xs text-gray-500 mt-1 leading-snug lang-hi">
                पर्वतीय आपदा पूर्व चेतावनी एवं त्वरित प्रतिक्रिया प्रणाली
              </p>
            </button>

          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full bg-[#0F766E] hover:bg-[#0d655e] text-white py-3.5 px-6 rounded-2xl font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-teal-200"
            >
              <span>{selected === 'hi' ? 'जारी रखें (Continue)' : 'Continue to PARVAAH'}</span>
            </button>
            <p className="text-[11px] text-center text-gray-500 mt-3">
              {selected === 'hi'
                ? 'आप इस भाषा प्राथमिकता को कभी भी ऊपर नेविगेशन बार से बदल सकते हैं।'
                : 'You can change this preference anytime from the top navigation bar.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
