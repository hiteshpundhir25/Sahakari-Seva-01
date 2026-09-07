// ==============================================================================
// MOBILE LOCATION SERVICE — GPS PERMISSION LIFECYCLE & FALLBACKS
// ==============================================================================

import * as Location from 'expo-location';
import { LocationPermissionState } from '../types';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  areaName?: string;
}

export const FALLBACK_AREAS: { name: string; city: string; pincode: string; latitude: number; longitude: number }[] = [
  { name: 'C-Scheme & MI Road (Jaipur)', city: 'Jaipur', pincode: '302001', latitude: 26.9017, longitude: 75.7925 },
  { name: 'Malviya Nagar (Jaipur)', city: 'Jaipur', pincode: '302017', latitude: 26.8560, longitude: 75.8180 },
  { name: 'Vaishali Nagar (Jaipur)', city: 'Jaipur', pincode: '302021', latitude: 26.9115, longitude: 75.7390 },
  { name: 'Mansarovar (Jaipur)', city: 'Jaipur', pincode: '302020', latitude: 26.8560, longitude: 75.7645 },
  { name: 'Sanganer (Jaipur)', city: 'Jaipur', pincode: '302029', latitude: 26.8236, longitude: 75.7845 },
  { name: 'Vidhyadhar Nagar (Jaipur)', city: 'Jaipur', pincode: '302039', latitude: 26.9830, longitude: 75.7810 }
];

export class MobileLocationService {
  public static defaultLocation: LocationCoordinates = {
    latitude: 26.9017,
    longitude: 75.7925,
    accuracy: 10.0,
    areaName: 'C-Scheme, Jaipur (302001)'
  };

  /**
   * Request GPS permission and acquire current position using expo-location.
   * If the permission prompt never resolves (e.g. web preview iframes, or a
   * user who ignores the OS dialog), fall back to the default C-Scheme,
   * Jaipur coordinates after a short timeout so screens never hang.
   */
  public static async requestCurrentPosition(): Promise<{
    state: LocationPermissionState;
    coords: LocationCoordinates;
    errorMsg?: string;
  }> {
    const fallback = (msg: string) => ({
      state: 'manual_fallback' as LocationPermissionState,
      coords: this.defaultLocation,
      errorMsg: msg
    });

    const acquire = async () => {
      // First attempt native expo-location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          state: 'denied' as LocationPermissionState,
          coords: this.defaultLocation,
          errorMsg: 'GPS permission denied. Using C-Scheme Jaipur default.'
        };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      return {
        state: 'granted' as LocationPermissionState,
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 10,
          areaName: 'Current GPS Location'
        }
      };
    };

    try {
      // Race the real acquisition against a 4s timeout so a hanging
      // permission prompt can never freeze the UI.
      return await Promise.race([
        acquire(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Location request timed out. Using default location.')), 4000)
        )
      ]);
    } catch (err: any) {
      console.log('[LocationService] Using default location fallback:', err.message);
      return fallback(err.message);
    }
  }

  /**
   * Calculate Haversine distance in client (km)
   */
  public static calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371.0;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}
