import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tripService } from '../tripService';
import { locationService } from '../locationService';
import { mockEngine } from '../mockEngine';

describe('Feature 3: tripService & Location Buffering', () => {
  const apexId = '11111111-1111-1111-1111-111111111111';
  const driver1 = mockEngine.drivers[0]; // Ravi Kumar
  const driver2 = mockEngine.drivers[1]; // Suresh Patil
  const bus1 = mockEngine.buses[0]; // KA-01-APEX-101
  const bus2 = mockEngine.buses[1]; // KA-01-APEX-102

  beforeEach(() => {
    // Reset mock trips
    mockEngine.trips = [];
    locationService.setNetworkStatus(true);
    localStorage.clear();
  });

  afterEach(() => {
    locationService.stopTracking();
  });

  it('lists institution buses and shows whether they have active trips', async () => {
    const list = await tripService.getInstitutionBuses(apexId);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0].hasActiveTrip).toBe(false);
  });

  it('allows a driver to start a trip and records initial location', async () => {
    const trip = await tripService.startTrip(bus1.id, driver1.id, apexId);
    expect(trip).toBeDefined();
    expect(trip.active).toBe(true);
    expect(trip.bus_id).toBe(bus1.id);
    expect(trip.driver_id).toBe(driver1.id);

    // Verify latest location exists
    const latestLoc = locationService.getLatestLocation(trip.id);
    expect(latestLoc).toBeDefined();
    expect(latestLoc?.trip_id).toBe(trip.id);
  });

  it('strictly prevents two drivers from starting trips on the same bus', async () => {
    // Driver 1 starts trip on bus 1
    await tripService.startTrip(bus1.id, driver1.id, apexId);

    // Driver 2 attempts to start trip on bus 1 -> Must throw error!
    await expect(tripService.startTrip(bus1.id, driver2.id, apexId)).rejects.toThrow(
      'already has an active trip in progress'
    );
  });

  it('ends a trip and frees the bus for another driver', async () => {
    const trip = await tripService.startTrip(bus1.id, driver1.id, apexId);
    expect(trip.active).toBe(true);

    const endedTrip = await tripService.endTrip(trip.id);
    expect(endedTrip.active).toBe(false);
    expect(endedTrip.ended_at).toBeDefined();

    // Now driver 2 can start trip on bus 1
    const newTrip = await tripService.startTrip(bus1.id, driver2.id, apexId);
    expect(newTrip.active).toBe(true);
    expect(newTrip.driver_id).toBe(driver2.id);
  });

  it('buffers location points offline when in cellular dead zone and flushes when restored', async () => {
    const trip = await tripService.startTrip(bus2.id, driver1.id, apexId);

    // Enter dead zone
    locationService.setNetworkStatus(false);
    expect(locationService.getNetworkStatus()).toBe(false);

    // Send 3 GPS points in dead zone
    await locationService.sendLocation({
      trip_id: trip.id,
      lat: 12.9352,
      lng: 77.6245,
      speed: 30,
      heading: 90,
      recorded_at: new Date().toISOString()
    });

    await locationService.sendLocation({
      trip_id: trip.id,
      lat: 12.9358,
      lng: 77.6250,
      speed: 32,
      heading: 90,
      recorded_at: new Date().toISOString()
    });

    expect(locationService.getBufferedCount()).toBe(2);

    // Signal restored
    locationService.setNetworkStatus(true);
    expect(locationService.getBufferedCount()).toBe(0);
  });

  it('auto-ends trips that have received no updates for over 2 hours', async () => {
    const trip = await tripService.startTrip(bus1.id, driver1.id, apexId);

    // Set trip started_at to 3 hours ago
    trip.started_at = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    // Update location recorded_at to 3 hours ago
    const loc = mockEngine.getLatestLocation(trip.id);
    if (loc) {
      loc.recorded_at = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    }

    const endedCount = await tripService.autoEndStaleTrips();
    expect(endedCount).toBe(1);

    const checkTrip = mockEngine.trips.find((t) => t.id === trip.id);
    expect(checkTrip?.active).toBe(false);
  });
});

