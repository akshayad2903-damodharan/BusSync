# BusSync

BusSync is live bus tracking for colleges and companies (not public transport). Drivers share location from their phone; students and employees see buses move on a map, get ETAs, and are alerted to breakdowns or full buses.

## Goals

- Students/employees see where their bus is, live, and when it reaches their stop.
- Drivers start a trip in a few taps; tracking keeps working with the phone locked.
- Admins see every bus and its status at a glance.
- Nearby institutions' buses can be viewed on the map (opt-in, limited info).

## Roles

| Role | Login | Can do |
|---|---|---|
| Driver | Shared institution account + personal PIN | Pick today's bus, start/end trip, set Breakdown / Full / Normal |
| Student / Employee | Roster email + OTP (magic link) | View buses, select stop, see ETA, get notifications |
| Admin | Individual email + OTP | Upload roster, manage buses/drivers/routes/stops, force-end trips |

## MVP features

**Bus and route data**
1. Bus number, route name, ordered stops
2. Driver name and phone, with tap-to-call (taken from the active trip, not the bus)
3. Trip start/end: a bus appears on the map only during an active trip

**Driver app**
4. Location every ~5 seconds (lat, lng, speed, heading, timestamp)
5. Background tracking with phone locked (foreground service, "Trip in progress" notification)
6. Status buttons: Breakdown, Bus Full, Back to Normal
7. Offline buffering: store points in dead zones, upload when signal returns

**Student/employee app**
8. Live map with a bus icon that rotates by heading and glides between updates
9. Nearby buses from other institutions (opt-in, different colour, number/route/position only)
10. Bus detail panel: number, route, driver, status, tap-to-call
11. "Last updated X seconds ago"; marker turns grey after 60 s of silence
12. Status badges: Running, Full, Breakdown
13. Select my stop and see ETA
14. Push notifications: breakdown, full, "bus is 5 minutes away"

**Admin**
15. Live list of all institution buses with statuses

## Deferred (v2)

SOS button, QR boarding attendance, family live-share link, late-proof note, route analytics, driver substitute handoff.

## Tech stack

- **Backend:** Supabase (Postgres, Realtime, Auth, Row Level Security)
- **Student/admin web app:** React + Vite, Leaflet + OpenStreetMap
- **Apps (driver + student):** one React codebase wrapped with Capacitor for Android/iOS; admin stays a web dashboard. Driver app uses Capacitor with a background geolocation plugin (fallback for quick demo: Traccar Client posting to the backend)
- **Push:** Firebase Cloud Messaging

## Data model

- `institutions` (id, name, visibility: private | public_to_area)
- `buses` (id, institution_id, bus_number, route_id, status)
- `routes`, `stops` (ordered, with coordinates)
- `drivers` (id, institution_id, name, phone, pin_hash)
- `trips` (id, bus_id, driver_id, started_at, ended_at, active)
- `locations` (trip_id, lat, lng, speed, heading, recorded_at)
- `users` (id, email, role, institution_id, route_id, stop_id)
- `roster` (institution_id, email, name, optional route/stop)

## Auth rules

- Driver: shared institution login, then personal PIN, then pick a bus with no active trip. Rate-limit PIN attempts.
- Student/employee: email must exist in the institution's roster; verify by OTP/magic link.
- Row Level Security: only a driver session may write locations, and only for the bus of its own active trip.
- Auto-end a trip after 2 hours with no location updates; admin can force-end.

## UI and appearance

_To be filled in from the design answers before building starts._

- Theme:
- Style/feel:
- Primary colour:
- Bus icon style:

## Rules for the AI agent

- Plan first, then wait for approval before large changes.
- Build one feature at a time; keep each change small and runnable.
- No secrets in code; use `.env` and keep `.env.example` updated.
- Enforce permissions in the database (RLS), not only in the UI.
- Mobile-first layouts; the student view must work well on a phone.
- After each feature: run it, test the main path, then commit.

## Build order

1. Repo, Supabase project, schema, seed data
2. Roster-based student login and driver PIN login
3. Driver trip start/end plus location sending
4. Live map with animated, rotating bus icon
5. Status buttons, badges, stale-marker label
6. Stop selection and ETA
7. Nearby institutions view
8. Admin page, notifications, background tracking, real-drive test

## Git conventions

- Branches: `main` (stable), `feat/<name>` per feature
- Commits: `feat:`, `fix:`, `chore:`, `docs:` prefix, one feature per commit
- Never commit `.env`
