import React from 'react';
import { AlertOctagon, MapPinOff, ArrowLeft, Home } from 'lucide-react';
import type { Language, PageState } from '../types';
import { dictionary } from '../data/translations';

interface NotFoundPageProps {
  lang: Language;
  setCurrentPage: (p: PageState) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ lang, setCurrentPage }) => {
  const t = dictionary[lang];

  return (
    <div className="min-h-screen bg-[#F6F7F5] flex items-center justify-center p-4 py-16">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md border border-[#E5E7EB] p-8 text-center space-y-6">
        
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center text-red-600">
          <MapPinOff className="w-9 h-9" />
        </div>

        {/* 404 Text */}
        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-red-700 font-mono tracking-tight block">404</span>
          <h2 className="text-lg font-bold text-[#1F2937]">{t.notFoundTitle}</h2>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            {t.notFoundDesc}
          </p>
        </div>

        {/* Road Closed Civic Sign Graphic */}
        <div className="bg-amber-50 border border-amber-300 p-3 rounded-md text-amber-900 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-amber-700" />
          <span>{t.notFoundBadge}</span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col space-y-2">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white py-2.5 rounded-md text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t.backHomeBtn}</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('landing')}
            className="text-xs text-gray-500 hover:text-gray-900 font-semibold py-1 inline-flex items-center justify-center space-x-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.goLandingBtn}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
