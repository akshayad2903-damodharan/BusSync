import React, { useState, useEffect } from 'react';
import { Bus, ShieldAlert, Sparkles, Database, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { mockEngine } from './services/mockEngine';

export default function App() {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const isMockMode = import.meta.env.VITE_USE_MOCKS === 'true';

  const [dbStats, setDbStats] = useState({
    institutions: mockEngine.institutions.length,
    routes: mockEngine.routes.length,
    stops: mockEngine.stops.length,
    buses: mockEngine.buses.length,
    drivers: mockEngine.drivers.length,
    roster: mockEngine.roster.length
  });

  useEffect(() => {
    return mockEngine.subscribe(() => {
      setDbStats({
        institutions: mockEngine.institutions.length,
        routes: mockEngine.routes.length,
        stops: mockEngine.stops.length,
        buses: mockEngine.buses.length,
        drivers: mockEngine.drivers.length,
        roster: mockEngine.roster.length
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Dev Mode Banner */}
      {isDevMode && (
        <aside aria-label="Development Mode Alert" className="bg-amber-400 text-slate-950 font-semibold px-4 py-1.5 text-xs sm:text-sm flex items-center justify-between shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2 mx-auto">
            <span className="flex h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
            <span>DEV MODE ACTIVE</span>
            <span className="hidden sm:inline text-slate-800">| Mock engine ready &amp; dev quick logins enabled</span>
          </div>
        </aside>
      )}

      {/* Main App Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm">
              <Bus className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight font-heading">BusSync</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full border border-slate-700">
                  Campus Fleet
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Live mobile bus tracking for colleges &amp; companies</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isMockMode ? 'bg-emerald-400' : 'bg-blue-400'}`} />
              {isMockMode ? 'Mock Mode' : 'Supabase Live'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 flex-1 w-full flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-subtle p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <Database className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              Feature 1 Initialized
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
              PostgreSQL multi-tenant schema, RLS policies, sample seeds, and mock database engine are loaded and ready.
            </p>
          </div>

          {/* Database & Seed Verification Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                Institutions
              </div>
              <div className="text-lg font-bold text-slate-900">{dbStats.institutions} <span className="text-xs font-normal text-slate-500">(Apex, Zenith)</span></div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <Bus className="w-3.5 h-3.5 text-blue-500" />
                Fleet Buses
              </div>
              <div className="text-lg font-bold text-slate-900">{dbStats.buses} <span className="text-xs font-normal text-slate-500">(4 buses)</span></div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Routes &amp; Stops
              </div>
              <div className="text-lg font-bold text-slate-900">{dbStats.routes} <span className="text-xs font-normal text-slate-500">routes, {dbStats.stops} stops</span></div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Drivers
              </div>
              <div className="text-lg font-bold text-slate-900">{dbStats.drivers} <span className="text-xs font-normal text-slate-500">(PIN verified)</span></div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-2">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                Roster Directory
              </div>
              <div className="text-lg font-bold text-slate-900">{dbStats.roster} Verified Student &amp; Employee Entries</div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Ready for Feature 2: Roster-based student login and driver PIN login</span>
          </div>
        </div>
      </main>
    </div>
  );
}
