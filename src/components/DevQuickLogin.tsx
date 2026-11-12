import React from 'react';
import { Sparkles, KeyRound, GraduationCap, Briefcase, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';

interface DevQuickLoginProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const DevQuickLogin: React.FC<DevQuickLoginProps> = ({ onSuccess, onError }) => {
  // Guard: Entire component will be tree-shaken if VITE_DEV_MODE is false
  if (import.meta.env.VITE_DEV_MODE !== 'true') {
    return null;
  }

  const handleQuickLogin = async (email: string) => {
    try {
      await authService.devQuickLogin(email);
      onSuccess();
    } catch (err: any) {
      onError(err.message || 'Dev login failed');
    }
  };

  return (
    <div className="bg-amber-500/10 border-2 border-dashed border-amber-400 rounded-2xl p-4 sm:p-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-amber-400 text-slate-950">
            <Sparkles className="w-4 h-4 fill-current" />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 font-heading">
            Dev Quick Login (One-Tap Test Accounts)
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
          VITE_DEV_MODE=true
        </span>
      </div>

      <p className="text-xs text-amber-950/80 mb-3">
        Instant one-click authentication. Stripped completely from production builds.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Driver Quick Login */}
        <button
          type="button"
          onClick={() => handleQuickLogin('driver@bussync.dev')}
          className="flex items-start gap-2.5 p-3 rounded-xl bg-white hover:bg-amber-50/70 border border-amber-200 text-left transition-all active:scale-[0.98] shadow-sm group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              Driver: Ravi Kumar
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded">PIN 1234</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">driver@bussync.dev</div>
          </div>
        </button>

        {/* Student Quick Login */}
        <button
          type="button"
          onClick={() => handleQuickLogin('student@bussync.dev')}
          className="flex items-start gap-2.5 p-3 rounded-xl bg-white hover:bg-amber-50/70 border border-amber-200 text-left transition-all active:scale-[0.98] shadow-sm group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              Student: Rohan (Apex)
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded">OTP 123456</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">student@bussync.dev</div>
          </div>
        </button>

        {/* Employee Quick Login */}
        <button
          type="button"
          onClick={() => handleQuickLogin('employee@bussync.dev')}
          className="flex items-start gap-2.5 p-3 rounded-xl bg-white hover:bg-amber-50/70 border border-amber-200 text-left transition-all active:scale-[0.98] shadow-sm group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              Employee: Amit (Zenith)
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded">OTP 123456</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">employee@bussync.dev</div>
          </div>
        </button>

        {/* Admin Quick Login */}
        <button
          type="button"
          onClick={() => handleQuickLogin('admin@bussync.dev')}
          className="flex items-start gap-2.5 p-3 rounded-xl bg-white hover:bg-amber-50/70 border border-amber-200 text-left transition-all active:scale-[0.98] shadow-sm group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              Admin: Fleet Ops
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded">Full Access</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">admin@bussync.dev</div>
          </div>
        </button>
      </div>
    </div>
  );
};
