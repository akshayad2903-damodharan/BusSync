// ==============================================================================
// BusSync: adminService
// Management of Fleet Buses, Drivers, Routes, Stops, Admin Force-End,
// and Roster CSV file parsing with validation.
// ==============================================================================

import { Bus, Driver, Route, Stop, RosterEntry, Trip, BusStatus } from '../types';
import { mockEngine } from './mockEngine';

export interface RosterCSVRow {
  email: string;
  name: string;
  role: 'student' | 'employee';
  route_code?: string;
  stop_name?: string;
}

export interface CSVParseResult {
  validRows: RosterCSVRow[];
  errors: string[];
  totalParsed: number;
}

export const adminService = {
  // Parse and validate Roster CSV content
  parseRosterCSV(csvText: string): CSVParseResult {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const errors: string[] = [];
    const validRows: RosterCSVRow[] = [];

    if (lines.length < 2) {
      return { validRows: [], errors: ['CSV file is empty or missing headers.'], totalParsed: 0 };
    }

    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const emailIdx = headers.indexOf('email');
    const nameIdx = headers.indexOf('name');
    const roleIdx = headers.indexOf('role');
    const routeIdx = headers.indexOf('route_code');
    const stopIdx = headers.indexOf('stop_name');

    if (emailIdx === -1 || nameIdx === -1) {
      return {
        validRows: [],
        errors: ['CSV must contain at least "email" and "name" columns.'],
        totalParsed: 0
      };
    }

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length <= Math.max(emailIdx, nameIdx)) continue;

      const email = parts[emailIdx];
      const name = parts[nameIdx];
      const rawRole = roleIdx !== -1 ? parts[roleIdx]?.toLowerCase() : 'student';
      const role: 'student' | 'employee' = rawRole === 'employee' ? 'employee' : 'student';
      const route_code = routeIdx !== -1 ? parts[routeIdx] : undefined;
      const stop_name = stopIdx !== -1 ? parts[stopIdx] : undefined;

      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        errors.push(`Line ${i + 1}: Invalid email address "${email}".`);
        continue;
      }

      if (!name) {
        errors.push(`Line ${i + 1}: Name is required.`);
        continue;
      }

      validRows.push({
        email,
        name,
        role,
        route_code,
        stop_name
      });
    }

    return {
      validRows,
      errors,
      totalParsed: lines.length - 1
    };
  },

  // Batch import validated roster rows into institution directory
  async importRoster(institutionId: string, rows: RosterCSVRow[]): Promise<number> {
    let importedCount = 0;
    for (const row of rows) {
      const existing = mockEngine.roster.find(
        (r) => r.institution_id === institutionId && r.email.toLowerCase() === row.email.toLowerCase()
      );

      if (existing) {
        // Update existing roster entry
        existing.name = row.name;
        existing.role = row.role;
        existing.route_code = row.route_code;
        existing.stop_name = row.stop_name;
      } else {
        // Insert new entry
        mockEngine.roster.push({
          id: 'roster-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          institution_id: institutionId,
          email: row.email,
          name: row.name,
          role: row.role,
          route_code: row.route_code,
          stop_name: row.stop_name,
          created_at: new Date().toISOString()
        });
      }
      importedCount++;
    }

    mockEngine.notify();
    return importedCount;
  },

  // Force-end active trip by Admin
  async forceEndTrip(tripId: string): Promise<Trip> {
    return mockEngine.endTrip(tripId);
  },

  // BUS CRUD
  async addBus(institutionId: string, busNumber: string, routeId: string | null): Promise<Bus> {
    const existing = mockEngine.buses.find(
      (b) => b.institution_id === institutionId && b.bus_number.toLowerCase() === busNumber.toLowerCase()
    );
    if (existing) throw new Error(`Bus ${busNumber} already exists in this institution.`);

    const newBus: Bus = {
      id: 'bus-' + Date.now(),
      institution_id: institutionId,
      bus_number: busNumber,
      route_id: routeId,
      status: 'normal',
      created_at: new Date().toISOString()
    };
    mockEngine.buses.push(newBus);
    mockEngine.notify();
    return newBus;
  },

  async deleteBus(busId: string): Promise<void> {
    mockEngine.buses = mockEngine.buses.filter((b) => b.id !== busId);
    mockEngine.notify();
  },

  // DRIVER CRUD & PIN RESET
  async addDriver(institutionId: string, name: string, phone: string, initialPin: string): Promise<Driver> {
    const newDriver: Driver = {
      id: 'driver-' + Date.now(),
      institution_id: institutionId,
      name,
      phone,
      pin_hash: initialPin,
      failed_pin_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString()
    };
    mockEngine.drivers.push(newDriver);
    mockEngine.notify();
    return newDriver;
  },

  async resetDriverPin(driverId: string, newPin: string): Promise<void> {
    const driver = mockEngine.drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error('Driver not found');

    driver.pin_hash = newPin;
    driver.failed_pin_attempts = 0;
    driver.locked_until = null;
    mockEngine.notify();
  },

  async deleteDriver(driverId: string): Promise<void> {
    mockEngine.drivers = mockEngine.drivers.filter((d) => d.id !== driverId);
    mockEngine.notify();
  },

  // ROUTE & STOP CRUD
  async addRoute(institutionId: string, name: string, code: string, color: string = '#f59e0b'): Promise<Route> {
    const newRoute: Route = {
      id: 'route-' + Date.now(),
      institution_id: institutionId,
      name,
      code,
      color,
      created_at: new Date().toISOString()
    };
    mockEngine.routes.push(newRoute);
    mockEngine.notify();
    return newRoute;
  },

  async addStop(
    routeId: string,
    name: string,
    order: number,
    lat: number,
    lng: number,
    etaOffsetMinutes: number = 0
  ): Promise<Stop> {
    const newStop: Stop = {
      id: 'stop-' + Date.now(),
      route_id: routeId,
      name,
      stop_order: order,
      lat,
      lng,
      eta_offset_minutes: etaOffsetMinutes,
      created_at: new Date().toISOString()
    };
    mockEngine.stops.push(newStop);
    mockEngine.notify();
    return newStop;
  }
};
