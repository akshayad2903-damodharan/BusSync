// ==============================================================================
// BusSync: AdminDashboard
// Responsive web dashboard for fleet operations, live bus status overview,
// trip force-end, roster CSV upload, and bus/driver CRUD management.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Bus as BusIcon,
  Users,
  Shield,
  UploadCloud,
  Plus,
  PowerOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  KeyRound,
  Trash2,
  Bell,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Bus, Driver, Route, Trip, UserProfile } from '../types';
import { mockEngine } from '../services/mockEngine';
import { adminService } from '../services/adminService';
import { pushService } from '../services/pushService';
import { StatusBadge } from './StatusBadge';
import { RosterUploadModal } from './RosterUploadModal';

interface AdminDashboardProps {
  user: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const institutionId = user.institution_id;
  const institution = mockEngine.institutions.find((i) => i.id === institutionId);

  const [activeTab, setActiveTab] = useState<'fleet' | 'roster' | 'drivers' | 'routes'>('fleet');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showRosterModal, setShowRosterModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Forms state
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newBusRouteId, setNewBusRouteId] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverPin, setNewDriverPin] = useState('1234');

  const refreshData = () => {
    setBuses(mockEngine.buses.filter((b) => b.institution_id === institutionId));
    setDrivers(mockEngine.drivers.filter((d) => d.institution_id === institutionId));
    setRoutes(mockEngine.routes.filter((r) => r.institution_id === institutionId));
    setTrips(mockEngine.trips.filter((t) => t.institution_id === institutionId));
  };

  useEffect(() => {
    refreshData();
    const unsub = mockEngine.subscribe(() => refreshData());
    return () => unsub();
  }, [institutionId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Force End Trip
  const handleForceEndTrip = async (tripId: string) => {
    try {
      await adminService.forceEndTrip(tripId);
      showToast('Trip force-ended by Administrator. Bus returned to idle pool.');
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to force end trip');
    }
  };

  // Add Bus
  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusNumber.trim()) return;
    try {
      await adminService.addBus(institutionId, newBusNumber.trim(), newBusRouteId || null);
      setNewBusNumber('');
      showToast('New bus added to fleet.');
      refreshData();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Add Driver
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim() || !newDriverPhone.trim()) return;
    try {
      await adminService.addDriver(institutionId, newDriverName.trim(), newDriverPhone.trim(), newDriverPin);
      setNewDriverName('');
      setNewDriverPhone('');
      showToast('Driver registered with personal PIN.');
      refreshData();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Trigger test route push notification
  const handleTriggerTestPush = async () => {
    const route = routes[0];
    if (!route) return;
    await pushService.sendRouteNotification({
      route_id: route.id,
      title: 'BusSync Route Notification',
      body: `Test broadcast for ${route.name}: Live GPS monitoring operational.`,
      data: { route_id: route.id }
    });
    showToast(`Test push notification dispatched for ${route.name}.`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-float border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
            <Shield className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold font-heading text-slate-900">
                Fleet Operations Admin
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {institution?.code}
              </span>
            </div>
            <p className="text-xs text-slate-500">{institution?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleTriggerTestPush}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            Test Push
          </button>

          <button
            type="button"
            onClick={() => setShowRosterModal(true)}
            className="btn-amber px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Roster CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'fleet'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BusIcon className="w-4 h-4" />
          Live Fleet ({buses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'drivers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Drivers ({drivers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Roster Directory ({mockEngine.roster.filter((r) => r.institution_id === institutionId).length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE FLEET TABLE & MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-subtle overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                Institutional Bus Fleet &amp; Active Trip Control
              </h3>
              <span className="text-xs text-slate-500">
                Auto-refreshed via Realtime channel
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Bus Number</th>
                    <th className="p-3.5">Assigned Route</th>
                    <th className="p-3.5">Active Driver</th>
                    <th className="p-3.5">Live Status</th>
                    <th className="p-3.5">Live Telemetry</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {buses.map((bus) => {
                    const activeTrip = trips.find((t) => t.bus_id === bus.id && t.active);
                    const route = routes.find((r) => r.id === bus.route_id);
                    const driver = activeTrip ? drivers.find((d) => d.id === activeTrip.driver_id) : null;
                    const latestLoc = activeTrip ? mockEngine.getLatestLocation(activeTrip.id) : null;

                    return (
                      <tr key={bus.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-slate-900">
                          {bus.bus_number}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800">{route?.name || 'Unassigned'}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{route?.code}</span>
                        </td>
                        <td className="p-3.5">
                          {driver ? (
                            <div>
                              <span className="font-bold text-slate-900">{driver.name}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">{driver.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No Active Driver</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {activeTrip ? (
                            <StatusBadge status={bus.status} />
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold text-[11px]">
                              Idle
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">
                          {latestLoc ? (
                            <div>
                              <span>{latestLoc.speed} km/h • {latestLoc.heading}°</span>
                              <span className="block text-[10px] text-slate-400">
                                {latestLoc.lat.toFixed(4)}, {latestLoc.lng.toFixed(4)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {activeTrip ? (
                            <button
                              type="button"
                              onClick={() => handleForceEndTrip(activeTrip.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs inline-flex items-center gap-1 transition-all active:scale-95"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                              Force End
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => adminService.deleteBus(bus.id)}
                              aria-label={`Delete bus ${bus.bus_number}`}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete Bus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Bus Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-subtle">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Add New Bus to Fleet
            </h4>
            <form onSubmit={handleAddBus} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Bus Number (e.g. KA-01-APEX-105)"
                value={newBusNumber}
                onChange={(e) => setNewBusNumber(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <select
                value={newBusRouteId}
                onChange={(e) => setNewBusRouteId(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="">Select Route (Optional)</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn-amber px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Bus
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DRIVERS MANAGEMENT & PIN RESETS */}
      {/* ========================================================================= */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-subtle overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                Registered Fleet Drivers &amp; Personal PIN Security
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {drivers.map((driver) => (
                <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{driver.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{driver.phone}</div>
                    {driver.locked_until && new Date(driver.locked_until) > new Date() && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                        Account Locked (Failed PIN attempts)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const newPin = prompt(`Enter new 4-digit PIN for ${driver.name}:`, '1234');
                        if (newPin && newPin.length === 4) {
                          await adminService.resetDriverPin(driver.id, newPin);
                          showToast(`PIN reset to ${newPin} for ${driver.name}.`);
                          refreshData();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      Reset PIN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Driver Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-subtle">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Register New Driver
            </h4>
            <form onSubmit={handleAddDriver} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Driver Full Name"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <input
                type="tel"
                required
                placeholder="Phone (e.g. +91 9876543210)"
                value={newDriverPhone}
                onChange={(e) => setNewDriverPhone(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <input
                type="text"
                maxLength={4}
                required
                placeholder="4-digit PIN (1234)"
                value={newDriverPin}
                onChange={(e) => setNewDriverPin(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <button
                type="submit"
                className="btn-amber px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" /> Register Driver
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROSTER DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-subtle overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-sm text-slate-900">
              Institution Roster Directory
            </h3>
            <button
              type="button"
              onClick={() => setShowRosterModal(true)}
              className="btn-amber px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Upload CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Institution Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Assigned Stop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockEngine.roster
                  .filter((r) => r.institution_id === institutionId)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3.5 font-mono text-slate-600">{item.email}</td>
                      <td className="p-3.5 uppercase font-bold text-[10px] text-slate-700">{item.role}</td>
                      <td className="p-3.5 text-slate-500">{item.stop_name || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roster Upload Modal */}
      {showRosterModal && (
        <RosterUploadModal
          institutionId={institutionId}
          onSuccess={(count) => {
            showToast(`Imported ${count} roster members.`);
            refreshData();
          }}
          onClose={() => setShowRosterModal(false)}
        />
      )}
    </div>
  );
};

