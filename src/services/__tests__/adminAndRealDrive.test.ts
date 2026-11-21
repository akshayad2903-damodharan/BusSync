import { describe, it, expect, beforeEach } from 'vitest';
import { adminService } from '../adminService';
import { tripService } from '../tripService';
import { statusService } from '../statusService';
import { etaService } from '../etaService';
import { pushService } from '../pushService';
import { mockEngine } from '../mockEngine';

describe('Feature 8: Admin Dashboard, CSV Roster & Real-Drive Test', () => {
  const apexId = '11111111-1111-1111-1111-111111111111';
  const driver = mockEngine.drivers[0];
  const bus = mockEngine.buses[0];

  beforeEach(() => {
    mockEngine.trips = [];
    bus.status = 'normal';
  });

  // 1. CSV Roster Parsing & Validation
  it('parses valid CSV and detects syntax/email validation errors', () => {
    const csvContent = `email,name,role,route_code,stop_name
valid.student@apex.edu,Valid Student,student,R-101,Bellandur Gate
bad-email,Invalid Person,student,R-101,HSR Sector 2
valid.emp@apex.edu,Valid Employee,employee,R-101,Central Metro`;

    const parseResult = adminService.parseRosterCSV(csvContent);
    expect(parseResult.validRows.length).toBe(2);
    expect(parseResult.errors.length).toBe(1);
    expect(parseResult.errors[0]).toContain('bad-email');
  });

  it('batch imports validated CSV entries into institution roster', async () => {
    const rows = [
      {
        email: 'batch.test1@apex.edu',
        name: 'Batch Test One',
        role: 'student' as const,
        route_code: 'R-101',
        stop_name: 'Bellandur Gate'
      }
    ];

    const imported = await adminService.importRoster(apexId, rows);
    expect(imported).toBe(1);

    const check = mockEngine.verifyRosterEmail(apexId, 'batch.test1@apex.edu');
    expect(check.allowed).toBe(true);
    expect(check.entry?.name).toBe('Batch Test One');
  });

  // 2. Bus & Driver Management
  it('adds a new bus and resets driver PIN', async () => {
    const newBus = await adminService.addBus(apexId, 'KA-01-TEST-999', null);
    expect(newBus.bus_number).toBe('KA-01-TEST-999');

    // Admin resets driver's PIN
    await adminService.resetDriverPin(driver.id, '9999');
    expect(driver.pin_hash).toBe('9999');

    // Revert driver PIN for other tests
    await adminService.resetDriverPin(driver.id, '1234');
  });

  // 3. Full Real-Drive End-to-End Flow
  it('executes full real-drive lifecycle: start trip -> live movement -> breakdown alert -> admin force-end', async () => {
    // Step 1: Driver starts trip on bus
    const trip = await tripService.startTrip(bus.id, driver.id, apexId);
    expect(trip.active).toBe(true);

    // Step 2: Student inspects active fleet
    let studentFleet = mockEngine.getActiveBuses(apexId);
    expect(studentFleet.length).toBe(1);
    expect(studentFleet[0].bus_number).toBe(bus.bus_number);

    // Step 3: ETA calculation to student's stop
    const studentStop = mockEngine.stops[3]; // Bellandur Gate
    const routeStops = mockEngine.getStopsForRoute(bus.route_id!);
    const initialLoc = studentFleet[0].latest_location!;
    const eta = etaService.calculateETA(initialLoc, studentStop, routeStops);
    expect(eta.minutes).toBeGreaterThan(0);
    expect(eta.isApproaching).toBe(true);

    // Step 4: Driver reports breakdown
    let pushDispatched = false;
    const unsub = pushService.onPushNotification(() => {
      pushDispatched = true;
    });

    await statusService.setBusStatus(bus.id, 'breakdown');
    expect(bus.status).toBe('breakdown');

    // Send push notification to route
    await pushService.sendRouteNotification({
      route_id: bus.route_id!,
      title: 'Bus Breakdown Alert',
      body: `Bus ${bus.bus_number} has reported breakdown.`
    });
    expect(pushDispatched).toBe(true);
    unsub();

    // Step 5: Admin observes fleet breakdown and force-ends the trip
    const adminTrip = mockEngine.trips.find((t) => t.id === trip.id);
    expect(adminTrip?.active).toBe(true);

    await adminService.forceEndTrip(trip.id);
    expect(adminTrip?.active).toBe(false);

    // Step 6: Bus vanishes immediately from student live map
    studentFleet = mockEngine.getActiveBuses(apexId);
    expect(studentFleet.length).toBe(0);
  });
});

