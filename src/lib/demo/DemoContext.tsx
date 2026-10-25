import React, { useState, useCallback } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { DemoContext, useDemoMode } from './demoContextDef';

const STORAGE_KEY = 'swach_navsari_demo_mode';

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const setDemoMode = useCallback((enabled: boolean) => {
    setIsDemoModeState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // Ignore local storage write errors
    }
  }, []);

  const toggleDemoMode = useCallback(() => {
    setDemoMode(!isDemoMode);
  }, [isDemoMode, setDemoMode]);

  return (
    <DemoContext.Provider value={{ isDemoMode, toggleDemoMode, setDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

/**
 * Visible banner strictly required whenever synthetic demo data is shown.
 */
export function DemoDataBanner({
  className = '',
  customMessage,
}: {
  className?: string;
  customMessage?: string;
}) {
  const { isDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div
      role="status"
      aria-label="Demo Data Notification"
      className={`bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl shadow-2xs flex items-start sm:items-center justify-between gap-3 text-amber-900 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
          DEMO DATA — SIMULATED
        </span>
        <p className="text-xs font-medium text-amber-800">
          {customMessage ||
            'Showing synthetic hackathon demonstration data across Navsari’s 13 municipal wards. No real civic complaints are modified.'}
        </p>
      </div>
      <div className="text-[11px] font-semibold text-amber-700 whitespace-nowrap hidden sm:block">
        Isolated Simulation
      </div>
    </div>
  );
}

/**
 * Clean UI Toggle allowing judges / reviewers to switch between live operations and synthetic demo mode.
 */
export function DemoToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <button
      type="button"
      onClick={toggleDemoMode}
      title={isDemoMode ? 'Switch to Live Database Mode' : 'Switch to Synthetic Demo Mode'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
        isDemoMode
          ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
      }`}
    >
      {isDemoMode ? (
        <>
          <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
          <span>Demo Mode (Active)</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 text-slate-500" />
          <span>Demo Data</span>
        </>
      )}
    </button>
  );
}
