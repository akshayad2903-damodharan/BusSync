// ==============================================================================
// BusSync: BusMarkerIcon
// Custom top-down bus SVG marker with heading rotation, smooth glide transition,
// brand amber styling, and status indicators.
// ==============================================================================

import L from 'leaflet';
import { BusStatus } from '../types';

export function createBusIcon({
  busNumber,
  heading,
  status,
  isNearby = false,
  isStale = false,
  isSelected = false
}: {
  busNumber: string;
  heading: number;
  status: BusStatus;
  isNearby?: boolean;
  isStale?: boolean;
  isSelected?: boolean;
}): L.DivIcon {
  // Status colors
  let statusColor = '#16a34a'; // normal running green
  let statusRingColor = 'rgba(22, 163, 74, 0.4)';
  if (status === 'full') {
    statusColor = '#f59e0b';
    statusRingColor = 'rgba(245, 158, 11, 0.4)';
  } else if (status === 'breakdown') {
    statusColor = '#ef4444';
    statusRingColor = 'rgba(239, 68, 68, 0.5)';
  }

  // Brand / Institution theme
  let bodyFill = '#f59e0b'; // School-bus amber
  let bodyAccent = '#0f172a'; // Deep navy
  let badgeBg = '#0f172a';
  let badgeText = '#f59e0b';

  if (isNearby) {
    bodyFill = '#6366f1'; // Indigo for other institutions
    badgeBg = '#312e81';
    badgeText = '#e0e7ff';
  }

  if (isStale) {
    bodyFill = '#64748b'; // Muted stale slate
    statusColor = '#94a3b8';
    statusRingColor = 'transparent';
  }

  const ringAnimation = !isStale && status !== 'breakdown' ? 'animate-ping' : '';

  const html = `
    <div class="relative flex flex-col items-center justify-center cursor-pointer group" style="width: 56px; height: 56px;">
      <!-- Bus Number Badge -->
      <div class="absolute -top-4 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight shadow-sm whitespace-nowrap transition-transform duration-200 group-hover:scale-110"
           style="background-color: ${badgeBg}; color: ${badgeText}; border: 1px solid rgba(255,255,255,0.2); z-index: 20;">
        ${busNumber}
      </div>

      <!-- Rotating Top-Down Bus SVG Container -->
      <div class="bus-marker-icon flex items-center justify-center relative" 
           style="transform: rotate(${heading}deg); transition: transform 1s cubic-bezier(0.25, 1, 0.5, 1); width: 44px; height: 44px;">
        
        <!-- Pulse Status Ring -->
        <div class="absolute w-10 h-10 rounded-full" 
             style="background-color: ${statusRingColor}; transform: scale(1.15);"></div>

        <!-- Selection Highlight Ring -->
        ${isSelected ? `<div class="absolute w-12 h-12 rounded-full border-2 border-amber-400 animate-pulse"></div>` : ''}

        <!-- Top-Down Bus SVG Vector -->
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
          <!-- Shadow -->
          <ellipse cx="24" cy="24" rx="14" ry="20" fill="rgba(15,23,42,0.25)"/>

          <!-- Bus Body (Chassis) -->
          <rect x="12" y="5" width="24" height="38" rx="7" fill="${bodyFill}" stroke="${bodyAccent}" stroke-width="2"/>

          <!-- Front Windshield (Facing Up at 0 deg) -->
          <path d="M15 11C15 9.34315 16.3431 8 18 8H30C31.6569 8 33 9.34315 33 11V15H15V11Z" fill="#1e293b" stroke="${bodyAccent}" stroke-width="1"/>

          <!-- Front Headlights -->
          <circle cx="16" cy="7" r="1.5" fill="#fef08a"/>
          <circle cx="32" cy="7" r="1.5" fill="#fef08a"/>

          <!-- Side Mirrors -->
          <rect x="9.5" y="11" width="2.5" height="4" rx="1" fill="${bodyAccent}"/>
          <rect x="36" y="11" width="2.5" height="4" rx="1" fill="${bodyAccent}"/>

          <!-- Roof Air Conditioner / Escape Hatch -->
          <rect x="18" y="19" width="12" height="10" rx="2" fill="#ffffff" fill-opacity="0.35" stroke="${bodyAccent}" stroke-width="1"/>

          <!-- Rear Window -->
          <rect x="16" y="37" width="16" height="3" rx="1" fill="#1e293b"/>

          <!-- Rear Tail Lights -->
          <circle cx="15" cy="41" r="1.5" fill="#ef4444"/>
          <circle cx="33" cy="41" r="1.5" fill="#ef4444"/>

          <!-- Status Indicator Dot on Roof -->
          <circle cx="24" cy="24" r="3.5" fill="${statusColor}" stroke="#ffffff" stroke-width="1.5"/>
        </svg>
      </div>

      <!-- Stale Indicator Label (if > 60s silence) -->
      ${isStale ? `
        <div class="absolute -bottom-4 px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-200 font-medium whitespace-nowrap shadow-sm border border-slate-700">
          Stale (&gt;60s)
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'bus-leaflet-marker',
    iconSize: [56, 56],
    iconAnchor: [28, 28]
  });
}

export function createStopIcon(stopOrder: number, isSelected: boolean = false): L.DivIcon {
  const html = `
    <div class="flex items-center justify-center ${isSelected ? 'scale-125' : 'hover:scale-110'} transition-transform">
      <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shadow-sm border-2 ${
        isSelected
          ? 'bg-amber-500 text-slate-950 border-white ring-2 ring-amber-400'
          : 'bg-white text-slate-800 border-slate-700'
      }">
        ${stopOrder}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'stop-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}
