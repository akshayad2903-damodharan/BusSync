// ==============================================================================
// BusSync: etaService
// Calculates distance, dynamic ETA to the user's selected stop based on live GPS
// speed (with fallback transit speed), and evaluates "bus is 5 minutes away" trigger.
// ==============================================================================

import { LocationPoint, Stop } from '../types';

export interface ETAResult {
  minutes: number;
  distanceKm: number;
  stopsRemaining: number;
  isApproaching: boolean;
  hasPassed: boolean;
  etaFormatted: string;
  isFiveMinutesAway: boolean;
}

// Great-circle Haversine formula to calculate distance in km between two lat/lng points
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const etaService = {
  // Calculate ETA from current bus location to target stop along the route
  calculateETA(
    busLocation: LocationPoint,
    targetStop: Stop,
    allRouteStops: Stop[]
  ): ETAResult {
    const sortedStops = [...allRouteStops].sort((a, b) => a.stop_order - b.stop_order);
    const targetIndex = sortedStops.findIndex((s) => s.id === targetStop.id);

    if (targetIndex === -1) {
      return {
        minutes: 0,
        distanceKm: 0,
        stopsRemaining: 0,
        isApproaching: false,
        hasPassed: false,
        etaFormatted: 'Unknown stop',
        isFiveMinutesAway: false
      };
    }

    // Find the closest stop to current bus location to determine progress
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < sortedStops.length; i++) {
      const d = calculateHaversineDistance(
        busLocation.lat,
        busLocation.lng,
        sortedStops[i].lat,
        sortedStops[i].lng
      );
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }

    // If bus is already past the user's stop by more than 300 meters
    if (closestIndex > targetIndex) {
      return {
        minutes: 0,
        distanceKm: 0,
        stopsRemaining: 0,
        isApproaching: false,
        hasPassed: true,
        etaFormatted: 'Bus departed your stop',
        isFiveMinutesAway: false
      };
    }

    // Calculate polyline distance: from bus to next stop, then sum intervening stop distances
    let totalDistanceKm = calculateHaversineDistance(
      busLocation.lat,
      busLocation.lng,
      sortedStops[closestIndex].lat,
      sortedStops[closestIndex].lng
    );

    for (let i = closestIndex; i < targetIndex; i++) {
      totalDistanceKm += calculateHaversineDistance(
        sortedStops[i].lat,
        sortedStops[i].lng,
        sortedStops[i + 1].lat,
        sortedStops[i + 1].lng
      );
    }

    // Transit speed: use live GPS speed if > 8 km/h, else fallback average transit speed 25 km/h
    const transitSpeedKmH = busLocation.speed > 8 ? busLocation.speed : 25;
    // Base minutes = (distance / speed) * 60 + 1 min dwell time per remaining stop
    const stopsRemaining = targetIndex - closestIndex;
    const travelMinutes = (totalDistanceKm / transitSpeedKmH) * 60;
    const dwellMinutes = stopsRemaining * 0.75; // 45s per stop
    const totalMinutes = Math.max(1, Math.round(travelMinutes + dwellMinutes));

    return {
      minutes: totalMinutes,
      distanceKm: Number(totalDistanceKm.toFixed(1)),
      stopsRemaining,
      isApproaching: true,
      hasPassed: false,
      etaFormatted: totalMinutes === 1 ? 'Arrives in ~1 min' : `Arrives in ${totalMinutes} min`,
      isFiveMinutesAway: totalMinutes <= 5 && totalMinutes >= 4
    };
  }
};

