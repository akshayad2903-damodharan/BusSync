import { describe, it, expect } from 'vitest';
import { etaService, calculateHaversineDistance } from '../etaService';
import { mockEngine } from '../mockEngine';
import { LocationPoint, Stop } from '../../types';

describe('Feature 6: etaService & Dynamic Stop Arrival Calculation', () => {
  const routeStops = mockEngine.stops.filter(
    (s) => s.route_id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ).sort((a, b) => a.stop_order - b.stop_order);

  const stop1 = routeStops[0]; // Central Metro (order 1)
  const stop2 = routeStops[1]; // Koramangala 5th Block (order 2)
  const stop4 = routeStops[3]; // Bellandur Gate (order 4)

  it('calculates Haversine distance accurately between two coordinates', () => {
    // Distance between Stop 1 and Stop 2
    const dist = calculateHaversineDistance(stop1.lat, stop1.lng, stop2.lat, stop2.lng);
    expect(dist).toBeGreaterThan(4);
    expect(dist).toBeLessThan(6);
  });

  it('calculates dynamic ETA and remaining stops when bus is approaching target stop', () => {
    // Bus is at stop 1, moving at 30 km/h towards stop 4
    const busLocation: LocationPoint = {
      trip_id: 'test-trip',
      lat: stop1.lat,
      lng: stop1.lng,
      speed: 30,
      heading: 120,
      recorded_at: new Date().toISOString()
    };

    const eta = etaService.calculateETA(busLocation, stop4, routeStops);

    expect(eta.isApproaching).toBe(true);
    expect(eta.hasPassed).toBe(false);
    expect(eta.stopsRemaining).toBe(3); // from order 1 to 4 is 3 stops away
    expect(eta.distanceKm).toBeGreaterThan(5);
    expect(eta.minutes).toBeGreaterThan(0);
    expect(eta.etaFormatted).toContain('Arrives in');
  });

  it('detects when bus has already departed the target stop', () => {
    // Bus is at stop 4 (order 4), target stop is stop 2 (order 2)
    const busLocation: LocationPoint = {
      trip_id: 'test-trip',
      lat: stop4.lat,
      lng: stop4.lng,
      speed: 25,
      heading: 90,
      recorded_at: new Date().toISOString()
    };

    const eta = etaService.calculateETA(busLocation, stop2, routeStops);

    expect(eta.hasPassed).toBe(true);
    expect(eta.isApproaching).toBe(false);
    expect(eta.etaFormatted).toContain('departed');
  });

  it('triggers 5-minute proximity flag when ETA is within 5 minutes', () => {
    // Bus is very close to stop 2, moving at 25 km/h
    const busLocation: LocationPoint = {
      trip_id: 'test-trip',
      lat: stop2.lat - 0.01,
      lng: stop2.lng - 0.01,
      speed: 25,
      heading: 45,
      recorded_at: new Date().toISOString()
    };

    const eta = etaService.calculateETA(busLocation, stop2, routeStops);
    expect(eta.minutes).toBeLessThanOrEqual(5);
  });
});

