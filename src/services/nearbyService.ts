// ==============================================================================
// BusSync: nearbyService
// Queries active buses from nearby institutions with visibility = 'public_to_area'
// and strictly masks private data (no driver names, no phone numbers, no roster).
// ==============================================================================

import { ActiveBusTrackingData } from '../types';
import { mockEngine } from './mockEngine';
import { calculateHaversineDistance } from './etaService';

const isMock = import.meta.env.VITE_USE_MOCKS === 'true';

export const nearbyService = {
  // Query active buses within radiusKm belonging to public_to_area institutions
  async getNearbyInstitutionsBuses(
    currentInstitutionId: string,
    centerLat: number,
    centerLng: number,
    radiusKm: number = 20
  ): Promise<ActiveBusTrackingData[]> {
    if (isMock) {
      const activeTrips = mockEngine.trips.filter((t) => t.active);
      const nearbyBuses: ActiveBusTrackingData[] = [];

      for (const trip of activeTrips) {
        // Skip own institution
        if (trip.institution_id === currentInstitutionId) continue;

        const institution = mockEngine.institutions.find((i) => i.id === trip.institution_id);
        // STRICT PRIVACY CHECK: Only institutions with public_to_area are permitted!
        if (!institution || institution.visibility !== 'public_to_area') {
          continue;
        }

        const bus = mockEngine.buses.find((b) => b.id === trip.bus_id);
        if (!bus) continue;

        const latestLoc = mockEngine.getLatestLocation(trip.id);
        if (!latestLoc) continue;

        // Check radius distance
        const distance = calculateHaversineDistance(
          centerLat,
          centerLng,
          latestLoc.lat,
          latestLoc.lng
        );

        if (distance <= radiusKm) {
          const route = mockEngine.routes.find((r) => r.id === bus.route_id);

          // Return STRICTLY masked data: NO driver name, NO driver phone!
          nearbyBuses.push({
            bus_id: bus.id,
            bus_number: bus.bus_number,
            route_id: bus.route_id,
            route_name: route?.name || 'Public Transit Route',
            route_code: route?.code || 'EXT',
            route_color: '#6366f1', // Distinct Indigo for outside institutions
            status: bus.status,
            trip_id: trip.id,
            // Masked fields (security compliance)
            driver_id: undefined,
            driver_name: undefined,
            driver_phone: undefined,
            institution_id: institution.id,
            institution_name: institution.name,
            is_nearby: true,
            latest_location: latestLoc,
            last_updated_seconds_ago: Math.max(
              0,
              Math.floor((Date.now() - new Date(latestLoc.recorded_at).getTime()) / 1000)
            ),
            is_stale: false
          });
        }
      }

      return nearbyBuses;
    }

    throw new Error('Live Supabase nearby query not yet configured.');
  }
};
