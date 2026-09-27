import React from 'react';
import { 
  ShieldAlert, 
  LogOut, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import type { PageState, UserRole } from '../../types';

interface AdminLayoutProps {
  currentPage: PageState;
  setCurrentPage: (p: PageState) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  onOpenReportModal: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPage,
  setCurrentPage,
  role,
  setRole,
  onOpenReportModal,
  children
}) => {

  const navigateTo = (page: PageState, path: string) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', path);
    }
  };

  const handleSignOut = () => {
    setRole('citizen');
    setCurrentPage('landing');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('parvaah_user_session');
      if (window.history?.pushState) {
        window.history.pushState(null, '', '/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F5] flex flex-col font-sans text-[#1F2937]">
      {/* 2) Admin Top Bar (Always visible in admin) */}
      <header className="sticky top-0 z-50 bg-[#1E293B] text-white border-b border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            
            {/* Left: Brand + Role Label */}
            <div 
              onClick={() => navigateTo('landing', '/admin/overview')}
              className="flex items-center space-x-2.5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-md bg-[#0F766E] flex items-center justify-center text-white shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-base font-bold tracking-tight font-mono">PARVAAH</span>
                <span className="text-gray-400 font-light">|</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-900/80 border border-teal-700 text-teal-200 uppercase tracking-wider">
                  District Admin
                </span>
              </div>
            </div>

            {/* Right: Logged-in user label + Sign Out link */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="hidden sm:flex items-center space-x-1.5 text-gray-300">
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-medium text-white">East Sikkim DDMA</span>
                <span className="text-gray-500 font-mono">({role === 'admin' ? 'State Command' : 'District Officer'})</span>
              </div>

              <button
                id="admin-signout-btn"
                onClick={handleSignOut}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 transition-colors cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>

        {/* 3) Secondary Navigation for Admin (Grouped under Monitoring, Planning, Operations) */}
        <div className="bg-[#0F172A] border-t border-gray-800 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 text-xs">
            
            <div className="flex items-center space-x-6 overflow-x-auto py-1 scrollbar-none">
              
              {/* Group A: MONITORING */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono px-1">
                  Monitoring:
                </span>
                <button
                  id="admin-nav-overview"
                  onClick={() => navigateTo('landing', '/admin/overview')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentPage === 'landing'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Overview
                </button>
                <button
                  id="admin-nav-map"
                  onClick={() => navigateTo('dashboard', '/admin/map')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentPage === 'dashboard'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Live Risk Map
                </button>
                <button
                  id="admin-nav-district-risk"
                  onClick={() => navigateTo('district-risk', '/admin/district-risk')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentPage === 'district-risk'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  District Risk
                </button>
              </div>

              <div className="h-4 w-px bg-gray-700 shrink-0"></div>

              {/* Group B: PLANNING */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono px-1">
                  Planning:
                </span>
                <button
                  id="admin-nav-relocation"
                  onClick={() => navigateTo('red-zones', '/admin/relocation')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentPage === 'red-zones'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Relocation Planning
                </button>
                <button
                  id="admin-nav-proof-protection"
                  onClick={() => navigateTo('proof-to-protection', '/admin/proof-protection')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentPage === 'proof-to-protection'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Proof → Protection
                </button>
                <button
                  id="admin-nav-clear-demo"
                  onClick={() => navigateTo('empty', '/admin/clear-state-demo')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentPage === 'empty'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Clear State Demo
                </button>
              </div>

              <div className="h-4 w-px bg-gray-700 shrink-0"></div>

              {/* Group C: OPERATIONS */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono px-1">
                  Operations:
                </span>
                <button
                  id="admin-nav-report"
                  onClick={onOpenReportModal}
                  className="px-2.5 py-1 rounded-md font-medium text-amber-300 hover:text-amber-200 hover:bg-gray-800 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Report Road Blockage</span>
                </button>
                <button
                  id="admin-nav-telemetry"
                  onClick={() => navigateTo('telemetry', '/admin/telemetry')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentPage === 'telemetry'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Telemetry Health
                </button>
                <button
                  id="admin-nav-risk-simulator"
                  onClick={() => navigateTo('risk-simulator', '/admin/risk-simulator')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentPage === 'risk-simulator'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Risk Simulator
                </button>
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Admin Content Body */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
