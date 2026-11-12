-- ==============================================================================
-- BusSync: seed_dev.sql (DEVELOPMENT ONLY SEED ACCOUNTS)
-- DO NOT RUN IN PRODUCTION!
-- ==============================================================================

-- 1. DEV ROSTER ENTRIES
INSERT INTO roster (institution_id, email, name, role, route_code, stop_name) VALUES
('11111111-1111-1111-1111-111111111111', 'student@bussync.dev', 'Dev Student (Apex)', 'student', 'R-101', 'HSR Sector 2 Circle'),
('22222222-2222-2222-2222-222222222222', 'employee@bussync.dev', 'Dev Employee (Zenith)', 'employee', 'R-202', 'Domlur Flyover')
ON CONFLICT DO NOTHING;

-- 2. DEV DRIVERS
-- PIN 1234 hash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
INSERT INTO drivers (id, institution_id, name, phone, pin_hash) VALUES
('d0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Ravi Kumar (Dev)', '+91 9876543210', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4')
ON CONFLICT DO NOTHING;

-- 3. DEV USER PROFILES
-- For use with Supabase auth when testing auth locally
INSERT INTO users (id, institution_id, email, role) VALUES
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'driver@bussync.dev', 'driver'),
('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'student@bussync.dev', 'student'),
('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'employee@bussync.dev', 'employee'),
('00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'admin@bussync.dev', 'admin')
ON CONFLICT DO NOTHING;
