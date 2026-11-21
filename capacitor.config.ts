import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.bussync.app',
  appName: 'BusSync',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Background Geolocation & Foreground Service for Android
    BackgroundGeolocation: {
      locationProvider: 'ANDROID_DISTANCE_FILTER_PROVIDER',
      desiredAccuracy: 'HIGH_ACCURACY',
      stationaryRadius: 15,
      distanceFilter: 10,
      notificationTitle: 'BusSync Driver Trip in Progress',
      notificationText: 'Live location tracking is actively transmitting to students.',
      notificationIconColor: '#f59e0b',
      interval: 5000,
      fastestInterval: 3000,
      activitiesInterval: 10000,
      stopOnTerminate: false,
      startOnBoot: false
    }
  }
};

export default config;

