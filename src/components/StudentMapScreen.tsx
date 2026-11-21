// ==============================================================================
// BusSync: StudentMapScreen
// Mobile-first student live bus tracking dashboard with Leaflet map,
// floating bus cards, designed empty states, and quick driver simulation trigger.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Bus, Phone, Compass, AlertCircle, RefreshCw, Layers, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { ActiveBusTrackingData, UserProfile, Stop } from '../types';
import { mockEngine } from '../services/mockEngine';
import { etaService, ETAResult } from '../services/etaService';
import { LiveMap } from './LiveMap';
import { StatusBadge } from './StatusBadge';
import { RouteAlertBanner } from './RouteAlertBanner';
import { StopSelectionModal } from './StopSelectionModal';
import { RouteProgressTimeline } from './RouteProgressTimeline';

interface StudentMapScreenProps {
  user: UserProfile;
}

export const StudentMapScreen: React.FC<StudentMapScreenProps> = ({ user }) => {
  const [buses, setBuses] = useState<ActiveBusTrackingData[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [includeNearby, setIncludeNearby] = useState<boolean>(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(user.stop_id || null);
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  const institutionId = user.institution_id;
  const institution = mockEngine.institutions.find((i) => i.id === institutionId);
  const routes = mockEngine.routes.filter((r) => r.institution_id === institutionId);
  const stops = mockEngine.stops.filter((s) => routes.some((r) => r.id === s.route_id));

  // Default stop if not selected yet
  useEffect(() => {
    if (!selectedStopId && stops.length > 0) {
      setSelectedStopId(stops[0].id);
    }
  }, [stops, selectedStopId]);

  // Refresh active fleet buses
  const refreshFleet = () => {
    const active = mockEngine.getActiveBuses(institutionId, includeNearby);
    setBuses(active);

    if (active.length > 0 && !selectedBusId) {
      setSelectedBusId(active[0].bus_id);
    } else if (active.length === 0) {
      setSelectedBusId(null);
    }
  };

  useEffect(() => {
    refreshFleet();

    // Subscribe to mock engine updates
    const unsubscribe = mockEngine.subscribe(() => {
      refreshFleet();
    });

    // Also interval check for stale timer update every second
    const interval = setInterval(() => {
      refreshFleet();
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [institutionId, includeNearby]);

  // Selected bus detail
  const selectedBus = buses.find((b) => b.bus_id === selectedBusId) || buses[0] || null;
  const selectedStop = stops.find((s) => s.id === selectedStopId) || null;
  const busRouteStops = stops.filter((s) => s.route_id === selectedBus?.route_id);

  // Compute dynamic ETA to user's stop
  let etaResult: ETAResult | null = null;
  if (selectedBus?.latest_location && selectedStop && busRouteStops.length > 0) {
    etaResult = etaService.calculateETA(
      selectedBus.latest_location,
      selectedStop,
      busRouteStops
    );
  }

  // Helper for dev testing: launch a demo trip if none running
  const startDemoTrip = () => {
    const bus = mockEngine.buses.find((b) => b.institution_id === institutionId);
    const driver = mockEngine.drivers.find((d) => d.institution_id === institutionId);
    if (bus && driver) {
      mockEngine.startTrip(bus.id, driver.id, institutionId);
      refreshFleet();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col p-3 sm:p-6 gap-4">
      {/* Top Controls & Bus Chip Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm">
            <Bus className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold font-heading text-slate-900 leading-tight">
              Live Campus Map
            </h2>
            <p className="text-xs text-slate-500">
              {institution?.name} • {routes.length} Active Route(s)
            </p>
          </div>
        </div>

        {/* My Stop Selection Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowStopModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 transition-all active:scale-95 shadow-subtle"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>Stop: <strong className="text-slate-900">{selectedStop?.name || 'Choose My Stop'}</strong></span>
            <span className="text-[10px] text-amber-600 font-semibold underline">Change</span>
          </button>
        </div>

        {/* Running Buses Selector Chips */}
        {buses.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {buses.map((bus) => {
              const isSelected = selectedBus?.bus_id === bus.bus_id;
              return (
                <button
                  key={bus.bus_id}
                  type="button"
                  onClick={() => setSelectedBusId(bus.bus_id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'btn-amber shadow-sm ring-2 ring-amber-400/40'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      bus.status === 'breakdown'
                        ? 'bg-red-500'
                        : bus.status === 'full'
                        ? 'bg-amber-600'
                        : 'bg-emerald-500'
                    }`}
                  />
                  {bus.bus_number}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Route Disruption Alert Banner */}
      <RouteAlertBanner routeId={selectedBus?.route_id || user.route_id || undefined} />

      {/* Main Map + Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[500px]">
        {/* Left Column (2 Cols): Live Leaflet Map Canvas */}
        <div className="lg:col-span-2 relative h-full min-h-[420px] rounded-3xl overflow-hidden shadow-subtle border border-slate-200">
          <LiveMap
            buses={buses}
            selectedBusId={selectedBus?.bus_id || null}
            routes={routes}
            stops={stops}
            onSelectBus={(id) => setSelectedBusId(id)}
            selectedStopId={user.stop_id}
          />

          {/* Designed Empty State Overlay (if 0 buses active) */}
          {buses.length === 0 && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-6 text-center animate-in fade-in">
              <div className="max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-float border border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                  <Bus className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold font-heading text-slate-900">
                    No Buses Running Right Now
                  </h3>
                  <p className="text-xs text-slate-600">
                    Buses appear on the map automatically as soon as assigned drivers start their trips.
                  </p>
                </div>

                {import.meta.env.VITE_DEV_MODE === 'true' && (
                  <button
                    type="button"
                    onClick={startDemoTrip}
                    className="w-full btn-amber py-3 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Launch Simulated Driver Trip
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col) / Mobile Bottom Sheet: Selected Bus Details */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {selectedBus ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-float p-5 sm:p-6 space-y-5">
              {/* Bus Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {selectedBus.route_code}
                  </span>
                  <h3 className="text-2xl font-extrabold font-heading text-slate-900 mt-1">
                    {selectedBus.bus_number}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedBus.route_name}</p>
                </div>

                {/* Status Badge */}
                <div>
                  <StatusBadge
                    status={selectedBus.status}
                    isStale={selectedBus.is_stale}
                    staleSeconds={selectedBus.last_updated_seconds_ago}
                  />
                </div>
              </div>

              {/* Dynamic ETA to My Stop Banner */}
              {selectedStop && etaResult && (
                <div className={`p-4 rounded-2xl border shadow-subtle ${
                  etaResult.hasPassed
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : etaResult.minutes <= 5
                    ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        Estimated Arrival at {selectedStop.name}
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-heading tracking-tight mt-0.5">
                        {etaResult.etaFormatted}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-black/10">
                      {etaResult.distanceKm} km away
                    </span>
                  </div>

                  {!etaResult.hasPassed && (
                    <div className="text-xs font-medium opacity-90 mt-1 flex items-center gap-1.5">
                      <span>• {etaResult.stopsRemaining === 0 ? 'Approaching this stop now' : `${etaResult.stopsRemaining} stop(s) remaining`}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Driver Details & Tap-to-Call */}
              {selectedBus.driver_name && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                      Assigned Driver
                    </div>
                    <div className="text-sm font-bold text-slate-900">{selectedBus.driver_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{selectedBus.driver_phone}</div>
                  </div>

                  {selectedBus.driver_phone && (
                    <a
                      href={`tel:${selectedBus.driver_phone}`}
                      className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-sm transition-all active:scale-95"
                      title="Tap to Call Driver"
                      aria-label="Tap to Call Driver"
                    >
                      <Phone className="w-4 h-4 fill-current" />
                    </a>
                  )}
                </div>
              )}

              {/* Live Telemetry Info */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Speed</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {selectedBus.latest_location?.speed || 0} km/h
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Heading</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {selectedBus.latest_location?.heading || 0}°
                  </div>
                </div>
              </div>

              {/* Stale Ping Indicator */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Last Updated:
                </span>
                <span
                  className={`font-semibold ${
                    selectedBus.is_stale ? 'text-slate-500' : 'text-emerald-700'
                  }`}
                >
                  {selectedBus.is_stale
                    ? `Stale (${selectedBus.last_updated_seconds_ago}s ago)`
                    : `${selectedBus.last_updated_seconds_ago}s ago`}
                </span>
              </div>
              {/* Route Progress Timeline */}
              {busRouteStops.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <RouteProgressTimeline
                    stops={busRouteStops}
                    busLocation={selectedBus.latest_location}
                    selectedStopId={selectedStopId}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-slate-500 text-xs">
              Select an active bus to inspect driver details and ETA.
            </div>
          )}
        </div>
      </div>

      {/* Stop Selection Modal */}
      {showStopModal && (
        <StopSelectionModal
          routes={routes}
          stops={stops}
          selectedRouteId={selectedBus?.route_id || routes[0]?.id || null}
          selectedStopId={selectedStopId}
          onSelect={(routeId, stopId) => {
            setSelectedStopId(stopId);
          }}
          onClose={() => setShowStopModal(false)}
        />
      )}
    </div>
  );
};
