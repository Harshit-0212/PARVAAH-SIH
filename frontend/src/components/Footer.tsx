import React from 'react';
import { ShieldAlert, PhoneCall, Mail, ExternalLink, MapPin, Radio } from 'lucide-react';
import type { Language } from '../types';
import { dictionary } from '../data/translations';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = dictionary[lang];

  return (
    <footer className="bg-[#1F2937] text-white pt-12 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Brand & Purpose */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded bg-[#0F766E] flex items-center justify-center text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight font-mono">PARVAAH</div>
                <div className="text-xs text-emerald-400 font-semibold lang-hi">परवाह - पूर्व चेतावनी प्रणाली</div>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {t.footerDesc}
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{t.footerTelemetryBus}</span>
            </div>
          </div>

          {/* Col 2: Emergency Helplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
              {t.footerHelplines}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="tel:1070" 
                  className="flex items-center space-x-2 text-gray-200 hover:text-white transition-colors group"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">{t.contactStateControl}: 1070</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:1077" 
                  className="flex items-center space-x-2 text-gray-200 hover:text-white transition-colors group"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">{t.contactDistrictControl}: 1077</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:1090" 
                  className="flex items-center space-x-2 text-gray-200 hover:text-white transition-colors group"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">{t.contactBRO}: 1090</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:controlroom@parvaah-sdma.gov.in" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>controlroom@sdma.gov.in</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Key Regional Control Nodal Centers */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
              {t.footerNodalCenters}
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span>{t.nodal1}</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span>{t.nodal2}</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span>{t.nodal3}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Compatible Partner Agencies */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
              {t.footerOfficialLinks}
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <a href="https://ndma.gov.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>National Disaster Management Authority (NDMA)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>India Meteorological Department (IMD)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a href="https://gsi.gov.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>Geological Survey of India (GSI Landslide Cell)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a href="https://bro.gov.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>Border Roads Organisation (BRO)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 gap-2">
          <div>
            <p>{t.footerCopyright}</p>
            <p className="text-[11px] text-teal-400/90 font-mono mt-0.5">Aligned to Smart India Hackathon 2026 Problem Statement SIH26191</p>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="hover:text-gray-200 cursor-pointer">{t.footerAccessibility}</span>
            <span>•</span>
            <span className="hover:text-gray-200 cursor-pointer">{t.footerPrivacy}</span>
            <span>•</span>
            <span className="hover:text-gray-200 cursor-pointer">{t.footerLowBandwidth}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
