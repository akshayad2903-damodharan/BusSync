-- ==============================================================================
-- BusSync: 001_initial_schema.sql
-- Multi-tenant institutional bus tracking schema with partial unique indexes,
-- spatial coordinates, and automated trip maintenance.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INSTITUTIONS
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    visibility TEXT NOT NULL CHECK (visibility IN ('private', 'public_to_area')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROUTES
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#f59e0b',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STOPS (Ordered per route)
CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stop_order INTEGER NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    eta_offset_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_route_stop_order UNIQUE(route_id, stop_order)
);

-- 4. BUSES
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    bus_number TEXT NOT NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'full', 'breakdown')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_inst_bus_number UNIQUE(institution_id, bus_number)
);

-- 5. DRIVERS
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    pin_hash TEXT NOT NULL, -- SHA-256 or bcrypt hash of 4-digit personal PIN
    failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TRIPS
-- Note: A bus can only have ONE active trip at any time. Guaranteed via partial unique index.
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Strictly enforce that a bus cannot have more than one active trip simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_bus_trip 
ON trips(bus_id) 
WHERE active = TRUE;

-- 7. LOCATIONS (Buffered GPS point stream from active trip)
CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION NOT NULL DEFAULT 0, -- km/h
    heading DOUBLE PRECISION NOT NULL DEFAULT 0, -- degrees (0-360)
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_trip_recorded ON locations(trip_id, recorded_at DESC);

-- 8. USERS (Profiles tied to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- references auth.users(id)
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('driver', 'student', 'employee', 'admin')),
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    stop_id UUID REFERENCES stops(id) ON DELETE SET NULL,
    fcm_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ROSTER (Institution authorized directory for students and employees)
CREATE TABLE IF NOT EXISTS roster (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'employee')),
    route_code TEXT,
    stop_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_inst_roster_email UNIQUE(institution_id, email)
);

-- 10. AUTO-END STALE TRIPS (Function & Maintenance trigger)
-- Auto-ends any trip with active = true that has had no location updates for 2 hours
CREATE OR REPLACE FUNCTION auto_end_stale_trips() 
RETURNS INTEGER AS $$
DECLARE
    ended_count INTEGER := 0;
BEGIN
    WITH stale_trips AS (
        SELECT t.id, t.bus_id
        FROM trips t
        WHERE t.active = TRUE
          AND (
              -- No locations at all and started > 2 hours ago
              (NOT EXISTS (SELECT 1 FROM locations l WHERE l.trip_id = t.id) 
               AND t.started_at < NOW() - INTERVAL '2 hours')
              OR
              -- Latest location is older than 2 hours
              ((SELECT MAX(l.recorded_at) FROM locations l WHERE l.trip_id = t.id) < NOW() - INTERVAL '2 hours')
          )
    ),
    update_trips AS (
        UPDATE trips
        SET active = FALSE, ended_at = NOW()
        WHERE id IN (SELECT id FROM stale_trips)
        RETURNING id
    )
    SELECT COUNT(*) INTO ended_count FROM update_trips;

    -- Reset bus status to normal for ended trips
    UPDATE buses
    SET status = 'normal'
    WHERE id IN (SELECT bus_id FROM trips WHERE active = FALSE AND ended_at >= NOW() - INTERVAL '1 minute');

    RETURN ended_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RPC: DRIVER PIN VERIFICATION WITH RATE LIMITING
CREATE OR REPLACE FUNCTION verify_driver_pin(
    p_institution_id UUID,
    p_driver_id UUID,
    p_entered_pin TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_driver drivers%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
    v_hashed_pin TEXT;
BEGIN
    SELECT * INTO v_driver
    FROM drivers
    WHERE id = p_driver_id AND institution_id = p_institution_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Driver not found');
    END IF;

    -- Check if locked out
    IF v_driver.locked_until IS NOT NULL AND v_driver.locked_until > v_now THEN
        RETURN jsonb_build_object(
            'success', false,
            'locked', true,
            'message', 'Account locked due to too many failed attempts. Try again later.',
            'locked_until', v_driver.locked_until
        );
    END IF;

    -- Verify PIN (using SHA-256)
    v_hashed_pin := encode(digest(p_entered_pin, 'sha256'), 'hex');

    IF v_driver.pin_hash = v_hashed_pin OR v_driver.pin_hash = p_entered_pin THEN
        -- Reset failed attempts on success
        UPDATE drivers 
        SET failed_pin_attempts = 0, locked_until = NULL 
        WHERE id = p_driver_id;

        RETURN jsonb_build_object(
            'success', true,
            'driver', jsonb_build_object(
                'id', v_driver.id,
                'name', v_driver.name,
                'phone', v_driver.phone,
                'institution_id', v_driver.institution_id
            )
        );
    ELSE
        -- Increment failed attempts
        UPDATE drivers
        SET failed_pin_attempts = failed_pin_attempts + 1,
            locked_until = CASE 
                WHEN failed_pin_attempts + 1 >= 5 THEN v_now + INTERVAL '15 minutes'
                ELSE NULL
            END
        WHERE id = p_driver_id
        RETURNING failed_pin_attempts INTO v_driver.failed_pin_attempts;

        RETURN jsonb_build_object(
            'success', false,
            'remaining_attempts', GREATEST(0, 5 - v_driver.failed_pin_attempts),
            'locked', (v_driver.failed_pin_attempts >= 5),
            'message', CASE 
                WHEN v_driver.failed_pin_attempts >= 5 THEN 'Too many failed attempts. Locked for 15 minutes.'
                ELSE 'Incorrect PIN. ' || (5 - v_driver.failed_pin_attempts) || ' attempts remaining.'
            END
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
