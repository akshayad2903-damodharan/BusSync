// ==============================================================================
// BusSync: statusService
// Manages bus statuses (Normal, Full, Breakdown), stale marker evaluation,
// and broadcasts instant route alert notifications to affected students.
// ==============================================================================

import { BusStatus } from '../types';
import { mockEngine } from './mockEngine';

export interface RouteAlert {
  id: string;
  bus_id: string;
  bus_number: string;
  route_id: string;
  route_name: string;
  status: BusStatus;
  title: string;
  message: string;
  timestamp: string;
}

type AlertListener = (alert: RouteAlert) => void;

class StatusService {
  private alertListeners: Set<AlertListener> = new Set();
  private recentAlerts: RouteAlert[] = [];

  constructor() {
    this.loadAlerts();
  }

  private loadAlerts() {
    try {
      const saved = localStorage.getItem('bussync_route_alerts');
      if (saved) this.recentAlerts = JSON.parse(saved);
    } catch {
      // Ignore
    }
  }

  private saveAlerts() {
    try {
      localStorage.setItem('bussync_route_alerts', JSON.stringify(this.recentAlerts.slice(-20)));
    } catch {
      // Ignore
    }
  }

  // Update bus status (Normal, Full, Breakdown)
  public async setBusStatus(busId: string, status: BusStatus): Promise<void> {
    const bus = mockEngine.buses.find((b) => b.id === busId);
    if (!bus) throw new Error('Bus not found');

    bus.status = status;
    mockEngine.updateBusStatus(busId, status);

    // If status is Breakdown or Full, broadcast route alert
    if (status === 'breakdown' || status === 'full') {
      const route = mockEngine.routes.find((r) => r.id === bus.route_id);
      const title =
        status === 'breakdown'
          ? `⚠️ Bus Breakdown: ${bus.bus_number}`
          : `👥 Bus at Capacity: ${bus.bus_number}`;

      const message =
        status === 'breakdown'
          ? `Bus ${bus.bus_number} on ${route?.name || 'your route'} has reported a breakdown. Maintenance has been alerted.`
          : `Bus ${bus.bus_number} on ${route?.name || 'your route'} is currently FULL. Passengers at subsequent stops may experience delays.`;

      const alert: RouteAlert = {
        id: 'alert-' + Date.now(),
        bus_id: busId,
        bus_number: bus.bus_number,
        route_id: bus.route_id || '',
        route_name: route?.name || 'Transit Route',
        status,
        title,
        message,
        timestamp: new Date().toISOString()
      };

      this.recentAlerts.unshift(alert);
      this.saveAlerts();
      this.alertListeners.forEach((fn) => fn(alert));
    }
  }

  // Subscribe to route alerts
  public onRouteAlert(listener: AlertListener): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  public getRecentAlertsForRoute(routeId: string): RouteAlert[] {
    return this.recentAlerts.filter((a) => a.route_id === routeId);
  }

  public clearAlert(alertId: string) {
    this.recentAlerts = this.recentAlerts.filter((a) => a.id !== alertId);
    this.saveAlerts();
  }

  // Evaluate whether a bus is stale (> 60 seconds without GPS update)
  public evaluateStale(lastUpdatedSeconds: number): { isStale: boolean; label: string } {
    if (lastUpdatedSeconds > 60) {
      const mins = Math.floor(lastUpdatedSeconds / 60);
      return {
        isStale: true,
        label: `Last updated ${mins} min ago`
      };
    }
    return {
      isStale: false,
      label: `Updated ${lastUpdatedSeconds}s ago`
    };
  }
}

export const statusService = new StatusService();

