import { describe, it, expect, beforeEach } from 'vitest';
import { statusService, RouteAlert } from '../statusService';
import { mockEngine } from '../mockEngine';

describe('Feature 5: statusService & Disruption Alerts', () => {
  const bus = mockEngine.buses[0];

  beforeEach(() => {
    bus.status = 'normal';
    localStorage.clear();
  });

  it('updates bus status to breakdown and triggers alert broadcast', async () => {
    let receivedAlert: RouteAlert | undefined = undefined;
    const unsub = statusService.onRouteAlert((alert) => {
      receivedAlert = alert;
    });

    await statusService.setBusStatus(bus.id, 'breakdown');

    expect(bus.status).toBe('breakdown');
    expect(receivedAlert).toBeDefined();
    if (receivedAlert) {
      expect((receivedAlert as RouteAlert).status).toBe('breakdown');
      expect((receivedAlert as RouteAlert).title).toContain('Breakdown');
      expect((receivedAlert as RouteAlert).bus_id).toBe(bus.id);
    }

    unsub();
  });

  it('updates bus status to full and triggers capacity alert', async () => {
    let receivedAlert: RouteAlert | undefined = undefined;
    const unsub = statusService.onRouteAlert((alert) => {
      receivedAlert = alert;
    });

    await statusService.setBusStatus(bus.id, 'full');

    expect(bus.status).toBe('full');
    expect(receivedAlert).toBeDefined();
    if (receivedAlert) {
      expect((receivedAlert as RouteAlert).status).toBe('full');
      expect((receivedAlert as RouteAlert).title).toContain('Capacity');
    }

    unsub();
  });

  it('resets bus status back to normal without triggering disruption alert', async () => {
    let receivedAlert = false;
    const unsub = statusService.onRouteAlert(() => {
      receivedAlert = true;
    });

    await statusService.setBusStatus(bus.id, 'normal');

    expect(bus.status).toBe('normal');
    expect(receivedAlert).toBe(false);

    unsub();
  });

  it('correctly evaluates stale marker timing after 60 seconds of silence', () => {
    // 30 seconds -> Fresh
    const fresh = statusService.evaluateStale(30);
    expect(fresh.isStale).toBe(false);
    expect(fresh.label).toBe('Updated 30s ago');

    // 75 seconds -> Stale
    const stale75 = statusService.evaluateStale(75);
    expect(stale75.isStale).toBe(true);
    expect(stale75.label).toBe('Last updated 1 min ago');

    // 180 seconds -> Stale (3 min)
    const stale180 = statusService.evaluateStale(180);
    expect(stale180.isStale).toBe(true);
    expect(stale180.label).toBe('Last updated 3 min ago');
  });
});
