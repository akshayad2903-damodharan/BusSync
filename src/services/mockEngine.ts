// ==============================================================================
// BusSync: MockEngine
// Zero-dependency in-memory simulated database with realistic GPS interpolation,
// real-time subscriber channels, rate-limited PIN verification, and offline queues.
// ==============================================================================

import {
  Institution,
  Route,
  Stop,
  Bus,
  Driver,
  Trip,
  LocationPoint,
  UserProfile,
  RosterEntry,
  BusStatus,
  ActiveBusTrackingData
} from '../types';
import {
  INITIAL_INSTITUTIONS,
  INITIAL_ROUTES,
  INITIAL_STOPS,
  INITIAL_BUSES,
  INITIAL_DRIVERS,
  INITIAL_ROSTER,
  DEV_USERS
} from './mockData';

type Listener = () => void;

class MockEngine {
  public institutions: Institution[] = [...INITIAL_INSTITUTIONS];
  public routes: Route[] = [...INITIAL_ROUTES];
  public stops: Stop[] = [...INITIAL_STOPS];
  public buses: Bus[] = [...INITIAL_BUSES];
  public drivers: Driver[] = [...INITIAL_DRIVERS];
  public roster: RosterEntry[] = [...INITIAL_ROSTER];
  public trips: Trip[] = [];
  public locations: LocationPoint[] = [];

  public currentUser: UserProfile | null = null;
  public currentDriver: Driver | null = null;

  private listeners: Set<Listener> = new Set();
  private simulationIntervals: Map<string, number> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem('bussync_mock_trips', JSON.stringify(this.trips));
      localStorage.setItem('bussync_mock_buses', JSON.stringify(this.buses));
      localStorage.setItem('bussync_mock_locations', JSON.stringify(this.locations.slice(-100)));
      if (this.currentUser) {
        localStorage.setItem('bussync_mock_current_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('bussync_mock_current_user');
      }
      if (this.currentDriver) {
        localStorage.setItem('bussync_mock_current_driver', JSON.stringify(this.currentDriver));
      } else {
        localStorage.removeItem('bussync_mock_current_driver');
      }
    } catch {
      // Storage unavailable or disabled
    }
  }

  private loadFromStorage() {
    try {
      const storedTrips = localStorage.getItem('bussync_mock_trips');
      if (storedTrips) this.trips = JSON.parse(storedTrips);

      const storedBuses = localStorage.getItem('bussync_mock_buses');
      if (storedBuses) this.buses = JSON.parse(storedBuses);

      const storedLocs = localStorage.getItem('bussync_mock_locations');
      if (storedLocs) this.locations = JSON.parse(storedLocs);

      const storedUser = localStorage.getItem('bussync_mock_current_user');
      if (storedUser) this.currentUser = JSON.parse(storedUser);

      const storedDriver = localStorage.getItem('bussync_mock_current_driver');
      if (storedDriver) this.currentDriver = JSON.parse(storedDriver);
    } catch {
      // Ignore
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify() {
    this.saveToStorage();
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('MockEngine subscriber error:', err);
      }
    });
  }

  // ----------------------------------------------------------------------------
  // AUTH METHODS
  // ----------------------------------------------------------------------------
  public verifyRosterEmail(institutionId: string, email: string): { allowed: boolean; entry?: RosterEntry } {
    const cleanEmail = email.trim().toLowerCase();
    const entry = this.roster.find(
      (r) => r.institution_id === institutionId && r.email.toLowerCase() === cleanEmail
    );
    return {
      allowed: !!entry,
      entry
    };
  }

  public verifyDriverPin(
    institutionId: string,
    driverId: string,
    enteredPin: string
  ): { success: boolean; driver?: Driver; message?: string; remainingAttempts?: number; locked?: boolean } {
    const driver = this.drivers.find((d) => d.id === driverId && d.institution_id === institutionId);
    if (!driver) {
      return { success: false, message: 'Driver not found' };
    }

    const now = Date.now();
    if (driver.locked_until && new Date(driver.locked_until).getTime() > now) {
      const waitMinutes = Math.ceil((new Date(driver.locked_until).getTime() - now) / 60000);
      return {
        success: false,
        locked: true,
        message: `Account is locked due to too many failed attempts. Try again in ${waitMinutes} minute(s).`
      };
    }

    if (driver.pin_hash === enteredPin) {
      // Success
      driver.failed_pin_attempts = 0;
      driver.locked_until = null;
      this.currentDriver = driver;
      this.notify();
      return { success: true, driver };
    } else {
      // Failed
      driver.failed_pin_attempts = (driver.failed_pin_attempts || 0) + 1;
      if (driver.failed_pin_attempts >= 5) {
        driver.locked_until = new Date(now + 15 * 60 * 1000).toISOString();
        this.notify();
        return {
          success: false,
          locked: true,
          remainingAttempts: 0,
          message: 'Incorrect PIN. Maximum 5 attempts exceeded. Account locked for 15 minutes.'
        };
      } else {
        const remaining = 5 - driver.failed_pin_attempts;
        this.notify();
        return {
          success: false,
          locked: false,
          remainingAttempts: remaining,
          message: `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        };
      }
    }
  }

  public devQuickLogin(email: string): UserProfile {
    const user = DEV_USERS[email.toLowerCase()];
    if (!user) {
      throw new Error(`Dev account for ${email} not found.`);
    }

    this.currentUser = { ...user };
    if (user.role === 'driver') {
      const driver = this.drivers.find((d) => d.name.includes('Ravi Kumar')) || this.drivers[0];
      this.currentDriver = driver;
    } else {
      this.currentDriver = null;
    }
    this.notify();
    return this.currentUser;
  }

  public logout() {
    this.currentUser = null;
    this.currentDriver = null;
    this.notify();
  }

  // ----------------------------------------------------------------------------
  // TRIP MANAGEMENT
  // ----------------------------------------------------------------------------
  public startTrip(busId: string, driverId: string, institutionId: string): Trip {
    // Check if bus already has an active trip
    const existingActive = this.trips.find((t) => t.bus_id === busId && t.active);
    if (existingActive) {
      throw new Error('This bus already has an active trip in progress! Two drivers cannot drive the same bus.');
    }

    const bus = this.buses.find((b) => b.id === busId);
    if (!bus) {
      throw new Error('Bus not found');
    }

    const trip: Trip = {
      id: 'trip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      bus_id: busId,
      driver_id: driverId,
      institution_id: institutionId,
      started_at: new Date().toISOString(),
      active: true
    };

    bus.status = 'normal';
    this.trips.unshift(trip);

    // Initial location at first stop of route
    const routeStops = this.getStopsForRoute(bus.route_id || '');
    const firstStop = routeStops[0];
    const initialLat = firstStop ? firstStop.lat : 12.9716;
    const initialLng = firstStop ? firstStop.lng : 77.5946;

    this.recordLocation({
      trip_id: trip.id,
      lat: initialLat,
      lng: initialLng,
      speed: 0,
      heading: 90,
      recorded_at: new Date().toISOString()
    });

    // Start movement simulation for realistic demo
    this.startSimulationForTrip(trip);

    this.notify();
    return trip;
  }

  public endTrip(tripId: string): Trip {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) throw new Error('Trip not found');

    trip.active = false;
    trip.ended_at = new Date().toISOString();

    const bus = this.buses.find((b) => b.id === trip.bus_id);
    if (bus) {
      bus.status = 'normal';
    }

    this.stopSimulationForTrip(tripId);
    this.notify();
    return trip;
  }

  public getActiveTripForDriver(driverId: string): Trip | null {
    return this.trips.find((t) => t.driver_id === driverId && t.active) || null;
  }

  public getActiveTripForBus(busId: string): Trip | null {
    return this.trips.find((t) => t.bus_id === busId && t.active) || null;
  }

  // ----------------------------------------------------------------------------
  // LOCATIONS & SIMULATION
  // ----------------------------------------------------------------------------
  public recordLocation(point: LocationPoint) {
    this.locations.push(point);
    this.notify();
  }

  public batchUploadLocations(points: LocationPoint[]) {
    this.locations.push(...points);
    this.notify();
  }

  public getLatestLocation(tripId: string): LocationPoint | null {
    for (let i = this.locations.length - 1; i >= 0; i--) {
      if (this.locations[i].trip_id === tripId) {
        return this.locations[i];
      }
    }
    return null;
  }

  public updateBusStatus(busId: string, status: BusStatus) {
    const bus = this.buses.find((b) => b.id === busId);
    if (bus) {
      bus.status = status;
      this.notify();
    }
  }

  public getStopsForRoute(routeId: string): Stop[] {
    return this.stops
      .filter((s) => s.route_id === routeId)
      .sort((a, b) => a.stop_order - b.stop_order);
  }

  // ----------------------------------------------------------------------------
  // ACTIVE BUS FLEET AGGREGATION
  // ----------------------------------------------------------------------------
  public getActiveBuses(currentInstitutionId: string, includeNearbyPublic: boolean = false): ActiveBusTrackingData[] {
    const now = Date.now();
    const activeTrips = this.trips.filter((t) => t.active);
    const results: ActiveBusTrackingData[] = [];

    for (const trip of activeTrips) {
      const bus = this.buses.find((b) => b.id === trip.bus_id);
      if (!bus) continue;

      const isOwnInstitution = trip.institution_id === currentInstitutionId;
      const institution = this.institutions.find((i) => i.id === trip.institution_id);

      if (!isOwnInstitution) {
        if (!includeNearbyPublic || institution?.visibility !== 'public_to_area') {
          continue; // Hidden by RLS / privacy
        }
      }

      const route = this.routes.find((r) => r.id === bus.route_id);
      const driver = isOwnInstitution ? this.drivers.find((d) => d.id === trip.driver_id) : undefined;
      const latestLoc = this.getLatestLocation(trip.id);

      let lastUpdatedSeconds = 0;
      let isStale = false;
      if (latestLoc) {
        lastUpdatedSeconds = Math.max(0, Math.floor((now - new Date(latestLoc.recorded_at).getTime()) / 1000));
        isStale = lastUpdatedSeconds > 60;
      }

      results.push({
        bus_id: bus.id,
        bus_number: bus.bus_number,
        route_id: bus.route_id,
        route_name: route?.name || 'Unassigned Route',
        route_code: route?.code || 'N/A',
        route_color: route?.color || '#f59e0b',
        status: bus.status,
        trip_id: trip.id,
        driver_id: isOwnInstitution ? driver?.id : undefined,
        driver_name: isOwnInstitution ? driver?.name : undefined,
        driver_phone: isOwnInstitution ? driver?.phone : undefined,
        institution_id: trip.institution_id,
        institution_name: institution?.name || 'Unknown Institution',
        is_nearby: !isOwnInstitution,
        latest_location: latestLoc,
        last_updated_seconds_ago: lastUpdatedSeconds,
        is_stale: isStale
      });
    }

    return results;
  }

  // ----------------------------------------------------------------------------
  // SIMULATION ENGINE (Smooth 5s GPS ticks between stops)
  // ----------------------------------------------------------------------------
  private startSimulationForTrip(trip: Trip) {
    if (this.simulationIntervals.has(trip.id)) return;

    const bus = this.buses.find((b) => b.id === trip.bus_id);
    if (!bus || !bus.route_id) return;

    const routeStops = this.getStopsForRoute(bus.route_id);
    if (routeStops.length < 2) return;

    let currentStopIndex = 0;
    let progressRatio = 0.0; // 0.0 to 1.0 between currentStop and nextStop
    let forward = true;

    const intervalId = window.setInterval(() => {
      const currentActiveTrip = this.trips.find((t) => t.id === trip.id && t.active);
      if (!currentActiveTrip) {
        this.stopSimulationForTrip(trip.id);
        return;
      }

      const fromStop = routeStops[currentStopIndex];
      const nextStopIndex = forward ? currentStopIndex + 1 : currentStopIndex - 1;
      const toStop = routeStops[nextStopIndex];

      if (!toStop) {
        // Reached end, reverse direction
        forward = !forward;
        return;
      }

      progressRatio += 0.15; // Move ~15% every 5 seconds (smooth traversal)
      if (progressRatio >= 1.0) {
        progressRatio = 0.0;
        currentStopIndex = nextStopIndex;
        if (currentStopIndex === routeStops.length - 1) {
          forward = false;
        } else if (currentStopIndex === 0) {
          forward = true;
        }
      }

      // Linear interpolation between fromStop and toStop
      const curLat = fromStop.lat + (toStop.lat - fromStop.lat) * progressRatio;
      const curLng = fromStop.lng + (toStop.lng - fromStop.lng) * progressRatio;

      // Calculate heading angle
      const dLng = toStop.lng - fromStop.lng;
      const dLat = toStop.lat - fromStop.lat;
      let angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      // Realistic speed between 25 and 38 km/h
      const speed = Math.floor(25 + Math.random() * 13);

      this.recordLocation({
        trip_id: trip.id,
        lat: Number(curLat.toFixed(6)),
        lng: Number(curLng.toFixed(6)),
        speed,
        heading: Math.round(angle),
        recorded_at: new Date().toISOString()
      });
    }, 5000);

    this.simulationIntervals.set(trip.id, intervalId);
  }

  private stopSimulationForTrip(tripId: string) {
    const id = this.simulationIntervals.get(tripId);
    if (id) {
      clearInterval(id);
      this.simulationIntervals.delete(tripId);
    }
  }
}

export const mockEngine = new MockEngine();
