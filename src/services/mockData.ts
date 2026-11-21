// ==============================================================================
// BusSync: Initial Mock Database Seed Data
// Exactly mirrors Supabase seed.sql and seed_dev.sql
// ==============================================================================

import { Institution, Route, Stop, Bus, Driver, RosterEntry, UserProfile } from '../types';

export const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Apex Institute of Technology',
    code: 'APEX',
    visibility: 'public_to_area',
    created_at: new Date().toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Zenith Corporate Campus',
    code: 'ZENITH',
    visibility: 'private',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    institution_id: '11111111-1111-1111-1111-111111111111',
    name: 'Route 101 - North Campus Shuttle',
    code: 'R-101',
    color: '#f59e0b',
    created_at: new Date().toISOString()
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    institution_id: '22222222-2222-2222-2222-222222222222',
    name: 'Route 202 - Tech Corridor Express',
    code: 'R-202',
    color: '#3b82f6',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_STOPS: Stop[] = [
  // Route 101 (Apex Institute)
  {
    id: 'a1111111-0000-0000-0000-000000000001',
    route_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Central Metro Interchange',
    stop_order: 1,
    lat: 12.9716,
    lng: 77.5946,
    eta_offset_minutes: 0
  },
  {
    id: 'a1111111-0000-0000-0000-000000000002',
    route_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Koramangala 5th Block',
    stop_order: 2,
    lat: 12.9352,
    lng: 77.6245,
    eta_offset_minutes: 12
  },
  {
    id: 'a1111111-0000-0000-0000-000000000003',
    route_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'HSR Sector 2 Circle',
    stop_order: 3,
    lat: 12.9116,
    lng: 77.6389,
    eta_offset_minutes: 22
  },
  {
    id: 'a1111111-0000-0000-0000-000000000004',
    route_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Bellandur Gate',
    stop_order: 4,
    lat: 12.9260,
    lng: 77.6762,
    eta_offset_minutes: 35
  },
  {
    id: 'a1111111-0000-0000-0000-000000000005',
    route_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Apex Campus North Gate',
    stop_order: 5,
    lat: 12.9350,
    lng: 77.6920,
    eta_offset_minutes: 45
  },

  // Route 202 (Zenith Corporate)
  {
    id: 'b2222222-0000-0000-0000-000000000001',
    route_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Indiranagar 100ft Junction',
    stop_order: 1,
    lat: 12.9784,
    lng: 77.6408,
    eta_offset_minutes: 0
  },
  {
    id: 'b2222222-0000-0000-0000-000000000002',
    route_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Domlur Flyover',
    stop_order: 2,
    lat: 12.9609,
    lng: 77.6387,
    eta_offset_minutes: 10
  },
  {
    id: 'b2222222-0000-0000-0000-000000000003',
    route_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Embassy GolfLinks',
    stop_order: 3,
    lat: 12.9515,
    lng: 77.6510,
    eta_offset_minutes: 20
  },
  {
    id: 'b2222222-0000-0000-0000-000000000004',
    route_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Zenith Tech Tower Gate 1',
    stop_order: 4,
    lat: 12.9430,
    lng: 77.6650,
    eta_offset_minutes: 30
  }
];

export const INITIAL_BUSES: Bus[] = [
  {
    id: 'b0000001-0000-0000-0000-000000000001',
    institution_id: '11111111-1111-1111-1111-111111111111',
    bus_number: 'KA-01-APEX-101',
    route_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'normal'
  },
  {
    id: 'b0000001-0000-0000-0000-000000000002',
    institution_id: '11111111-1111-1111-1111-111111111111',
    bus_number: 'KA-01-APEX-102',
    route_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'normal'
  },
  {
    id: 'b0000002-0000-0000-0000-000000000001',
    institution_id: '22222222-2222-2222-2222-222222222222',
    bus_number: 'KA-03-ZNTH-201',
    route_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    status: 'normal'
  },
  {
    id: 'b0000002-0000-0000-0000-000000000002',
    institution_id: '22222222-2222-2222-2222-222222222222',
    bus_number: 'KA-03-ZNTH-202',
    route_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    status: 'normal'
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd1111111-0000-0000-0000-000000000001',
    institution_id: '11111111-1111-1111-1111-111111111111',
    name: 'Ravi Kumar',
    phone: '+91 9876543210',
    pin_hash: '1234', // In mock mode plain PIN or hash is accepted
    failed_pin_attempts: 0,
    locked_until: null
  },
  {
    id: 'd1111111-0000-0000-0000-000000000002',
    institution_id: '11111111-1111-1111-1111-111111111111',
    name: 'Suresh Patil',
    phone: '+91 9876543211',
    pin_hash: '5678',
    failed_pin_attempts: 0,
    locked_until: null
  },
  {
    id: 'd2222222-0000-0000-0000-000000000001',
    institution_id: '22222222-2222-2222-2222-222222222222',
    name: 'Anand Verma',
    phone: '+91 9876543212',
    pin_hash: '4321',
    failed_pin_attempts: 0,
    locked_until: null
  },
  {
    id: 'd2222222-0000-0000-0000-000000000002',
    institution_id: '22222222-2222-2222-2222-222222222222',
    name: 'Manoj Singh',
    phone: '+91 9876543213',
    pin_hash: '8765',
    failed_pin_attempts: 0,
    locked_until: null
  }
];

export const INITIAL_ROSTER: RosterEntry[] = [
  // Apex Roster
  {
    id: 'r1',
    institution_id: '11111111-1111-1111-1111-111111111111',
    email: 'student@bussync.dev',
    name: 'Rohan Sharma (Dev Student)',
    role: 'student',
    route_code: 'R-101',
    stop_name: 'Bellandur Gate'
  },
  {
    id: 'r2',
    institution_id: '11111111-1111-1111-1111-111111111111',
    email: 'student@apex.edu',
    name: 'Aakash Rao',
    role: 'student',
    route_code: 'R-101',
    stop_name: 'HSR Sector 2 Circle'
  },
  // Zenith Roster
  {
    id: 'r3',
    institution_id: '22222222-2222-2222-2222-222222222222',
    email: 'employee@bussync.dev',
    name: 'Amit Patel (Dev Employee)',
    role: 'employee',
    route_code: 'R-202',
    stop_name: 'Domlur Flyover'
  },
  {
    id: 'r4',
    institution_id: '22222222-2222-2222-2222-222222222222',
    email: 'employee@zenithcorp.com',
    name: 'Pooja Hegde',
    role: 'employee',
    route_code: 'R-202',
    stop_name: 'Embassy GolfLinks'
  }
];

export const DEV_USERS: Record<string, UserProfile> = {
  'driver@bussync.dev': {
    id: 'dev-driver-1',
    institution_id: '11111111-1111-1111-1111-111111111111',
    email: 'driver@bussync.dev',
    name: 'Ravi Kumar (Dev Driver)',
    role: 'driver'
  },
  'student@bussync.dev': {
    id: 'dev-student-1',
    institution_id: '11111111-1111-1111-1111-111111111111',
    email: 'student@bussync.dev',
    name: 'Rohan Sharma (Dev Student)',
    role: 'student',
    route_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    stop_id: 'a1111111-0000-0000-0000-000000000004' // Bellandur Gate
  },
  'employee@bussync.dev': {
    id: 'dev-employee-1',
    institution_id: '22222222-2222-2222-2222-222222222222',
    email: 'employee@bussync.dev',
    name: 'Amit Patel (Dev Employee)',
    role: 'employee',
    route_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    stop_id: 'b2222222-0000-0000-0000-000000000002' // Domlur Flyover
  },
  'admin@bussync.dev': {
    id: 'dev-admin-1',
    institution_id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@bussync.dev',
    name: 'Fleet Admin (Apex)',
    role: 'admin'
  }
};

