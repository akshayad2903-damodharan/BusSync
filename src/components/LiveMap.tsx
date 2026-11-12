// ==============================================================================
// BusSync: LiveMap Component
// Mobile-first live map featuring OpenStreetMap tiles, rotating top-down bus markers,
// smooth 1-second gliding transitions, route paths, and stop pins.
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ActiveBusTrackingData, Route, Stop } from '../types';
import { createBusIcon, createStopIcon } from './BusMarkerIcon';
import { Crosshair, Layers, ZoomIn, ZoomOut, AlertCircle, Compass } from 'lucide-react';

interface LiveMapProps {
  buses: ActiveBusTrackingData[];
  selectedBusId: string | null;
  routes: Route[];
  stops: Stop[];
  onSelectBus: (busId: string) => void;
  selectedStopId?: string | null;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  buses,
  selectedBusId,
  routes,
  stops,
  onSelectBus,
  selectedStopId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const [followBus, setFollowBus] = useState<boolean>(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center at tech corridor / campus stops
    const defaultCenter: [number, number] = [12.9430, 77.6408];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // OpenStreetMap Tile Layer (Clean CartoDB Positron / OSM style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    routeLayersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw Routes and Ordered Stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = routeLayersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Group stops by route
    routes.forEach((route) => {
      const routeStops = stops
        .filter((s) => s.route_id === route.id)
        .sort((a, b) => a.stop_order - b.stop_order);

      if (routeStops.length > 0) {
        const polylineCoords: [number, number][] = routeStops.map((s) => [s.lat, s.lng]);

        // Draw Route Polyline
        L.polyline(polylineCoords, {
          color: route.color || '#f59e0b',
          weight: 4,
          opacity: 0.75,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(layerGroup);

        // Draw Ordered Stop Pins
        routeStops.forEach((stop) => {
          const isSelected = selectedStopId === stop.id;
          const stopMarker = L.marker([stop.lat, stop.lng], {
            icon: createStopIcon(stop.stop_order, isSelected),
            zIndexOffset: isSelected ? 500 : 100
          });

          stopMarker.bindTooltip(
            `<div class="font-bold text-xs">${stop.name}</div><div class="text-[10px] text-slate-500">Stop #${stop.stop_order}</div>`,
            { direction: 'top', offset: [0, -10] }
          );

          stopMarker.addTo(layerGroup);
        });
      }
    });
  }, [routes, stops, selectedStopId]);

  // Update Active Buses (Smooth Glide & Rotation)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = busMarkersRef.current;
    const activeBusIds = new Set(buses.map((b) => b.bus_id));

    // 1. Remove markers for buses that ended their trips
    currentMarkers.forEach((marker, busId) => {
      if (!activeBusIds.has(busId)) {
        marker.remove();
        currentMarkers.delete(busId);
      }
    });

    // 2. Add or smoothly update markers for active buses
    buses.forEach((bus) => {
      if (!bus.latest_location) return;

      const targetLat = bus.latest_location.lat;
      const targetLng = bus.latest_location.lng;
      const heading = bus.latest_location.heading || 0;
      const isSelected = selectedBusId === bus.bus_id;

      const icon = createBusIcon({
        busNumber: bus.bus_number,
        heading,
        status: bus.status,
        isNearby: bus.is_nearby,
        isStale: bus.is_stale,
        isSelected
      });

      let marker = currentMarkers.get(bus.bus_id);

      if (!marker) {
        // Create new bus marker
        marker = L.marker([targetLat, targetLng], {
          icon,
          zIndexOffset: isSelected ? 1000 : 800
        }).addTo(map);

        marker.on('click', () => {
          onSelectBus(bus.bus_id);
        });

        currentMarkers.set(bus.bus_id, marker);
      } else {
        // Smoothly glide existing marker to new location
        marker.setIcon(icon);
        marker.setZIndexOffset(isSelected ? 1000 : 800);

        // Animated position glide over 1.2 seconds
        const startLatLng = marker.getLatLng();
        const startTime = performance.now();
        const duration = 1200; // ms

        const animateGlide = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);

          const currentLat = startLatLng.lat + (targetLat - startLatLng.lat) * ease;
          const currentLng = startLatLng.lng + (targetLng - startLatLng.lng) * ease;

          marker?.setLatLng([currentLat, currentLng]);

          if (progress < 1) {
            requestAnimationFrame(animateGlide);
          }
        };

        requestAnimationFrame(animateGlide);
      }

      // If this bus is selected and follow mode is active, smoothly pan map
      if (isSelected && followBus) {
        map.panTo([targetLat, targetLng], { animate: true, duration: 1 });
      }
    });
  }, [buses, selectedBusId, followBus, onSelectBus]);

  // Recenter / Fit bounds to all active buses
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (buses.length > 0) {
      const validPoints = buses
        .filter((b) => b.latest_location)
        .map((b) => [b.latest_location!.lat, b.latest_location!.lng] as [number, number]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        return;
      }
    }

    // Fallback: fit to routes/stops
    if (stops.length > 0) {
      const stopBounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
      map.fitBounds(stopBounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-subtle">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Recenter Fleet Button */}
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter Map"
          title="Recenter Map"
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-float border border-slate-200 text-slate-800 hover:text-amber-600 flex items-center justify-center transition-all active:scale-95"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* Follow Bus Toggle */}
        <button
          type="button"
          onClick={() => setFollowBus(!followBus)}
          aria-label="Toggle Follow Bus"
          title={followBus ? 'Auto-follow active' : 'Auto-follow paused'}
          className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-float border flex items-center justify-center transition-all active:scale-95 ${
            followBus
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
              : 'bg-white/95 border-slate-200 text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          aria-label="Zoom In"
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-float border border-slate-200 text-slate-800 hover:text-amber-600 flex items-center justify-center transition-all active:scale-95"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          aria-label="Zoom Out"
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-float border border-slate-200 text-slate-800 hover:text-amber-600 flex items-center justify-center transition-all active:scale-95"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Active Buses Count Pill Badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-2xl shadow-float border border-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold font-heading">
            {buses.length} {buses.length === 1 ? 'Bus Running Live' : 'Buses Running Live'}
          </span>
        </div>
      </div>
    </div>
  );
};
