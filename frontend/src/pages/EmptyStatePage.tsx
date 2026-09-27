import React from 'react';
import { ShieldCheck, Filter, ArrowLeft, AlertTriangle } from 'lucide-react';
import type { Language, PageState } from '../types';
import { dictionary } from '../data/translations';

interface EmptyStatePageProps {
  lang: Language;
  setCurrentPage: (p: PageState) => void;
  onResetFilters: () => void;
  onOpenReportModal: () => void;
}

export const EmptyStatePage: React.FC<EmptyStatePageProps> = ({
  lang,
  setCurrentPage,
  onResetFilters,
  onOpenReportModal
}) => {
  const t = dictionary[lang];

  return (
    <div className="min-h-screen bg-[#F6F7F5] flex items-center justify-center p-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-xs border border-[#E5E7EB] p-8 text-center space-y-6">
        
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-full bg-[#DFF4F1] mx-auto flex items-center justify-center text-[#0F766E]">
          <ShieldCheck className="w-9 h-9" />
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#0F766E] font-bold">
            {t.emptyBadge}
          </span>
          <h2 className="text-xl font-bold text-[#1F2937]">{t.emptyTitle}</h2>
          <p className="text-xs text-[#6B7280] leading-relaxed max-w-sm mx-auto">
            {t.emptySubtitle}
          </p>
        </div>

        {/* Status Pills */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-xs text-left space-y-2 font-mono">
          <div className="flex justify-between items-center text-gray-700">
            <span>{t.emptySlopeMeter}</span>
            <span className="font-bold text-[#2F855A]">{t.emptySlopeVal}</span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span>{t.emptyHighwayMeter}</span>
            <span className="font-bold text-[#2F855A]">{t.emptyHighwayVal}</span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span>{t.emptyRainMeter}</span>
            <span className="font-bold text-[#2F855A]">{t.emptyRainVal}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              onResetFilters();
              setCurrentPage('dashboard');
            }}
            className="w-full sm:w-auto bg-[#0F766E] hover:bg-[#115E59] text-white px-5 py-2.5 rounded-md text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            <span>{t.clearFilterBtn}</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="w-full sm:w-auto bg-[#C98212] hover:bg-[#b0710e] text-white px-5 py-2.5 rounded-md text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{t.heroActionReport}</span>
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setCurrentPage('landing')}
            className="text-xs text-gray-500 hover:text-gray-900 font-semibold inline-flex items-center space-x-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.returnOverviewBtn}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
