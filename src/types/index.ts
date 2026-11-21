// ==============================================================================
// BusSync: Core Domain Models & Type Definitions
// ==============================================================================

export type Role = 'driver' | 'student' | 'employee' | 'admin';
export type InstitutionVisibility = 'private' | 'public_to_area';
export type BusStatus = 'normal' | 'full' | 'breakdown';

export interface Institution {
  id: string;
  name: string;
  code: string;
  visibility: InstitutionVisibility;
  created_at?: string;
}

export interface Route {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  color: string;
  created_at?: string;
}

export interface Stop {
  id: string;
  route_id: string;
  name: string;
  stop_order: number;
  lat: number;
  lng: number;
  eta_offset_minutes: number;
  created_at?: string;
}

export interface Bus {
  id: string;
  institution_id: string;
  bus_number: string;
  route_id: string | null;
  status: BusStatus;
  created_at?: string;
}

export interface Driver {
  id: string;
  institution_id: string;
  name: string;
  phone: string;
  pin_hash?: string;
  failed_pin_attempts?: number;
  locked_until?: string | null;
  created_at?: string;
}

export interface Trip {
  id: string;
  bus_id: string;
  driver_id: string;
  institution_id: string;
  started_at: string;
  ended_at?: string | null;
  active: boolean;
  created_at?: string;
}

export interface LocationPoint {
  id?: number | string;
  trip_id: string;
  lat: number;
  lng: number;
  speed: number; // km/h
  heading: number; // 0 - 360 degrees
  recorded_at: string; // ISO string
}

export interface UserProfile {
  id: string;
  institution_id: string;
  email: string;
  role: Role;
  route_id?: string | null;
  stop_id?: string | null;
  fcm_token?: string | null;
  name?: string;
  created_at?: string;
}

export interface RosterEntry {
  id: string;
  institution_id: string;
  email: string;
  name: string;
  role: 'student' | 'employee';
  route_code?: string | null;
  stop_name?: string | null;
  created_at?: string;
}

export interface ActiveBusTrackingData {
  bus_id: string;
  bus_number: string;
  route_id: string | null;
  route_name: string;
  route_code: string;
  route_color: string;
  status: BusStatus;
  trip_id: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  institution_id: string;
  institution_name: string;
  is_nearby: boolean; // true if bus belongs to an outside public_to_area institution
  latest_location: LocationPoint | null;
  last_updated_seconds_ago: number;
  is_stale: boolean; // true if > 60s without updates
  eta_minutes?: number | null;
  eta_distance_km?: number | null;
}

export interface OfflineLocationBuffer {
  id: string;
  point: LocationPoint;
  queued_at: number;
}

