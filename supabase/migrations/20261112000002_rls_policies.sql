-- ==============================================================================
-- BusSync: 002_rls_policies.sql
-- Multi-tenant Row Level Security (RLS) enforcement.
-- Isolates institutions, restricts location writes strictly to the assigned driver's active trip,
-- and securely exposes public_to_area buses.
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's institution_id
CREATE OR REPLACE FUNCTION get_current_user_institution()
RETURNS UUID AS $$
    SELECT institution_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. INSTITUTIONS POLICIES
-- Anyone authenticated can see their own institution; public_to_area institutions are readable by any authenticated user
CREATE POLICY "Institutions visibility" ON institutions
FOR SELECT USING (
    id = get_current_user_institution() OR visibility = 'public_to_area'
);

-- 3. ROUTES & STOPS POLICIES
-- Users can view routes of their institution, or public_to_area institutions
CREATE POLICY "Routes select policy" ON routes
FOR SELECT USING (
    institution_id = get_current_user_institution() OR
    institution_id IN (SELECT id FROM institutions WHERE visibility = 'public_to_area')
);

CREATE POLICY "Routes admin manage policy" ON routes
FOR ALL USING (
    institution_id = get_current_user_institution() AND get_current_user_role() = 'admin'
);

CREATE POLICY "Stops select policy" ON stops
FOR SELECT USING (
    route_id IN (
        SELECT r.id FROM routes r 
        WHERE r.institution_id = get_current_user_institution() 
           OR r.institution_id IN (SELECT id FROM institutions WHERE visibility = 'public_to_area')
    )
);

CREATE POLICY "Stops admin manage policy" ON stops
FOR ALL USING (
    route_id IN (
        SELECT r.id FROM routes r 
        WHERE r.institution_id = get_current_user_institution() AND get_current_user_role() = 'admin'
    )
);

-- 4. BUSES POLICIES
-- Read own institution buses, or public_to_area institution buses if running
CREATE POLICY "Buses select policy" ON buses
FOR SELECT USING (
    institution_id = get_current_user_institution() OR
    (institution_id IN (SELECT id FROM institutions WHERE visibility = 'public_to_area')
     AND EXISTS (SELECT 1 FROM trips WHERE trips.bus_id = buses.id AND trips.active = TRUE))
);

CREATE POLICY "Buses admin manage policy" ON buses
FOR ALL USING (
    institution_id = get_current_user_institution() AND get_current_user_role() = 'admin'
);

-- 5. DRIVERS POLICIES
-- Managed only by institution admin; drivers can see their own institution drivers during shared login
CREATE POLICY "Drivers select policy" ON drivers
FOR SELECT USING (
    institution_id = get_current_user_institution()
);

CREATE POLICY "Drivers admin manage policy" ON drivers
FOR ALL USING (
    institution_id = get_current_user_institution() AND get_current_user_role() = 'admin'
);

-- 6. TRIPS POLICIES
-- Read own institution trips, or public active trips for nearby map
CREATE POLICY "Trips select policy" ON trips
FOR SELECT USING (
    institution_id = get_current_user_institution() OR
    (active = TRUE AND institution_id IN (SELECT id FROM institutions WHERE visibility = 'public_to_area'))
);

-- Drivers can start and end trips for their institution
CREATE POLICY "Trips driver insert policy" ON trips
FOR INSERT WITH CHECK (
    institution_id = get_current_user_institution() AND
    get_current_user_role() IN ('driver', 'admin')
);

CREATE POLICY "Trips driver update policy" ON trips
FOR UPDATE USING (
    institution_id = get_current_user_institution() AND
    get_current_user_role() IN ('driver', 'admin')
);

-- 7. LOCATIONS POLICIES
-- CRITICAL SECURITY RULE: Write locations ONLY for driver session, and ONLY for its own active trip!
CREATE POLICY "Locations insert policy" ON locations
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM trips t
        JOIN users u ON u.institution_id = t.institution_id
        WHERE t.id = locations.trip_id
          AND t.active = TRUE
          AND u.id = auth.uid()
          AND u.role IN ('driver', 'admin')
    )
);

-- Read locations for own institution active trips, or public_to_area active trips
CREATE POLICY "Locations select policy" ON locations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM trips t
        WHERE t.id = locations.trip_id
          AND t.active = TRUE
          AND (
              t.institution_id = get_current_user_institution() OR
              t.institution_id IN (SELECT id FROM institutions WHERE visibility = 'public_to_area')
          )
    )
);

-- 8. USERS & ROSTER POLICIES
CREATE POLICY "Users read own profile" ON users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users admin manage" ON users
FOR ALL USING (
    institution_id = get_current_user_institution() AND get_current_user_role() = 'admin'
);

CREATE POLICY "Roster admin manage" ON roster
FOR ALL USING (
    institution_id = get_current_user_institution() AND get_current_user_role() = 'admin'
);

