import { describe, it, expect, beforeEach } from 'vitest';
import { nearbyService } from '../nearbyService';
import { mockEngine } from '../mockEngine';

describe('Feature 7: nearbyService & Public Institution Visibility', () => {
  const apexPublicId = '11111111-1111-1111-1111-111111111111'; // public_to_area
  const zenithPrivateId = '22222222-2222-2222-2222-222222222222'; // private

  beforeEach(() => {
    mockEngine.trips = [];
  });

  it('exposes public_to_area institution buses with strictly masked driver data', async () => {
    // Apex (public) driver starts trip
    const apexBus = mockEngine.buses.find((b) => b.institution_id === apexPublicId)!;
    const apexDriver = mockEngine.drivers.find((d) => d.institution_id === apexPublicId)!;
    mockEngine.startTrip(apexBus.id, apexDriver.id, apexPublicId);

    // Zenith (private) user queries nearby buses
    const nearby = await nearbyService.getNearbyInstitutionsBuses(
      zenithPrivateId,
      12.9352,
      77.6245,
      25
    );

    expect(nearby.length).toBe(1);
    const bus = nearby[0];
    expect(bus.bus_number).toBe(apexBus.bus_number);
    expect(bus.is_nearby).toBe(true);
    expect(bus.institution_name).toContain('Apex');

    // CRITICAL SECURITY ASSERTION: Driver personal identity MUST be masked
    expect(bus.driver_name).toBeUndefined();
    expect(bus.driver_phone).toBeUndefined();
    expect(bus.driver_id).toBeUndefined();
  });

  it('strictly hides private institution buses from nearby external queries', async () => {
    // Zenith (private) starts trip
    const zenithBus = mockEngine.buses.find((b) => b.institution_id === zenithPrivateId)!;
    const zenithDriver = mockEngine.drivers.find((d) => d.institution_id === zenithPrivateId)!;
    mockEngine.startTrip(zenithBus.id, zenithDriver.id, zenithPrivateId);

    // Apex student queries nearby buses
    const nearby = await nearbyService.getNearbyInstitutionsBuses(
      apexPublicId,
      12.9352,
      77.6245,
      25
    );

    // Since Zenith is private, its bus must NEVER appear!
    expect(nearby.length).toBe(0);
  });
});

