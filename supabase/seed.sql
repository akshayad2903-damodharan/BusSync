-- ==============================================================================
-- BusSync: seed.sql (Production Sample Seed Data)
-- 2 Institutions (1 public_to_area, 1 private), 4 Buses, 2 Routes with ordered stops,
-- drivers with secure hashed PINs, and roster members.
-- ==============================================================================

-- 1. INSTITUTIONS
INSERT INTO institutions (id, name, code, visibility) VALUES
('11111111-1111-1111-1111-111111111111', 'Apex Institute of Technology', 'APEX', 'public_to_area'),
('22222222-2222-2222-2222-222222222222', 'Zenith Corporate Campus', 'ZENITH', 'private')
ON CONFLICT (code) DO NOTHING;

-- 2. ROUTES
INSERT INTO routes (id, institution_id, name, code, color) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Route 101 - North Campus Shuttle', 'R-101', '#f59e0b'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Route 202 - Tech Corridor Express', 'R-202', '#3b82f6')
ON CONFLICT DO NOTHING;

-- 3. ORDERED STOPS
-- Route 101 (Apex Institute)
INSERT INTO stops (id, route_id, name, stop_order, lat, lng, eta_offset_minutes) VALUES
('a1111111-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Central Metro Interchange', 1, 12.9716, 77.5946, 0),
('a1111111-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Koramangala 5th Block', 2, 12.9352, 77.6245, 12),
('a1111111-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HSR Sector 2 Circle', 3, 12.9116, 77.6389, 22),
('a1111111-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bellandur Gate', 4, 12.9260, 77.6762, 35),
('a1111111-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Apex Campus North Gate', 5, 12.9350, 77.6920, 45)
ON CONFLICT DO NOTHING;

-- Route 202 (Zenith Corporate)
INSERT INTO stops (id, route_id, name, stop_order, lat, lng, eta_offset_minutes) VALUES
('b2222222-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Indiranagar 100ft Junction', 1, 12.9784, 77.6408, 0),
('b2222222-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Domlur Flyover', 2, 12.9609, 77.6387, 10),
('b2222222-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Embassy GolfLinks', 3, 12.9515, 77.6510, 20),
('b2222222-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Zenith Tech Tower Gate 1', 4, 12.9430, 77.6650, 30)
ON CONFLICT DO NOTHING;

-- 4. BUSES (4 buses total: 2 Apex, 2 Zenith)
INSERT INTO buses (id, institution_id, bus_number, route_id, status) VALUES
('b0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'KA-01-APEX-101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'normal'),
('b0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'KA-01-APEX-102', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'normal'),
('b0000002-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'KA-03-ZNTH-201', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'normal'),
('b0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'KA-03-ZNTH-202', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'normal')
ON CONFLICT DO NOTHING;

-- 5. DRIVERS (with SHA-256 pin hashes)
-- '1234' = 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
-- '5678' = ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f
INSERT INTO drivers (id, institution_id, name, phone, pin_hash) VALUES
('d1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Ravi Kumar', '+91 9876543210', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'),
('d1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Suresh Patil', '+91 9876543211', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f'),
('d2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Anand Verma', '+91 9876543212', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'),
('d2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Manoj Singh', '+91 9876543213', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f')
ON CONFLICT DO NOTHING;

-- 6. ROSTER ENTRIES
INSERT INTO roster (institution_id, email, name, role, route_code, stop_name) VALUES
('11111111-1111-1111-1111-111111111111', 'student@apex.edu', 'Rohan Sharma', 'student', 'R-101', 'Bellandur Gate'),
('11111111-1111-1111-1111-111111111111', 'priya.m@apex.edu', 'Priya Menon', 'student', 'R-101', 'HSR Sector 2 Circle'),
('22222222-2222-2222-2222-222222222222', 'employee@zenithcorp.com', 'Amit Patel', 'employee', 'R-202', 'Domlur Flyover'),
('22222222-2222-2222-2222-222222222222', 'neha.s@zenithcorp.com', 'Neha Singh', 'employee', 'R-202', 'Embassy GolfLinks')
ON CONFLICT DO NOTHING;
