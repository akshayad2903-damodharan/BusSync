// ==============================================================================
// BusSync: tripService
// Clean service layer for starting/ending trips, bus assignment, and auto-end rules
// ==============================================================================

import { Bus, Trip } from '../types';
import { mockEngine } from './mockEngine';

const isMock = import.meta.env.VITE_USE_MOCKS === 'true';

export interface BusWithActiveStatus extends Bus {
  hasActiveTrip: boolean;
  activeTripId?: string;
}

export const tripService = {
  // Get all institution buses annotated with active trip status
  async getInstitutionBuses(institutionId: string): Promise<BusWithActiveStatus[]> {
    if (isMock) {
      const buses = mockEngine.buses.filter((b) => b.institution_id === institutionId);
      return buses.map((b) => {
        const activeTrip = mockEngine.trips.find((t) => t.bus_id === b.id && t.active);
        return {
          ...b,
          hasActiveTrip: !!activeTrip,
          activeTripId: activeTrip?.id
        };
      });
    }

    throw new Error('Live Supabase trip service not yet configured.');
  },

  // Start trip on a bus (strictly validates no concurrent active trip on the same bus)
  async startTrip(busId: string, driverId: string, institutionId: string): Promise<Trip> {
    if (isMock) {
      return mockEngine.startTrip(busId, driverId, institutionId);
    }

    throw new Error('Live Supabase trip service not yet configured.');
  },

  // End an active trip
  async endTrip(tripId: string): Promise<Trip> {
    if (isMock) {
      return mockEngine.endTrip(tripId);
    }

    throw new Error('Live Supabase trip service not yet configured.');
  },

  // Check if a driver currently has an active trip
  async getActiveTripForDriver(driverId: string): Promise<Trip | null> {
    if (isMock) {
      return mockEngine.getActiveTripForDriver(driverId);
    }

    return null;
  },

  // Check if a bus currently has an active trip
  async getActiveTripForBus(busId: string): Promise<Trip | null> {
    if (isMock) {
      return mockEngine.getActiveTripForBus(busId);
    }

    return null;
  },

  // Auto-end trips that have received no location updates for 2 hours
  async autoEndStaleTrips(): Promise<number> {
    if (isMock) {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      let endedCount = 0;

      for (const trip of mockEngine.trips) {
        if (!trip.active) continue;

        const latestLoc = mockEngine.getLatestLocation(trip.id);
        const lastPing = latestLoc ? new Date(latestLoc.recorded_at).getTime() : new Date(trip.started_at).getTime();

        if (lastPing < twoHoursAgo) {
          mockEngine.endTrip(trip.id);
          endedCount++;
        }
      }

      return endedCount;
    }

    return 0;
  },

  // Force-end trip by admin
  async forceEndTrip(tripId: string): Promise<Trip> {
    return this.endTrip(tripId);
  }
};

