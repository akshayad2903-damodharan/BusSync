import React, { useState, useEffect } from 'react';
import {
  Bus as BusIcon,
  Play,
  Square,
  AlertTriangle,
  Users,
  CheckCircle,
  Wifi,
  WifiOff,
  Navigation,
  Compass,
  Gauge,
  BatteryCharging,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Bus, Driver, Trip, LocationPoint, BusStatus } from '../types';
import { tripService, BusWithActiveStatus } from '../services/tripService';
import { locationService } from '../services/locationService';
import { mockEngine } from '../services/mockEngine';
import { BatteryOptimizationModal } from './BatteryOptimizationModal';

interface DriverTripScreenProps {
  driver: Driver;
  institutionId: string;
}

export const DriverTripScreen: React.FC<DriverTripScreenProps> = ({ driver, institutionId }) => {
  const [buses, setBuses] = useState<BusWithActiveStatus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(locationService.getNetworkStatus());
  const [bufferedCount, setBufferedCount] = useState<number>(locationService.getBufferedCount());
  const [showBatteryGuide, setShowBatteryGuide] = useState<boolean>(false);
  const [confirmEndModal, setConfirmEndModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load available buses and active trip
  const refreshData = async () => {
    try {
      const busList = await tripService.getInstitutionBuses(institutionId);
      setBuses(busList);

      const driverTrip = await tripService.getActiveTripForDriver(driver.id);
      setActiveTrip(driverTrip);

      if (driverTrip) {
        setSelectedBusId(driverTrip.bus_id);
        const latestLoc = locationService.getLatestLocation(driverTrip.id);
        if (latestLoc) setCurrentLocation(latestLoc);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load fleet data');
    }
  };

  useEffect(() => {
    refreshData();

    // Subscribe to mock engine updates
    const unsubscribeMock = mockEngine.subscribe(() => {
      refreshData();
    });

    // Subscribe to network & buffer events
    const unsubNet = locationService.onNetworkChange((online) => setIsOnline(online));
    const unsubBuf = locationService.onBufferChange((count) => setBufferedCount(count));

    return () => {
      unsubscribeMock();
      unsubNet();
      unsubBuf();
      locationService.stopTracking();
    };
  }, [driver.id, institutionId]);

  // Start GPS tracking when active trip exists
  useEffect(() => {
    if (activeTrip) {
      locationService.startTracking(activeTrip.id, (point) => {
        setCurrentLocation(point);
      });
    } else {
      locationService.stopTracking();
    }
  }, [activeTrip?.id]);

  // Handle Start Trip
  const handleStartTrip = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedBusId) {
      setErrorMessage("Please select a bus for today's trip.");
      return;
    }

    try {
      const newTrip = await tripService.startTrip(selectedBusId, driver.id, institutionId);
      setActiveTrip(newTrip);
      setSuccessMessage('Trip started successfully! Background tracking active.');
      refreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not start trip');
    }
  };

  // Handle End Trip
  const handleEndTrip = async () => {
    if (!activeTrip) return;
    setErrorMessage(null);

    try {
      await tripService.endTrip(activeTrip.id);
      setActiveTrip(null);
      setConfirmEndModal(false);
      setSuccessMessage('Trip completed. Bus status reset to normal.');
      refreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not end trip');
    }
  };

  // Handle Status Update (Normal / Full / Breakdown)
  const handleUpdateStatus = (newStatus: BusStatus) => {
    if (!activeTrip) return;
    mockEngine.updateBusStatus(activeTrip.bus_id, newStatus);
    setSuccessMessage(`Bus status updated to: ${newStatus.toUpperCase()}`);
    refreshData();
  };

  // Toggle Network Simulation (Online <-> Offline Dead Zone)
  const toggleNetworkSimulation = () => {
    const nextStatus = !isOnline;
    locationService.setNetworkStatus(nextStatus);
  };

  const activeBus = buses.find((b) => b.id === (activeTrip?.bus_id || selectedBusId));
  const activeRoute = mockEngine.routes.find((r) => r.id === activeBus?.route_id);

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6 space-y-5">
      {/* Driver Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-float border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Driver On Duty</span>
          </div>
          <h2 className="text-xl font-extrabold font-heading text-white">{driver.name}</h2>
          <p className="text-xs text-slate-400 font-mono">{driver.phone}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowBatteryGuide(true)}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex flex-col items-center gap-1 transition-all active:scale-95"
          title="Battery Settings Guide"
        >
          <BatteryCharging className="w-5 h-5" />
          <span className="text-[10px] font-bold">Lock Setup</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: NO ACTIVE TRIP -> CHOOSE BUS & START */}
      {/* ========================================================================= */}
      {!activeTrip ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-float p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold font-heading text-slate-900">
              Pick Today's Assigned Bus
            </h3>
            <p className="text-xs text-slate-500">
              Select an available bus with no ongoing trip to begin tracking.
            </p>
          </div>

          <div className="space-y-2.5">
            {buses.map((bus) => {
              const route = mockEngine.routes.find((r) => r.id === bus.route_id);
              const isSelected = selectedBusId === bus.id;
              const isOccupied = bus.hasActiveTrip;

              return (
                <button
                  key={bus.id}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => setSelectedBusId(bus.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isOccupied
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : isOccupied
                          ? 'bg-slate-200 text-slate-500'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <BusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {bus.bus_number}
                        {isOccupied && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            Active Trip In Progress
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {route ? route.name : 'Unassigned Route'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                        isOccupied
                          ? 'text-slate-400 bg-slate-100'
                          : isSelected
                          ? 'btn-amber'
                          : 'text-slate-600 bg-slate-100'
                      }`}
                    >
                      {isOccupied ? 'In Use' : isSelected ? 'Selected' : 'Select'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleStartTrip}
            disabled={!selectedBusId}
            className="w-full btn-amber py-4 rounded-2xl text-base font-extrabold flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Today's Trip
          </button>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW B: ACTIVE TRIP SCREEN */
        /* ========================================================================= */
        <div className="space-y-5">
          {/* Persistent Foreground Service Notification Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-float border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                  Foreground Service Active
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'Online' : 'Dead Zone'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xl font-extrabold font-heading text-white">
                {activeBus?.bus_number}
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {activeRoute?.name || 'Institutional Transit Route'}
              </p>
            </div>

            {/* Status Selector Badges */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-2">Driver Status Control:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('normal')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeBus?.status === 'normal'
                      ? 'bg-emerald-500 text-slate-950 font-extrabold ring-2 ring-emerald-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Normal
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('full')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeBus?.status === 'full'
                      ? 'bg-amber-400 text-slate-950 font-extrabold ring-2 ring-amber-300 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Bus Full
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('breakdown')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeBus?.status === 'breakdown'
                      ? 'bg-red-500 text-white font-extrabold ring-2 ring-red-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Breakdown
                </button>
              </div>
            </div>
          </div>

          {/* GPS Telemetry & Health Indicator */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-float p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading">
                GPS Telemetry (~5s Ticks)
              </h4>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Live Feed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-500" />
                  Current Speed
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {currentLocation?.speed || 0} <span className="text-xs font-medium text-slate-500">km/h</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  GPS Heading
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {currentLocation?.heading || 0}°
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl col-span-2">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                  Coordinates
                </div>
                <div className="text-xs font-mono font-bold text-slate-800">
                  Lat: {currentLocation?.lat.toFixed(6) || '—'}, Lng: {currentLocation?.lng.toFixed(6) || '—'}
                </div>
              </div>
            </div>

            {/* Offline Buffering Dead Zone Simulator Controls */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Offline Buffer Queue
                </div>
                <div className="text-[11px] text-slate-500">
                  {bufferedCount > 0 ? (
                    <span className="text-amber-700 font-semibold">{bufferedCount} points queued in dead zone</span>
                  ) : (
                    <span className="text-emerald-700">All points synchronized</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={toggleNetworkSimulation}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isOnline
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                {isOnline ? 'Simulate Dead Zone' : 'Restore Signal'}
              </button>
            </div>
          </div>

          {/* Big End Trip Action */}
          <button
            type="button"
            onClick={() => setConfirmEndModal(true)}
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white text-base font-extrabold flex items-center justify-center gap-2.5 shadow-md transition-all"
          >
            <Square className="w-5 h-5 fill-current" />
            End Trip
          </button>
        </div>
      )}

      {/* Confirmation Modal to End Trip */}
      {confirmEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-float border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
              <Square className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold font-heading text-slate-900">End this trip?</h4>
              <p className="text-xs text-slate-600">
                The bus will immediately disappear from the student live map and tracking will stop.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEndModal(false)}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndTrip}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Yes, End Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battery Optimization Guide Modal */}
      {showBatteryGuide && (
        <BatteryOptimizationModal onClose={() => setShowBatteryGuide(false)} />
      )}
    </div>
  );
};

