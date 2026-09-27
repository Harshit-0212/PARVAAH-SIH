import React, { useState } from 'react';
import { ShieldAlert, Globe, AlertTriangle, Menu, X, ChevronDown } from 'lucide-react';
import type { Language, UserRole, PageState } from '../types';
import { dictionary } from '../data/translations';

interface NavbarProps {
  lang: Language;
  setLang: (l: Language) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  currentPage: PageState;
  setCurrentPage: (p: PageState) => void;
  isOffline: boolean;
  onOpenReportModal: () => void;
  onOpenLanguageModal?: () => void;
  onClearDemoState?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  setLang,
  role,
  setRole,
  currentPage,
  setCurrentPage,
  isOffline,
  onOpenReportModal,
  onOpenLanguageModal,
  onClearDemoState,
}) => {
  const t = dictionary[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  const navigateTo = (page: PageState, path?: string) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setRoleDropdownOpen(false);
    if (path && typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', path);
    }
  };

  const isAdmin = role === 'admin';
  const isOfficer = role === 'field_officer';
  const isPrivileged = isAdmin || isOfficer;

  return (
    <header className="sticky top-0 z-50 shadow-sm border-b border-[#E5E7EB] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Brand */}
          <div
            id="nav-brand"
            onClick={() => navigateTo('landing', '/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-md bg-[#0F766E] flex items-center justify-center text-white shadow-xs group-hover:bg-[#115E59] transition-colors">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#1F2937] font-mono leading-none">PARVAAH</span>
              <span className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">{t.platformSubtitle}</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">

            {/* Overview */}
            <button
              id="nav-overview"
              onClick={() => navigateTo('landing', '/')}
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                currentPage === 'landing'
                  ? 'bg-[#DFF4F1] text-[#0F766E]'
                  : 'text-[#374151] hover:bg-gray-100'
              }`}
            >
              {t.navLanding}
            </button>

            {/* Live Risk Map */}
            <button
              id="nav-dashboard"
              onClick={() => navigateTo('dashboard', '/map')}
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                currentPage === 'dashboard'
                  ? 'bg-[#DFF4F1] text-[#0F766E]'
                  : 'text-[#374151] hover:bg-gray-100'
              }`}
            >
              {t.navDashboard}
            </button>

            {/* District Risk — visible to all but highlighted for privileged */}
            <button
              id="nav-district-risk"
              onClick={() => navigateTo('district-risk', '/district-risk')}
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                currentPage === 'district-risk'
                  ? 'bg-[#DFF4F1] text-[#0F766E]'
                  : 'text-[#374151] hover:bg-gray-100'
              }`}
            >
              District Risk
            </button>

            {/* Relocation Planning */}
            <button
              id="nav-relocation"
              onClick={() => navigateTo('red-zones', '/relocation')}
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                currentPage === 'red-zones'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'text-[#374151] hover:bg-red-50 hover:text-red-700'
              }`}
            >
              Relocation Planning
            </button>

            {/* Proof→Protection */}
            <button
              id="nav-proof"
              onClick={() => navigateTo('proof-to-protection', '/proof-to-protection')}
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                currentPage === 'proof-to-protection'
                  ? 'bg-[#DFF4F1] text-[#0F766E]'
                  : 'text-[#374151] hover:bg-gray-100'
              }`}
            >
              Proof→Protection
            </button>

            {/* Privileged-only items */}
            {isPrivileged && (
              <>
                <button
                  id="nav-clear-demo"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onClearDemoState) onClearDemoState();
                  }}
                  className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 'empty'
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-[#374151] hover:bg-gray-100'
                  }`}
                >
                  {t.navClearDemo}
                </button>

                <button
                  id="nav-telemetry"
                  onClick={() => navigateTo('telemetry', '/telemetry')}
                  className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 'telemetry'
                      ? 'bg-[#DFF4F1] text-[#0F766E]'
                      : 'text-[#374151] hover:bg-gray-100'
                  }`}
                >
                  Telemetry Health
                </button>

                <button
                  id="nav-risk-simulator"
                  onClick={() => navigateTo('risk-simulator', '/risk-simulator')}
                  className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 'risk-simulator'
                      ? 'bg-[#DFF4F1] text-[#0F766E]'
                      : 'text-[#374151] hover:bg-gray-100'
                  }`}
                >
                  Risk Simulator
                </button>
              </>
            )}

            {/* Report Road Blockage */}
            <button
              id="nav-report"
              onClick={onOpenReportModal}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.navReport}</span>
            </button>

            {/* District Admin — admin only */}
            {isAdmin && (
              <button
                id="nav-district-admin"
                onClick={() => navigateTo('integration-health', '/integration-health')}
                className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  currentPage === 'integration-health'
                    ? 'bg-[#DFF4F1] text-[#0F766E]'
                    : 'text-[#374151] hover:bg-gray-100'
                }`}
              >
                District Admin
              </button>
            )}

            {/* Separator */}
            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* Language Toggle */}
            <button
              onClick={onOpenLanguageModal || toggleLanguage}
              className="flex items-center space-x-1 text-gray-600 hover:text-[#0F766E] px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-[11px] font-semibold cursor-pointer"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="nav-role-switcher"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  isAdmin
                    ? 'bg-[#0F766E] text-white border-[#0F766E]'
                    : isOfficer
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-[#374151] border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>
                  {isAdmin ? 'Admin' : isOfficer ? 'Officer' : t.navLogin}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => { setRole('citizen'); navigateTo('login', '/auth/signin'); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                  >
                    {t.navLogin}
                  </button>
                  <button
                    onClick={() => { setRole('field_officer'); setRoleDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                  >
                    Field Officer
                  </button>
                  <button
                    onClick={() => { setRole('admin'); setRoleDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                  >
                    District Admin
                  </button>
                  {isPrivileged && (
                    <button
                      onClick={() => { setRole('citizen'); navigateTo('landing', '/'); }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-medium cursor-pointer border-t border-gray-100 mt-1"
                    >
                      {t.navLogout}
                    </button>
                  )}
                </div>
              )}
            </div>

          </nav>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center space-x-2">
            {isOffline && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                OFFLINE
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Offline Status Bar */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-[11px] py-1 px-4 text-center font-bold tracking-wide">
          ⚡ OFFLINE MODE — Reports queued for sync on reconnect
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E7EB] bg-white px-4 pt-3 pb-4 space-y-1">
          <button onClick={() => navigateTo('landing', '/')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'landing' ? 'bg-[#DFF4F1] text-[#0F766E]' : 'text-[#374151]'}`}>{t.navLanding}</button>
          <button onClick={() => navigateTo('dashboard', '/map')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'dashboard' ? 'bg-[#DFF4F1] text-[#0F766E]' : 'text-[#374151]'}`}>{t.navDashboard}</button>
          <button onClick={() => navigateTo('district-risk', '/district-risk')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'district-risk' ? 'bg-[#DFF4F1] text-[#0F766E]' : 'text-[#374151]'}`}>District Risk</button>
          <button onClick={() => navigateTo('red-zones', '/relocation')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'red-zones' ? 'bg-red-50 text-red-700' : 'text-[#374151]'}`}>Relocation Planning</button>
          <button onClick={() => navigateTo('proof-to-protection', '/proof-to-protection')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'proof-to-protection' ? 'bg-[#DFF4F1] text-[#0F766E]' : 'text-[#374151]'}`}>Proof→Protection</button>
          {isPrivileged && (
            <>
              <button onClick={() => { if (onClearDemoState) onClearDemoState(); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-[#374151]">{t.navClearDemo}</button>
              <button onClick={() => navigateTo('telemetry', '/telemetry')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'telemetry' ? 'bg-[#DFF4F1] text-[#0F766E]' : 'text-[#374151]'}`}>Telemetry Health</button>
              <button onClick={() => navigateTo('risk-simulator', '/risk-simulator')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'risk-simulator' ? 'bg-[#DFF4F1] text-[#0F766E]' : 'text-[#374151]'}`}>Risk Simulator</button>
            </>
          )}
          <button onClick={() => { onOpenReportModal(); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-amber-700 bg-amber-50">
            {t.navReport}
          </button>
          {isAdmin && (
            <button onClick={() => navigateTo('integration-health', '/integration-health')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'integration-health' ? 'bg-[#DFF4F1] text-[#0F766E]' : 'text-[#374151]'}`}>District Admin</button>
          )}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-between px-1">
            <span className="text-xs text-gray-500 font-semibold">Language</span>
            <button onClick={toggleLanguage} className="px-2.5 py-1 text-xs rounded font-bold bg-[#0F766E] text-white">
              {lang === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
            </button>
          </div>
          <div className="pt-2 border-t border-gray-200 space-y-1">
            <button onClick={() => { setRole('citizen'); navigateTo('login', '/auth/signin'); }} className="w-full bg-[#0F766E] text-white py-2 rounded-md text-xs font-semibold text-center">
              {t.navLogin}
            </button>
            {isPrivileged && (
              <button onClick={() => { setRole('citizen'); navigateTo('landing', '/'); }} className="w-full bg-red-600 text-white py-2 rounded-md text-xs font-semibold text-center">
                {t.navLogout}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
