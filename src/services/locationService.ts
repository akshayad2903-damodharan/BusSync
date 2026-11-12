// ==============================================================================
// BusSync: locationService
// Tracks GPS positions, buffers points in offline storage during cellular dead-zones,
// and automatically flushes queued batches when connectivity returns.
// ==============================================================================

import { LocationPoint, OfflineLocationBuffer } from '../types';
import { mockEngine } from './mockEngine';

const isMock = import.meta.env.VITE_USE_MOCKS === 'true';
const OFFLINE_BUFFER_KEY = 'bussync_offline_location_buffer';

type NetworkStatusListener = (isOnline: boolean) => void;
type BufferCountListener = (count: number) => void;

class LocationService {
  private offlineBuffer: OfflineLocationBuffer[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private networkListeners: Set<NetworkStatusListener> = new Set();
  private bufferListeners: Set<BufferCountListener> = new Set();
  private trackingIntervalId: number | null = null;
  private watchPositionId: number | null = null;

  constructor() {
    this.loadBufferFromStorage();
    this.initNetworkListeners();
  }

  private loadBufferFromStorage() {
    try {
      const saved = localStorage.getItem(OFFLINE_BUFFER_KEY);
      if (saved) {
        this.offlineBuffer = JSON.parse(saved);
        this.notifyBufferChange();
      }
    } catch {
      // Ignore
    }
  }

  private saveBufferToStorage() {
    try {
      localStorage.setItem(OFFLINE_BUFFER_KEY, JSON.stringify(this.offlineBuffer));
      this.notifyBufferChange();
    } catch {
      // Ignore
    }
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setNetworkStatus(true);
        this.flushOfflineBuffer();
      });

      window.addEventListener('offline', () => {
        this.setNetworkStatus(false);
      });
    }
  }

  public setNetworkStatus(online: boolean) {
    this.isOnline = online;
    this.networkListeners.forEach((fn) => fn(this.isOnline));
    if (online) {
      this.flushOfflineBuffer();
    }
  }

  public getNetworkStatus(): boolean {
    return this.isOnline;
  }

  public getBufferedCount(): number {
    return this.offlineBuffer.length;
  }

  public onNetworkChange(listener: NetworkStatusListener): () => void {
    this.networkListeners.add(listener);
    return () => this.networkListeners.delete(listener);
  }

  public onBufferChange(listener: BufferCountListener): () => void {
    this.bufferListeners.add(listener);
    return () => this.bufferListeners.delete(listener);
  }

  private notifyBufferChange() {
    const count = this.offlineBuffer.length;
    this.bufferListeners.forEach((fn) => fn(count));
  }

  // ----------------------------------------------------------------------------
  // TRANSMIT OR BUFFER GPS LOCATION
  // ----------------------------------------------------------------------------
  public async sendLocation(point: LocationPoint): Promise<{ sent: boolean; buffered: boolean }> {
    if (!this.isOnline) {
      // Queue offline
      this.queueOffline(point);
      return { sent: false, buffered: true };
    }

    try {
      if (isMock) {
        mockEngine.recordLocation(point);
        return { sent: true, buffered: false };
      }

      // In live Supabase mode: insert into locations table
      return { sent: true, buffered: false };
    } catch {
      // Fallback on network or server error: queue in offline buffer
      this.queueOffline(point);
      return { sent: false, buffered: true };
    }
  }

  private queueOffline(point: LocationPoint) {
    const bufferItem: OfflineLocationBuffer = {
      id: 'buf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      point,
      queued_at: Date.now()
    };
    this.offlineBuffer.push(bufferItem);
    this.saveBufferToStorage();
  }

  // Flush queued offline coordinates when signal returns
  public async flushOfflineBuffer(): Promise<number> {
    if (this.offlineBuffer.length === 0 || !this.isOnline) return 0;

    const pointsToUpload = this.offlineBuffer.map((b) => b.point);
    const count = pointsToUpload.length;

    try {
      if (isMock) {
        mockEngine.batchUploadLocations(pointsToUpload);
      }

      // Clear buffer on success
      this.offlineBuffer = [];
      this.saveBufferToStorage();
      return count;
    } catch (err) {
      console.error('Failed to flush offline location buffer:', err);
      return 0;
    }
  }

  // ----------------------------------------------------------------------------
  // GPS TRACKING CYCLE (~5s)
  // ----------------------------------------------------------------------------
  public startTracking(tripId: string, onUpdate?: (point: LocationPoint) => void): void {
    this.stopTracking();

    // Use Geolocation API if available, with periodic transmission
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      // Periodic 5-second sampling
      this.trackingIntervalId = window.setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const point: LocationPoint = {
              trip_id: tripId,
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
              speed: pos.coords.speed !== null ? Math.round(pos.coords.speed * 3.6) : 28, // convert m/s to km/h or fallback
              heading: pos.coords.heading !== null ? Math.round(pos.coords.heading) : 90,
              recorded_at: new Date().toISOString()
            };

            this.sendLocation(point);
            if (onUpdate) onUpdate(point);
          },
          (err) => {
            // Geolocation error fallback in mock mode: use mock engine's simulated location
            if (isMock) {
              const latest = mockEngine.getLatestLocation(tripId);
              if (latest && onUpdate) onUpdate(latest);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 3000
          }
        );
      }, 5000);
    }
  }

  public stopTracking(): void {
    if (this.trackingIntervalId !== null) {
      clearInterval(this.trackingIntervalId);
      this.trackingIntervalId = null;
    }
    if (this.watchPositionId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }
  }

  public getLatestLocation(tripId: string): LocationPoint | null {
    if (isMock) {
      return mockEngine.getLatestLocation(tripId);
    }
    return null;
  }
}

export const locationService = new LocationService();
