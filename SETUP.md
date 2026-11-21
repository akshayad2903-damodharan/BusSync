# BusSync Production & Deployment Setup Guide

This guide details how to transition BusSync from local simulation mode (`VITE_USE_MOCKS=true`) to live production with Supabase and Firebase Cloud Messaging (FCM).

---

## 1. Environment Variables Checklist (`.env`)

Copy `.env.example` to `.env` and configure each of the following required credentials:

| Variable | Required In Prod | Where to Obtain |
|---|---|---|
| `VITE_USE_MOCKS` | `false` | Set to `false` for live database & real GPS operation |
| `VITE_DEV_MODE` | `false` | **MUST BE `false` IN PRODUCTION** (strips dev logins & OTP bypass) |
| `VITE_SUPABASE_URL` | Yes | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase Dashboard → Project Settings → API → `anon` public key |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Console → Project Settings → General → Web App Config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Console → Project Settings → General → Web App Config |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase Console → Project Settings → General → Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET`| Yes | Firebase Console → Project Settings → General → Web App Config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Yes | Firebase Console → Project Settings → Cloud Messaging → Sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase Console → Project Settings → General → Web App Config |
| `VITE_FIREBASE_VAPID_KEY` | Yes | Firebase Console → Cloud Messaging → Web configuration → Key pair |

---

## 2. Supabase Database & Security Migration

Run the versioned migrations located in `supabase/migrations/` in order:

1. **Initial Schema**: Run `supabase/migrations/20261112000001_initial_schema.sql`
   - Creates `institutions`, `buses`, `routes`, `stops`, `drivers`, `trips`, `locations`, `users`, and `roster` tables.
   - Enforces unique active trip per bus:
     ```sql
     CREATE UNIQUE INDEX unique_active_bus_trip ON trips(bus_id) WHERE active = true;
     ```
   - Installs `verify_driver_pin` with 5-attempt rate-limiting and 15-minute lockout.
   - Installs `auto_end_stale_trips()` function.

2. **Row Level Security (RLS)**: Run `supabase/migrations/20261112000002_rls_policies.sql`
   - Enables RLS on all 9 tables.
   - Restricts location coordinate writes strictly to the assigned driver's active trip.
   - Isolates multi-tenant data per institution.
   - Exposes only `bus_number`, `route_name`, and coordinates for `public_to_area` institutions.

3. **Production Seed Data**: Run `supabase/seed.sql`
   - Seeds 2 institutions (Apex Institute of Technology, Zenith Corporate Campus), 4 buses, 2 routes with ordered stops, drivers with SHA-256 PIN hashes, and initial roster members.

> [!CAUTION]
> **DO NOT** run `supabase/seed_dev.sql` in production. It contains dummy test accounts (`*@bussync.dev`).

---

## 3. Firebase Cloud Messaging (FCM) & Edge Function Deployment

1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy send-route-notification --project-ref your-project-ref
   ```
2. **Set Function Secrets**:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
   ```

---

## 4. Capacitor Android Foreground Service Configuration

1. **Build Web App**:
   ```bash
   npm run build
   ```
2. **Add Native Android Platform**:
   ```bash
   npx cap add android
   npx cap sync
   ```
3. **Android Permissions (`android/app/src/main/AndroidManifest.xml`)**:
   Verify these permissions are present:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   ```
4. **Driver Setup**: Instruct all drivers to open the setup screen and choose **Unrestricted Battery Usage** in their device settings.

---

## 5. Pre-Release Security & Production Checklist

Before deploying production builds to students, employees, or drivers, confirm:

- [ ] `VITE_DEV_MODE=false` in `.env.production`.
- [ ] Dev Quick Login panel is completely stripped from the login screen.
- [ ] OTP bypass code `123456` is disabled.
- [ ] Dummy test accounts (`*@bussync.dev`) are deleted from the database.
- [ ] Driver PINs are securely hashed in the `drivers` table (no plain text).
- [ ] RLS policies are enabled on all tables in the Supabase Dashboard.
- [ ] Lighthouse accessibility score is 90+ on main student map and driver screens.

