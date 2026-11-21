import React, { useState } from 'react';
import { Bus, GraduationCap, KeyRound, ShieldCheck, Mail, ArrowRight, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { mockEngine } from '../services/mockEngine';
import { authService } from '../services/authService';
import { Driver, Institution, Role } from '../types';
import { DriverPinModal } from './DriverPinModal';
import { DevQuickLogin } from './DevQuickLogin';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<'student_employee' | 'driver' | 'admin'>('student_employee');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>(
    mockEngine.institutions[0]?.id || ''
  );

  // Student / Employee state
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Driver shared login state
  const [driverEmail, setDriverEmail] = useState('driver@bussync.dev');
  const [driverPassword, setDriverPassword] = useState('Driver@123');
  const [driverInstitutionVerified, setDriverInstitutionVerified] = useState(false);
  const [selectedDriverForPin, setSelectedDriverForPin] = useState<Driver | null>(null);

  // Status & error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const institutions = mockEngine.institutions;
  const currentInstitution = institutions.find((i) => i.id === selectedInstitutionId);

  // 1. Student / Employee: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your institution email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestOtp(selectedInstitutionId, email);
      setOtpSent(true);
      setInfoMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Student / Employee: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const role: Role = selectedRole === 'admin' ? 'admin' : 'student';
      await authService.verifyOtp(selectedInstitutionId, email, otpCode, role);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Driver: Step 1 Shared Login
  const handleDriverSharedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await authService.driverSharedLogin(driverEmail, driverPassword);
      setDriverInstitutionVerified(true);
      setInfoMessage('Institution credentials verified. Please select your name to enter your PIN.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Shared login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Available drivers for current institution
  const institutionDrivers = mockEngine.drivers.filter(
    (d) => d.institution_id === selectedInstitutionId
  );

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 my-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-float p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-sm">
            <Bus className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
            Sign In to BusSync
          </h1>
          <p className="text-xs text-slate-500">Live Institutional Bus Tracking</p>
        </div>

        {/* Institution Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            Select Institution
          </label>
          <select
            value={selectedInstitutionId}
            onChange={(e) => {
              setSelectedInstitutionId(e.target.value);
              setOtpSent(false);
              setDriverInstitutionVerified(false);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          >
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.visibility === 'public_to_area' ? 'Public' : 'Private'})
              </option>
            ))}
          </select>
        </div>

        {/* Role Navigation Segmented Control */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('student_employee');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'student_employee'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student / Staff
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('driver');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'driver'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Driver Portal
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'admin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Fleet Admin
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 1: STUDENT / EMPLOYEE LOGIN */}
        {/* ========================================================================= */}
        {selectedRole === 'student_employee' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Institution Roster Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@bussync.dev"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your email must be enrolled in {currentInstitution?.name || 'the institution'} roster.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-amber py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? 'Checking Roster...' : 'Send Verification OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-amber-700 hover:underline"
                    >
                      Change email
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 text-center">
                    Development bypass code: <strong className="font-mono text-slate-800">123456</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-amber py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Enter Campus Map'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 2: DRIVER LOGIN (SHARED CREDENTIALS + PERSONAL PIN) */}
        {/* ========================================================================= */}
        {selectedRole === 'driver' && (
          <div className="space-y-4">
            {!driverInstitutionVerified ? (
              <form onSubmit={handleDriverSharedLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Shared Institution Account
                  </label>
                  <input
                    type="email"
                    required
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    placeholder="driver@bussync.dev"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Institution Fleet Password
                  </label>
                  <input
                    type="password"
                    required
                    value={driverPassword}
                    onChange={(e) => setDriverPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-amber py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In as Driver Fleet'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Select Your Driver Profile:</span>
                  <button
                    type="button"
                    onClick={() => setDriverInstitutionVerified(false)}
                    className="text-xs text-amber-700 hover:underline"
                  >
                    Switch Account
                  </button>
                </div>

                <div className="space-y-2">
                  {institutionDrivers.map((driver) => (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelectedDriverForPin(driver)}
                      className="w-full p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-amber-950">
                          {driver.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{driver.phone}</div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 group-hover:border-amber-300 text-slate-700">
                        Enter PIN →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 3: ADMIN LOGIN */}
        {/* ========================================================================= */}
        {selectedRole === 'admin' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Fleet Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="admin@bussync.dev"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-amber py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? 'Checking Admin...' : 'Send Admin OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Enter Admin OTP</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-amber-700 hover:underline"
                    >
                      Change email
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-amber py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Access Fleet Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Dev Quick Login Section */}
        <DevQuickLogin
          onSuccess={onLoginSuccess}
          onError={(msg) => setErrorMessage(msg)}
        />
      </div>

      {/* Driver PIN Modal */}
      {selectedDriverForPin && (
        <DriverPinModal
          driver={selectedDriverForPin}
          institutionId={selectedInstitutionId}
          onSuccess={() => {
            setSelectedDriverForPin(null);
            onLoginSuccess();
          }}
          onCancel={() => setSelectedDriverForPin(null)}
        />
      )}
    </div>
  );
};

