import React, { useState, useEffect } from 'react';
import { Bus, LogOut, User, Shield, GraduationCap, Briefcase, KeyRound, AlertTriangle } from 'lucide-react';
import { authService, AuthState } from './services/authService';
import { mockEngine } from './services/mockEngine';
import { LoginScreen } from './components/LoginScreen';

import { DriverTripScreen } from './components/DriverTripScreen';
import { StudentMapScreen } from './components/StudentMapScreen';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const isMockMode = import.meta.env.VITE_USE_MOCKS === 'true';

  const [authState, setAuthState] = useState<AuthState>({
    user: authService.getCurrentUser(),
    driver: authService.getCurrentDriver(),
    isAuthenticated: !!authService.getCurrentUser()
  });

  useEffect(() => {
    return authService.onAuthStateChange((state) => {
      setAuthState(state);
    });
  }, []);

  const handleLogout = async () => {
    await authService.logout();
  };

  const currentInstitution = mockEngine.institutions.find(
    (i) => i.id === authState.user?.institution_id
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Dev Mode Banner */}
      {isDevMode && (
        <aside
          aria-label="Development Mode Alert"
          className="bg-amber-400 text-slate-950 font-semibold px-4 py-1.5 text-xs sm:text-sm flex items-center justify-between shadow-sm sticky top-0 z-50"
        >
          <div className="flex items-center gap-2 mx-auto">
            <span className="flex h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
            <span>DEV MODE ACTIVE</span>
            <span className="hidden sm:inline text-slate-800">
              | Quick logins &amp; mock simulator ready
            </span>
          </div>
        </aside>
      )}

      {/* Main Navigation Header */}
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
                  {currentInstitution ? currentInstitution.name : 'Institutional Fleet'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Live mobile bus tracking for colleges &amp; companies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {authState.isAuthenticated && authState.user && (
              <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  {authState.user.role === 'driver' && <KeyRound className="w-4 h-4" />}
                  {authState.user.role === 'student' && <GraduationCap className="w-4 h-4" />}
                  {authState.user.role === 'employee' && <Briefcase className="w-4 h-4" />}
                  {authState.user.role === 'admin' && <Shield className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white leading-tight">
                    {authState.user.name || authState.user.email}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wide">
                    {authState.user.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="ml-1 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <span className="hidden sm:flex px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 items-center gap-1.5 text-xs">
              <span className={`h-2 w-2 rounded-full ${isMockMode ? 'bg-emerald-400' : 'bg-blue-400'}`} />
              {isMockMode ? 'Mock Mode' : 'Supabase Live'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center p-4">
        {!authState.isAuthenticated ? (
          <LoginScreen onLoginSuccess={() => {}} />
        ) : authState.user?.role === 'driver' && authState.driver ? (
          <DriverTripScreen
            driver={authState.driver}
            institutionId={authState.user.institution_id}
          />
        ) : authState.user && (authState.user.role === 'student' || authState.user.role === 'employee') ? (
          <StudentMapScreen user={authState.user} />
        ) : authState.user && authState.user.role === 'admin' ? (
          <AdminDashboard user={authState.user} />
        ) : (
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-float p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <User className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
                Authenticated as {authState.user?.role}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight pt-2">
                Welcome, {authState.user?.name || authState.user?.email}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Institution: <strong className="text-slate-800">{currentInstitution?.name}</strong> (Code: {currentInstitution?.code})
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Details</div>
              <div className="text-sm">
                <span className="text-slate-500">Email:</span> <strong className="text-slate-800">{authState.user?.email}</strong>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Role:</span> <strong className="text-slate-800">{authState.user?.role}</strong>
              </div>
              {authState.driver && (
                <div className="text-sm">
                  <span className="text-slate-500">Driver Phone:</span> <strong className="text-slate-800">{authState.driver.phone}</strong>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                Sign Out &amp; Test Another Account
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Feature 2 Verified: Roster login, PIN verification &amp; Dev Quick Login functional</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
