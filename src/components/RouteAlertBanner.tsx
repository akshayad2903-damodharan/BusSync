// ==============================================================================
// BusSync: RouteAlertBanner
// High-visibility, accessible banner alerting students and employees to route disruptions
// (Breakdowns, Full buses) with real-time dismissible toasts.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Users, X, Bell } from 'lucide-react';
import { statusService, RouteAlert } from '../services/statusService';

interface RouteAlertBannerProps {
  routeId?: string;
}

export const RouteAlertBanner: React.FC<RouteAlertBannerProps> = ({ routeId }) => {
  const [alerts, setAlerts] = useState<RouteAlert[]>([]);

  useEffect(() => {
    // Load initial alerts
    if (routeId) {
      setAlerts(statusService.getRecentAlertsForRoute(routeId));
    }

    // Subscribe to new real-time alerts
    const unsubscribe = statusService.onRouteAlert((newAlert) => {
      if (!routeId || newAlert.route_id === routeId) {
        setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      }
    });

    return () => unsubscribe();
  }, [routeId]);

  const dismissAlert = (id: string) => {
    statusService.clearAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-2 w-full animate-in slide-in-from-top-2 duration-200">
      {alerts.slice(0, 2).map((alert) => {
        const isBreakdown = alert.status === 'breakdown';
        return (
          <div
            key={alert.id}
            role="alert"
            aria-live="assertive"
            className={`p-4 rounded-2xl border shadow-float flex items-start justify-between gap-3 ${
              isBreakdown
                ? 'bg-red-500 text-white border-red-600'
                : 'bg-amber-400 text-slate-950 border-amber-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isBreakdown ? 'bg-red-700 text-white' : 'bg-slate-950 text-amber-400'
                }`}
              >
                {isBreakdown ? <AlertTriangle className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-extrabold font-heading leading-tight flex items-center gap-2">
                  <span>{alert.title}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                    isBreakdown ? 'bg-red-700/80 text-white' : 'bg-slate-950 text-amber-400'
                  }`}>
                    {alert.route_name}
                  </span>
                </div>
                <p className={`text-xs mt-1 leading-relaxed font-medium ${
                  isBreakdown ? 'text-red-100' : 'text-slate-900'
                }`}>
                  {alert.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissAlert(alert.id)}
              aria-label="Dismiss alert"
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isBreakdown
                  ? 'hover:bg-red-600 text-red-200 hover:text-white'
                  : 'hover:bg-amber-500 text-slate-800 hover:text-slate-950'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
