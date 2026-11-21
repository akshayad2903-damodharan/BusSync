import { describe, it, expect, beforeEach } from 'vitest';
import { mockEngine } from '../mockEngine';
import { createBusIcon, createStopIcon } from '../../components/BusMarkerIcon';

describe('Feature 4: Live Map & Rotating Bus Marker', () => {
  const apexId = '11111111-1111-1111-1111-111111111111';
  const driver = mockEngine.drivers[0];
  const bus = mockEngine.buses[0];

  beforeEach(() => {
    mockEngine.trips = [];
  });

  it('initially returns empty active fleet when no trips are running', () => {
    const active = mockEngine.getActiveBuses(apexId);
    expect(active.length).toBe(0);
  });

  it('bus appears in active fleet only during active trip and has live telemetry', () => {
    // Start trip
    const trip = mockEngine.startTrip(bus.id, driver.id, apexId);

    const active = mockEngine.getActiveBuses(apexId);
    expect(active.length).toBe(1);
    expect(active[0].bus_number).toBe(bus.bus_number);
    expect(active[0].driver_name).toBe(driver.name);
    expect(active[0].driver_phone).toBe(driver.phone);
    expect(active[0].latest_location).toBeDefined();
    expect(active[0].latest_location?.trip_id).toBe(trip.id);
  });

  it('bus disappears from active fleet immediately when trip ends', () => {
    const trip = mockEngine.startTrip(bus.id, driver.id, apexId);
    expect(mockEngine.getActiveBuses(apexId).length).toBe(1);

    mockEngine.endTrip(trip.id);
    expect(mockEngine.getActiveBuses(apexId).length).toBe(0);
  });

  it('creates custom SVG divIcon with heading rotation and status styles', () => {
    const icon = createBusIcon({
      busNumber: 'KA-01-APEX-101',
      heading: 180,
      status: 'normal',
      isSelected: true
    });

    expect(icon).toBeDefined();
    expect(icon.options.html).toContain('rotate(180deg)');
    expect(icon.options.html).toContain('KA-01-APEX-101');
    expect(icon.options.html).toContain('border-amber-400'); // Selected highlight
  });

  it('creates stop icon with correct order number', () => {
    const stopIcon = createStopIcon(3, true);
    expect(stopIcon).toBeDefined();
    expect(stopIcon.options.html).toContain('3');
    expect(stopIcon.options.html).toContain('bg-amber-500');
  });
});

