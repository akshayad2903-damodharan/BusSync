import React from 'react';
import { BatteryCharging, ShieldAlert, CheckCircle, Smartphone, X, ExternalLink } from 'lucide-react';

interface BatteryOptimizationModalProps {
  onClose: () => void;
}

export const BatteryOptimizationModal: React.FC<BatteryOptimizationModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-float border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">Background GPS Tracking Setup</h3>
              <p className="text-[11px] text-slate-400">Battery &amp; Lock Screen Guide</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup guide"
            className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Crucial for Live Tracking:</strong> Android and iOS aggressively kill background GPS apps when the phone is locked. Follow these steps so students can track your bus while your phone is locked or mounted.
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div className="text-xs text-slate-700">
                <strong className="block text-slate-900 mb-0.5">Set Battery to "Unrestricted"</strong>
                Go to <em>Android Settings → Apps → BusSync → Battery</em> and choose <strong>Unrestricted</strong> (or disable "Battery Optimization").
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="text-xs text-slate-700">
                <strong className="block text-slate-900 mb-0.5">Location Access "Allow all the time"</strong>
                In <em>App Permissions → Location</em>, select <strong>Allow all the time</strong> so location pings continue when the screen turns off.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="text-xs text-slate-700">
                <strong className="block text-slate-900 mb-0.5">Keep "Trip in progress" Notification Active</strong>
                The persistent foreground notification keeps the tracking engine running and prevents the OS from hibernating the driver app.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full btn-amber py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.99] mt-2"
          >
            I Have Configured My Device
          </button>
        </div>
      </div>
    </div>
  );
};
