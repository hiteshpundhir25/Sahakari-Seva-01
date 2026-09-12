// ==============================================================================
// WORKER MAP SERVICE — GEO-RESOLUTION, LIVE DEMAND RADAR & NAVIGATION
// Provides coordinate resolution for bookings, calculates driving ETA, defines
// live demand hotspot clusters in Jaipur, and launches turn-by-turn navigation.
// ==============================================================================

import { Linking, Platform } from 'react-native';
import { Booking } from '../types';
import { MobileLocationService } from './locationService';

export interface DemandHotspot {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  activeRequestsCount: number;
  surgeLabel: string;
  surgeMultiplier: number;
  averageRate: number;
  description: string;
}

// Known Jaipur geographic coordinates reference
export const JAIPUR_AREAS: { [key: string]: { lat: number; lng: number } } = {
  'c-scheme': { lat: 26.9017, lng: 75.7925 },
  'mi road': { lat: 26.9180, lng: 75.8050 },
  'malviya nagar': { lat: 26.8560, lng: 75.8180 },
  'mansarovar': { lat: 26.8560, lng: 75.7645 },
  'vaishali nagar': { lat: 26.9115, lng: 75.7390 },
  'vidhyadhar nagar': { lat: 26.9830, lng: 75.7810 },
  'jagatpura': { lat: 26.8280, lng: 75.8360 },
  'sanganer': { lat: 26.8236, lng: 75.7845 },
  'raja park': { lat: 26.8920, lng: 75.8270 },
  'tonk road': { lat: 26.8750, lng: 75.8050 },
  'bani park': { lat: 26.9300, lng: 75.7900 },
};

// Live demand hotspot clusters (simulating live customer activity and surge zones like Blinkit/Swiggy/Uber)
export const JAIPUR_DEMAND_HOTSPOTS: DemandHotspot[] = [
  {
    id: 'hotspot-vaishali',
    name: 'Vaishali Nagar High-Demand Hub',
    area: 'Vaishali Nagar, Sector 3',
    latitude: 26.9115,
    longitude: 75.7390,
    activeRequestsCount: 5,
    surgeLabel: '🔥 High Demand Area',
    surgeMultiplier: 1.15,
    averageRate: 350,
    description: '5 active households looking for electrical & plumbing support in Vaishali Nagar.',
  },
  {
    id: 'hotspot-malviya',
    name: 'Malviya Nagar Commercial Cluster',
    area: 'Malviya Nagar, Block B',
    latitude: 26.8560,
    longitude: 75.8180,
    activeRequestsCount: 4,
    surgeLabel: '⚡ Surge Zone (+20%)',
    surgeMultiplier: 1.2,
    averageRate: 400,
    description: 'High booking density near Gaurav Tower. 100% direct cooperative payouts apply.',
  },
  {
    id: 'hotspot-mansarovar',
    name: 'Mansarovar Metro Corridor',
    area: 'Mansarovar, Sector 7',
    latitude: 26.8560,
    longitude: 75.7645,
    activeRequestsCount: 3,
    surgeLabel: '📈 Live Inquiries',
    surgeMultiplier: 1.1,
    averageRate: 320,
    description: '3 pending requests within 2 km radius. Immediate response recommended.',
  },
  {
    id: 'hotspot-jagatpura',
    name: 'Jagatpura New Residential Belt',
    area: 'Jagatpura, Plot 21 Zone',
    latitude: 26.8280,
    longitude: 75.8360,
    activeRequestsCount: 3,
    surgeLabel: '⚡ Active Requests',
    surgeMultiplier: 1.1,
    averageRate: 450,
    description: 'New residential apartments seeking wiring and appliance fittings.',
  },
];

export class WorkerMapService {
  /**
   * Resolves coordinates for any booking with deterministic jitter so multiple
   * pins in the same neighborhood do not stack directly on top of each other.
   */
  public static resolveBookingCoordinates(booking: Booking): { latitude: number; longitude: number } {
    if (booking.latitude && booking.longitude) {
      return { latitude: booking.latitude, longitude: booking.longitude };
    }

    const text = `${booking.address} ${booking.city} ${booking.pincode}`.toLowerCase();
    let base = { lat: 26.9017, lng: 75.7925 }; // Default C-Scheme

    for (const [key, coords] of Object.entries(JAIPUR_AREAS)) {
      if (text.includes(key)) {
        base = coords;
        break;
      }
    }

    // Deterministic jitter based on booking id hash so pins don't overlap completely
    let hash = 0;
    const str = booking.id || booking.booking_code || '0';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const latOffset = ((Math.abs(hash) % 100) - 50) * 0.00012;
    const lngOffset = ((Math.abs(hash >> 3) % 100) - 50) * 0.00012;

    return {
      latitude: Number((base.lat + latOffset).toFixed(5)),
      longitude: Number((base.lng + lngOffset).toFixed(5)),
    };
  }

  /**
   * Calculates Haversine distance in km and estimated drive time in minutes.
   */
  public static calculateDistanceAndETA(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): { distanceKm: number; etaMinutes: number; formattedText: string } {
    const distanceKm = Number(
      MobileLocationService.calculateHaversineDistance(fromLat, fromLng, toLat, toLng).toFixed(1)
    );

    // City traffic calculation: average 24 km/h speed in Jaipur + 2 mins pickup buffer
    const travelTime = Math.ceil((distanceKm / 24) * 60) + 2;
    const etaMinutes = Math.max(3, travelTime);

    const formattedText = `${distanceKm} km • ~${etaMinutes} mins drive`;

    return { distanceKm, etaMinutes, formattedText };
  }

  /**
   * Launches native GPS turn-by-turn navigation directly in Google Maps / Apple Maps.
   */
  public static openTurnByTurnNavigation(lat: number, lng: number, label?: string): void {
    const encodedLabel = encodeURIComponent(label || 'Job Location');
    let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    if (Platform.OS === 'ios') {
      url = `maps://?daddr=${lat},${lng}&q=${encodedLabel}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to standard web Google Maps
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      });
  }
}
