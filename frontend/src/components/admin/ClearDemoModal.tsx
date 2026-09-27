import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Loader2, ShieldOff, Info } from 'lucide-react';

interface ClearDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleared: () => void;
}

interface ActiveScenarioInfo {
  id: string;
  name: string;
  district?: string;
}

export const ClearDemoModal: React.FC<ClearDemoModalProps> = ({ isOpen, onClose, onCleared }) => {
  const [activeScenario, setActiveScenario] = useState<ActiveScenarioInfo | null>(null);
  const [hasActiveScenario, setHasActiveScenario] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; cleared: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset on close
      setResult(null);
      setError(null);
      return;
    }

    // Query active scenario status
    setIsLoading(true);
    setHasActiveScenario(null);
    setActiveScenario(null);

    fetch('/api/v1/scenarios/active')
      .then(r => r.json())
      .then(data => {
        setHasActiveScenario(data.hasActiveScenario ?? false);
        setActiveScenario(data.activeScenario || null);
      })
      .catch(() => {
        setHasActiveScenario(false);
        setError('Unable to reach backend. Check that the server is running.');
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const handleClear = async () => {
    setIsClearing(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/scenarios/clear-active', { method: 'POST' });
      const data = await res.json();

      setResult({
        success: data.success ?? false,
        message: data.message || 'Operation completed.',
        cleared: data.cleared ?? false
      });

      if (data.success && data.cleared) {
        onCleared();
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-demo-modal-title"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <ShieldOff className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 id="clear-demo-modal-title" className="text-base font-bold text-gray-900">
                Clear Active Demo Scenario
              </h2>
              <p className="text-xs text-gray-500 font-medium">Restore baseline operational state</p>
            </div>
          </div>
          <button
            id="clear-demo-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span className="text-sm">Checking active scenario status…</span>
            </div>
          )}

          {!isLoading && result && (
            <div className={`flex items-start space-x-3 rounded-xl p-4 ${result.cleared ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'}`}>
              <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${result.cleared ? 'text-emerald-600' : 'text-blue-600'}`} />
              <div>
                <p className={`text-sm font-semibold ${result.cleared ? 'text-emerald-800' : 'text-blue-800'}`}>
                  {result.cleared ? 'Scenario Cleared Successfully' : 'No Action Needed'}
                </p>
                <p className="text-xs mt-1 text-gray-600">{result.message}</p>
              </div>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-start space-x-3 rounded-xl p-4 bg-red-50 border border-red-200">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!isLoading && !result && (
            <>
              {/* Active scenario badge */}
              {hasActiveScenario && activeScenario ? (
                <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Active Demo Scenario Detected</p>
                      <p className="text-xs mt-1 text-amber-700 font-medium">{activeScenario.name}</p>
                      {activeScenario.district && (
                        <p className="text-xs text-amber-600">District: {activeScenario.district}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : hasActiveScenario === false ? (
                <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      No active demo scenario to clear. System is already in baseline state.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Confirmation text — required per implementation plan */}
              <div className="rounded-xl p-4 bg-gray-50 border border-gray-100 text-sm text-gray-700 leading-relaxed">
                <p className="font-semibold text-gray-900 mb-1">What this does:</p>
                <p>
                  Clear active demo scenario? This removes temporary simulated weather, risk, road, shelter, and alert
                  overrides. <span className="font-semibold text-emerald-700">Stored reports and verified records will
                  not be deleted.</span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        {!result && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              id="clear-demo-cancel-btn"
              onClick={onClose}
              disabled={isClearing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {hasActiveScenario && (
              <button
                id="clear-demo-confirm-btn"
                onClick={handleClear}
                disabled={isClearing || isLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                <span>{isClearing ? 'Clearing…' : 'Clear Demo Scenario'}</span>
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              id="clear-demo-done-btn"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
