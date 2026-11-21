// ==============================================================================
// BusSync: StatusBadge Component
// Accessible status badges ensuring status is never conveyed by color alone,
// with strict WCAG AA contrast (dark text on amber ALWAYS).
// ==============================================================================

import React from 'react';
import { BusStatus } from '../types';
import { CheckCircle, Users, AlertTriangle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: BusStatus;
  isStale?: boolean;
  staleSeconds?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isStale = false,
  staleSeconds = 0,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold'
  }[size];

  // If marker is stale (>60s silence), show stale grey badge
  if (isStale) {
    const mins = Math.max(1, Math.floor(staleSeconds / 60));
    return (
      <span
        role="status"
        aria-label={`Bus connection stale, last updated ${mins} minutes ago`}
        className={`inline-flex items-center rounded-xl font-semibold bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}
      >
        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Last updated {mins}m ago</span>
      </span>
    );
  }

  // Normal Running
  if (status === 'normal') {
    return (
      <span
        role="status"
        aria-label="Bus status: Running normally"
        className={`inline-flex items-center rounded-xl font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 ${sizeClasses}`}
      >
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Running</span>
      </span>
    );
  }

  // Bus Full (Crucial: Dark text on amber, NEVER white on amber!)
  if (status === 'full') {
    return (
      <span
        role="status"
        aria-label="Bus status: Bus Full"
        className={`inline-flex items-center rounded-xl font-bold bg-amber-400 text-slate-950 border border-amber-500 shadow-sm ${sizeClasses}`}
      >
        <Users className="w-3.5 h-3.5 text-slate-950 shrink-0" />
        <span>Bus Full</span>
      </span>
    );
  }

  // Breakdown Red
  if (status === 'breakdown') {
    return (
      <span
        role="status"
        aria-label="Bus status: Breakdown"
        className={`inline-flex items-center rounded-xl font-bold bg-red-100 text-red-900 border border-red-300 ${sizeClasses}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
        <span>Breakdown</span>
      </span>
    );
  }

  return null;
};

