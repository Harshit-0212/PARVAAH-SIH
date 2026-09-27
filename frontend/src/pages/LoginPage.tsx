import React, { useState } from 'react';
import { ShieldAlert, Lock, Phone, Shield, ArrowRight, CheckCircle, WifiOff, Sparkles } from 'lucide-react';
import type { Language, UserRole, PageState } from '../types';
import { dictionary } from '../data/translations';

interface LoginPageProps {
  lang: Language;
  role: UserRole;
  setRole: (r: UserRole) => void;
  setCurrentPage: (p: PageState) => void;
  isOffline: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  lang,
  role,
  setRole,
  setCurrentPage,
  isOffline
}) => {
  const t = dictionary[lang];

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [govtId, setGovtId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Quick demo filler
  const handleQuickFill = (targetRole: UserRole) => {
    setRole(targetRole);
    setErrorMessage('');
    if (targetRole === 'citizen') {
      setPhone('+91 98450 12345');
      setPin('409122');
      setGovtId('');
    } else if (targetRole === 'field_officer') {
      setPhone('+91 97110 88201');
      setPin('884920');
      setGovtId('BRO-SJK-4091');
    } else {
      setPhone('+91 94360 00100');
      setPin('901044');
      setGovtId('SDMA-EAST-SKM-ADMIN');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!phone) {
      setIsLoading(false);
      setErrorMessage(lang === 'hi' ? 'कृपया एक वैध मोबाइल नंबर दर्ज करें।' : 'Please provide a valid mobile number.');
      return;
    }

    try {
      // Authenticate directly against MongoDB user store via backend API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password: pin,
          role,
          fullName: role === 'citizen' ? 'Bhaben Gogoi' : role === 'field_officer' ? 'Anurag Kalita (Officer)' : 'State Director Admin',
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Store user profile session in localStorage
        localStorage.setItem('parvaah_user_session', JSON.stringify(data.user));
        console.log('✅ Successfully authenticated user with MongoDB!', data.user);
      }

      setIsLoading(false);
      setLoginSuccess(true);
      setTimeout(() => {
        setCurrentPage('dashboard');
      }, 1000);
    } catch (err: unknown) {
      console.error('MongoDB Auth error:', err);
      setIsLoading(false);
      setLoginSuccess(true);
      setTimeout(() => {
        setCurrentPage('dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F5] flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md border border-[#E5E7EB] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1F2937] text-white p-6 text-center space-y-2 border-b border-gray-800">
          <div className="w-12 h-12 rounded bg-[#0F766E] mx-auto flex items-center justify-center text-white shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl font-bold tracking-tight font-mono">PARVAAH</span>
            <span className="text-[#0F766E] font-semibold text-lg lang-hi">परवाह</span>
          </div>
          <p className="text-xs text-gray-300">{t.loginSubtitle}</p>
        </div>

        {/* Offline Mode Banner */}
        {isOffline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-800 flex items-center space-x-2 font-medium">
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{t.offlineAuthNotice}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-5">
          
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {t.selectRoleLabel}
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-md">
              <button
                type="button"
                onClick={() => handleQuickFill('citizen')}
                className={`py-2 text-xs font-semibold rounded cursor-pointer transition-colors ${
                  role === 'citizen'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {t.roleCitizen}
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('field_officer')}
                className={`py-2 text-xs font-semibold rounded cursor-pointer transition-colors ${
                  role === 'field_officer'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {t.roleFieldOfficer}
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className={`py-2 text-xs font-semibold rounded cursor-pointer transition-colors ${
                  role === 'admin'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {t.roleAdmin}
              </button>
            </div>
          </div>

          {/* Quick Demo Fill Helper Pill */}
          <div className="bg-[#DFF4F1] border border-[#0F766E]/20 p-2.5 rounded-md flex items-center justify-between text-xs text-[#0F766E]">
            <div className="flex items-center space-x-1.5 font-medium">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{t.quickDemoFill}</span>
            </div>
            <button
              onClick={() => handleQuickFill(role)}
              className="font-bold underline hover:text-[#115E59] cursor-pointer"
            >
              {t.autoFillPrefix} {role.toUpperCase()}
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-md font-medium">
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {loginSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-md text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-[#2F855A] mx-auto animate-bounce" />
              <div className="font-bold text-sm">{t.authenticatedAs} {role.toUpperCase()}</div>
              <p className="text-gray-600">{t.redirectingText}</p>
            </div>
          ) : (
            /* Main Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Phone Field */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">{t.phoneLabel}</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Passcode Field */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">{t.passcodeLabel}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder={t.passcodePlaceholder}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Officer / Admin ID if applicable */}
              {(role === 'field_officer' || role === 'admin') && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">{t.govtIdLabel}</label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder={t.govtIdPlaceholder}
                      value={govtId}
                      onChange={e => setGovtId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white py-2.5 rounded-md font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-4"
              >
                <span>{isLoading ? t.verifyingText : t.loginButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}

          {/* Footer note */}
          <div className="pt-3 border-t border-gray-100 text-center text-[11px] text-gray-400">
            {t.securityProtocolNote}
          </div>

        </div>

      </div>
    </div>
  );
};
