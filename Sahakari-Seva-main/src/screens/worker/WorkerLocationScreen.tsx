// ==============================================================================
// WORKER LOCATION & LIVE JOB RADAR SCREEN
// Expanded interactive map canvas showing:
// - Simple clean dots: Red (Emergency), Green (Committed), Yellow (Live), Blue (Active)
// - Operating radius selector pills (5km, 10km, 15km, 20km)
// - Decluttered, spacious, compact bottom navigation sheet to maximize map visibility
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  DeviceEventEmitter,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { MobileLocationService } from '../../services/locationService';
import {
  WorkerMapService,
  JAIPUR_DEMAND_HOTSPOTS,
  DemandHotspot,
} from '../../services/workerMapService';
import { WorkerJobsMapView } from '../../components/map/WorkerJobsMapView';
import { Booking } from '../../types';
import {
  Navigation,
  Crosshair,
  Layers,
  X,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

type MapFilter = 'all' | 'in_progress' | 'accepted' | 'pending' | 'hotspots';

export const WorkerLocationScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: false });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Worker GPS coordinates (default: Jaipur C-Scheme hub)
  const [currentLat, setCurrentLat] = useState(26.9017);
  const [currentLng, setCurrentLng] = useState(75.7925);
  const [serviceRadius, setServiceRadius] = useState(15);
  const [syncing, setSyncing] = useState(false);

  // Jobs data
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [activeFilter, setActiveFilter] = useState<MapFilter>('all');

  // Selected item for bottom navigation sheet
  const [selectedJob, setSelectedJob] = useState<Booking | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<DemandHotspot | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Load all worker jobs
  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const data = await ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001');
      setJobs(data);

      // Default select the in-progress or first accepted/emergency job
      const inProg = data.find((b) => b.status === 'in_progress');
      const emergency = data.find((b) => b.is_emergency);
      const accepted = data.find((b) => b.status === 'accepted');
      const pending = data.find((b) => b.status === 'pending');
      setSelectedJob(inProg || emergency || accepted || pending || null);
    } catch (err) {
      console.warn('Failed to load jobs for worker map:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      loadJobs();
    });
    return () => {
      sub.remove();
    };
  }, []);

  // Sync device GPS position
  const handleSyncGPS = async () => {
    setSyncing(true);
    try {
      const loc = await MobileLocationService.requestCurrentPosition();
      setCurrentLat(loc.coords.latitude);
      setCurrentLng(loc.coords.longitude);

      await ApiClient.updateWorkerLocation(
        'w0000000-0000-0000-0000-000000000001',
        loc.coords.latitude,
        loc.coords.longitude,
        serviceRadius
      );
    } catch (err: any) {
      console.warn('GPS sync error:', err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Change service radius
  const handleRadiusSelect = async (radiusKm: number) => {
    setServiceRadius(radiusKm);
    try {
      await ApiClient.updateWorkerLocation(
        'w0000000-0000-0000-0000-000000000001',
        currentLat,
        currentLng,
        radiusKm
      );
    } catch (err) {
      console.warn('Radius update error:', err);
    }
  };

  // Selection handlers
  const handleJobSelect = (job: Booking) => {
    setSelectedHotspot(null);
    setSelectedJob(job);
  };

  const handleHotspotSelect = (hotspot: DemandHotspot) => {
    setSelectedJob(null);
    setSelectedHotspot(hotspot);
  };

  // Filter counts
  const inProgressJob = useMemo(() => jobs.find((b) => b.status === 'in_progress'), [jobs]);
  const acceptedJobs = useMemo(() => jobs.filter((b) => b.status === 'accepted'), [jobs]);
  const pendingJobs = useMemo(() => jobs.filter((b) => b.status === 'pending'), [jobs]);

  // Selected job coordinates & navigation calculations
  const selectedJobDetails = useMemo(() => {
    if (!selectedJob) return null;
    const coords = WorkerMapService.resolveBookingCoordinates(selectedJob);
    const nav = WorkerMapService.calculateDistanceAndETA(
      currentLat,
      currentLng,
      coords.latitude,
      coords.longitude
    );
    return {
      coords,
      distanceKm: nav.distanceKm,
      etaMinutes: nav.etaMinutes,
      formattedText: nav.formattedText,
    };
  }, [selectedJob, currentLat, currentLng]);

  // Selected hotspot coordinates & navigation calculations
  const selectedHotspotDetails = useMemo(() => {
    if (!selectedHotspot) return null;
    const nav = WorkerMapService.calculateDistanceAndETA(
      currentLat,
      currentLng,
      selectedHotspot.latitude,
      selectedHotspot.longitude
    );
    return {
      distanceKm: nav.distanceKm,
      etaMinutes: nav.etaMinutes,
      formattedText: nav.formattedText,
    };
  }, [selectedHotspot, currentLat, currentLng]);

  // Open external turn-by-turn navigation in Google Maps
  const handleStartNavigation = () => {
    if (selectedJob && selectedJobDetails) {
      WorkerMapService.openTurnByTurnNavigation(
        selectedJobDetails.coords.latitude,
        selectedJobDetails.coords.longitude,
        `${selectedJob.booking_code} - ${selectedJob.address}`
      );
    } else if (selectedHotspot && selectedHotspotDetails) {
      WorkerMapService.openTurnByTurnNavigation(
        selectedHotspot.latitude,
        selectedHotspot.longitude,
        selectedHotspot.name
      );
    }
  };

  // View full job ticket
  const handleOpenJobTicket = () => {
    if (selectedJob && navigation?.navigate) {
      navigation.navigate('WorkerJobDetail', { bookingId: selectedJob.id, job: selectedJob });
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Live Job Radar & Map"
        subtitle="Active work routes, committed jobs & live demand"
        showBack={true}
        onBack={handleBack}
      />

      {/* Top Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              All Pins ({jobs.length})
            </Text>
          </TouchableOpacity>

          {inProgressJob && (
            <TouchableOpacity
              style={[
                styles.filterChip,
                styles.filterChipInProgress,
                activeFilter === 'in_progress' && styles.filterChipInProgressActive,
              ]}
              onPress={() => {
                setActiveFilter('in_progress');
                setSelectedJob(inProgressJob);
                setSelectedHotspot(null);
              }}
            >
              <View style={[styles.dotIndicator, { backgroundColor: '#2563eb' }]} />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'in_progress' && styles.filterChipTextActive,
                ]}
              >
                In Progress (1)
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.filterChipCommitted,
              activeFilter === 'accepted' && styles.filterChipCommittedActive,
            ]}
            onPress={() => setActiveFilter('accepted')}
          >
            <View style={[styles.dotIndicator, { backgroundColor: '#10b981' }]} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'accepted' && styles.filterChipTextActive,
              ]}
            >
              Committed ({acceptedJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.filterChipPending,
              activeFilter === 'pending' && styles.filterChipPendingActive,
            ]}
            onPress={() => setActiveFilter('pending')}
          >
            <View style={[styles.dotIndicator, { backgroundColor: '#f59e0b' }]} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'pending' && styles.filterChipTextActive,
              ]}
            >
              Live Requests ({pendingJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.filterChipHotspots,
              activeFilter === 'hotspots' && styles.filterChipHotspotsActive,
            ]}
            onPress={() => setActiveFilter('hotspots')}
          >
            <View style={[styles.dotIndicator, { backgroundColor: '#8b5cf6' }]} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'hotspots' && styles.filterChipTextActive,
              ]}
            >
              Hotspots ({JAIPUR_DEMAND_HOTSPOTS.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Expanded Map Canvas Container */}
      <View style={styles.mapContainer}>
        <WorkerJobsMapView
          workerLocation={{ latitude: currentLat, longitude: currentLng }}
          serviceRadiusKm={serviceRadius}
          jobs={jobs}
          demandHotspots={JAIPUR_DEMAND_HOTSPOTS}
          selectedJobId={selectedJob?.id}
          selectedHotspotId={selectedHotspot?.id}
          filter={activeFilter}
          onSelectJob={handleJobSelect}
          onSelectHotspot={handleHotspotSelect}
        />

        {/* Floating Radius Quick Selector Pills (Kept on map as requested) */}
        <View style={styles.floatingRadiusBar}>
          <Text style={styles.radiusLabel}>Radius:</Text>
          {[5, 10, 15, 20].map((km) => (
            <TouchableOpacity
              key={km}
              style={[styles.radiusPill, serviceRadius === km && styles.radiusPillActive]}
              onPress={() => handleRadiusSelect(km)}
            >
              <Text
                style={[styles.radiusPillText, serviceRadius === km && styles.radiusPillTextActive]}
              >
                {km}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floating Actions: GPS Recenter & Legend */}
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={styles.floatingBtn}
            onPress={handleSyncGPS}
            disabled={syncing}
            activeOpacity={0.8}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Crosshair size={18} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.floatingBtn, showLegend && styles.floatingBtnActive]}
            onPress={() => setShowLegend((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Layers size={18} color={showLegend ? '#fff' : colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Map Legend Overlay */}
        {showLegend && (
          <View style={styles.legendOverlay}>
            <View style={styles.legendHeader}>
              <Text style={styles.legendTitle}>Map Legend (Dots)</Text>
              <TouchableOpacity onPress={() => setShowLegend(false)}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.legendText}>Blue: Active Job (Route line)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Green: Committed Job</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Yellow: Live Pending Request</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Red: Emergency Request</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
              <Text style={styles.legendText}>Purple: Demand Hotspot Area</Text>
            </View>
          </View>
        )}
      </View>

      {/* ========================================================================= */}
      {/* DECLUTTERED, SPACIOUS, COMPACT BOTTOM CARD (MAXIMIZES MAP VISIBILITY) */}
      {/* ========================================================================= */}
      {selectedJob && selectedJobDetails && (
        <View style={styles.compactCalloutCard}>
          {/* Top Line: Dot + Status + Code + Fare */}
          <View style={styles.compactRowTop}>
            <View style={styles.compactLeft}>
              <View
                style={[
                  styles.statusDot,
                  selectedJob.is_emergency
                    ? { backgroundColor: '#ef4444' }
                    : selectedJob.status === 'in_progress'
                    ? { backgroundColor: '#2563eb' }
                    : selectedJob.status === 'accepted'
                    ? { backgroundColor: '#10b981' }
                    : { backgroundColor: '#f59e0b' },
                ]}
              />
              <Text style={styles.compactStatusText}>
                {selectedJob.is_emergency
                  ? 'Emergency'
                  : selectedJob.status === 'in_progress'
                  ? 'Active Job'
                  : selectedJob.status === 'accepted'
                  ? `Committed (${selectedJob.booking_time})`
                  : 'Live Request'}
              </Text>
              <Text style={styles.compactCode}>{selectedJob.booking_code}</Text>
            </View>

            <Text style={styles.compactPrice}>₹{selectedJob.final_amount}</Text>
          </View>

          {/* Middle Line: Customer, Address & Distance */}
          <View style={styles.compactRowMiddle}>
            <Text style={styles.compactAddress} numberOfLines={1}>
              {selectedJob.customer?.full_name || 'Customer'} • {selectedJob.address}
            </Text>
            <Text style={styles.compactDistance}>
              {selectedJobDetails.distanceKm} km • ~{selectedJobDetails.etaMinutes}m
            </Text>
          </View>

          {/* Action Line: Compact Navigation CTA & Details */}
          <View style={styles.compactRowActions}>
            <TouchableOpacity
              style={styles.compactNavBtn}
              onPress={handleStartNavigation}
              activeOpacity={0.82}
            >
              <Navigation size={13} color="#ffffff" />
              <Text style={styles.compactNavBtnText}>Navigate in Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.compactDetailsBtn}
              onPress={handleOpenJobTicket}
              activeOpacity={0.78}
            >
              <Text style={styles.compactDetailsBtnText}>Details</Text>
              <ArrowRight size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Compact Hotspot Card */}
      {selectedHotspot && selectedHotspotDetails && (
        <View style={styles.compactCalloutCard}>
          <View style={styles.compactRowTop}>
            <View style={styles.compactLeft}>
              <View style={[styles.statusDot, { backgroundColor: '#8b5cf6' }]} />
              <Text style={styles.compactStatusText}>Demand Hotspot</Text>
              <Text style={styles.compactCode}>{selectedHotspot.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedHotspot(null)}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.compactRowMiddle}>
            <Text style={styles.compactAddress} numberOfLines={1}>
              📍 {selectedHotspot.area} • {selectedHotspot.activeRequestsCount} live inquiries
            </Text>
            <Text style={styles.compactDistance}>
              {selectedHotspotDetails.distanceKm} km • ~{selectedHotspotDetails.etaMinutes}m
            </Text>
          </View>

          <View style={styles.compactRowActions}>
            <TouchableOpacity
              style={[styles.compactNavBtn, { backgroundColor: '#7c3aed' }]}
              onPress={handleStartNavigation}
              activeOpacity={0.82}
            >
              <Navigation size={13} color="#ffffff" />
              <Text style={styles.compactNavBtnText}>Navigate to Area</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    filterBar: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 7,
    },
    filterScroll: {
      paddingHorizontal: 12,
      gap: 7,
      alignItems: 'center',
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#ffffff',
    },
    filterChipInProgress: {
      backgroundColor: isDark ? '#172554' : '#eff6ff',
      borderColor: isDark ? '#1d4ed8' : '#bfdbfe',
    },
    filterChipInProgressActive: {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
    },
    filterChipCommitted: {
      backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
      borderColor: isDark ? '#059669' : '#a7f3d0',
    },
    filterChipCommittedActive: {
      backgroundColor: '#059669',
      borderColor: '#059669',
    },
    filterChipPending: {
      backgroundColor: isDark ? '#451a03' : '#fffbeb',
      borderColor: isDark ? '#b45309' : '#fde68a',
    },
    filterChipPendingActive: {
      backgroundColor: '#d97706',
      borderColor: '#d97706',
    },
    filterChipHotspots: {
      backgroundColor: isDark ? '#2e1065' : '#f5f3ff',
      borderColor: isDark ? '#6d28d9' : '#ddd6fe',
    },
    filterChipHotspotsActive: {
      backgroundColor: '#7c3aed',
      borderColor: '#7c3aed',
    },
    dotIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    floatingRadiusBar: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      gap: 5,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    radiusLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textMuted,
      marginRight: 2,
    },
    radiusPill: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    radiusPillActive: {
      backgroundColor: colors.primary,
    },
    radiusPillText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    radiusPillTextActive: {
      color: '#ffffff',
    },
    floatingActions: {
      position: 'absolute',
      top: 10,
      right: 10,
      flexDirection: 'column',
      gap: 6,
    },
    floatingBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    floatingBtnActive: {
      backgroundColor: colors.primary,
    },
    legendOverlay: {
      position: 'absolute',
      top: 52,
      right: 10,
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
      width: 220,
      zIndex: 20,
    },
    legendHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 4,
    },
    legendTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginVertical: 3,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 10.5,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Compact Decluttered Bottom Card
    compactCalloutCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 20 : 10,
      borderTopWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 6,
    },
    compactRowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    compactLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    compactStatusText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    compactCode: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    compactPrice: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    compactRowMiddle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    compactAddress: {
      fontSize: 11,
      color: colors.textSecondary,
      flex: 1,
      marginRight: 8,
    },
    compactDistance: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    compactRowActions: {
      flexDirection: 'row',
      gap: 8,
    },
    compactNavBtn: {
      flex: 1.6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#2563eb',
      paddingVertical: 8,
      borderRadius: 9,
    },
    compactNavBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#ffffff',
    },
    compactDetailsBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      paddingVertical: 8,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactDetailsBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });