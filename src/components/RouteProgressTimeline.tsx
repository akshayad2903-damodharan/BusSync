// ==============================================================================
// BusSync: RouteProgressTimeline
// Interactive route timeline showing ordered stops, live bus position beacon,
// and user's destination stop.
// ==============================================================================

import React from 'react';
import { Stop, LocationPoint } from '../types';
import { calculateHaversineDistance } from '../services/etaService';
import { CheckCircle2, MapPin, Bus, Circle } from 'lucide-react';

interface RouteProgressTimelineProps {
  stops: Stop[];
  busLocation: LocationPoint | null;
  selectedStopId?: string | null;
}

export const RouteProgressTimeline: React.FC<RouteProgressTimelineProps> = ({
  stops,
  busLocation,
  selectedStopId
}) => {
  const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);

  // Determine closest stop to the bus
  let closestIndex = 0;
  if (busLocation) {
    let minDistance = Infinity;
    for (let i = 0; i < sortedStops.length; i++) {
      const d = calculateHaversineDistance(
        busLocation.lat,
        busLocation.lng,
        sortedStops[i].lat,
        sortedStops[i].lng
      );
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Route Stops ({sortedStops.length})
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {sortedStops.map((stop, idx) => {
          const isSelected = selectedStopId === stop.id;
          const isPassed = idx < closestIndex;
          const isCurrentSegment = idx === closestIndex;

          return (
            <div key={stop.id} className="relative flex items-start gap-3 text-xs">
              {/* Timeline Marker Pin */}
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border-2 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-white ring-2 ring-amber-400'
                    : isCurrentSegment
                    ? 'bg-blue-600 text-white border-white ring-2 ring-blue-300'
                    : isPassed
                    ? 'bg-emerald-500 text-white border-white'
                    : 'bg-white text-slate-500 border-slate-300'
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                ) : isCurrentSegment ? (
                  <Bus className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  stop.stop_order
                )}
              </div>

              {/* Stop Information */}
              <div
                className={`flex-1 p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                    : isCurrentSegment
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'bg-slate-50/50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold ${
                      isSelected ? 'text-amber-950' : 'text-slate-800'
                    }`}
                  >
                    {stop.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      My Stop
                    </span>
                  )}
                  {isCurrentSegment && !isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Bus Here
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 mt-0.5">
                  Stop #{stop.stop_order} • Approx +{stop.eta_offset_minutes} min
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

