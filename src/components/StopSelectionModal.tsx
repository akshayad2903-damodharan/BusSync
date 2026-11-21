// ==============================================================================
// BusSync: StopSelectionModal
// Student onboarding and stop selection drawer with ordered routes and stops.
// ==============================================================================

import React, { useState } from 'react';
import { MapPin, Check, X, Route as RouteIcon, ChevronRight } from 'lucide-react';
import { Route, Stop } from '../types';

interface StopSelectionModalProps {
  routes: Route[];
  stops: Stop[];
  selectedRouteId: string | null;
  selectedStopId: string | null;
  onSelect: (routeId: string, stopId: string) => void;
  onClose: () => void;
}

export const StopSelectionModal: React.FC<StopSelectionModalProps> = ({
  routes,
  stops,
  selectedRouteId,
  selectedStopId,
  onSelect,
  onClose
}) => {
  const [currentRouteId, setCurrentRouteId] = useState<string>(
    selectedRouteId || routes[0]?.id || ''
  );
  const [currentStopId, setCurrentStopId] = useState<string>(selectedStopId || '');

  const routeStops = stops
    .filter((s) => s.route_id === currentRouteId)
    .sort((a, b) => a.stop_order - b.stop_order);

  const handleSave = () => {
    if (currentRouteId && currentStopId) {
      onSelect(currentRouteId, currentStopId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-float border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">Select Your Daily Stop</h3>
              <p className="text-[11px] text-slate-400">Campus Route &amp; Stop Onboarding</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close stop selector"
            className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1. Select Route */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <RouteIcon className="w-3.5 h-3.5 text-amber-600" />
              Transit Route
            </label>
            <div className="grid grid-cols-1 gap-2">
              {routes.map((route) => {
                const isSelected = currentRouteId === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      setCurrentRouteId(route.id);
                      const firstStop = stops.find((s) => s.route_id === route.id);
                      if (firstStop) setCurrentStopId(firstStop.id);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{route.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{route.code}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select Ordered Stop */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Boarding / Drop-off Stop
            </label>
            <div className="space-y-2">
              {routeStops.map((stop) => {
                const isSelected = currentStopId === stop.id;
                return (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => setCurrentStopId(stop.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {stop.stop_order}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{stop.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Stop #{stop.stop_order} • Approx +{stop.eta_offset_minutes} min from start
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!currentStopId}
            className="w-full btn-amber py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-40"
          >
            Confirm My Stop
          </button>
        </div>
      </div>
    </div>
  );
};

