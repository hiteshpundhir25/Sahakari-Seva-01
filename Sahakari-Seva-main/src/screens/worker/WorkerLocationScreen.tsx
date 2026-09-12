// ==============================================================================
// WORKER LOCATION & LIVE JOB RADAR SCREEN
// Interactive map showing:
// 1. Worker GPS location & adjustable service radius (5, 10, 15, 20 km)
// 2. Currently going in-progress job with route line & ETA
// 3. Currently committed scheduled jobs
// 4. Blinking live job requests & emergency alerts (delivery app radar style)
// 5. Live demand hotspot zones with 1-tap Google Maps turn-by-turn navigation
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
  MapPin,
  Navigation,
  Compass,
  Crosshair,
  Clock,
  ExternalLink,
  Zap,
  Calendar,
  Layers,
  X,
  AlertCircle,
  Flame,
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
  const [lastSyncTime, setLastSyncTime] = useState('Today at 10:00 AM');

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

      // Default select the in-progress or first accepted job for immediate navigation CTA
      const inProg = data.find((b) => b.status === 'in_progress');
      const accepted = data.find((b) => b.status === 'accepted');
      const pending = data.find((b) => b.status === 'pending');
      setSelectedJob(inProg || accepted || pending || null);
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

      const now = new Date();
      setLastSyncTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    const workerWage = (selectedJob.final_amount * 0.85).toFixed(2);

    return {
      coords,
      distanceKm: nav.distanceKm,
      etaMinutes: nav.etaMinutes,
      formattedText: nav.formattedText,
      workerWage,
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
              <View style={styles.pulseDotBlue} />
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
            <Calendar size={12} color={activeFilter === 'accepted' ? '#fff' : '#059669'} />
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
            <View style={styles.pulseDotAmber} />
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
            <Flame size={12} color={activeFilter === 'hotspots' ? '#fff' : '#7c3aed'} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'hotspots' && styles.filterChipTextActive,
              ]}
            >
              Demand Hotspots ({JAIPUR_DEMAND_HOTSPOTS.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map Tile Canvas Container */}
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

        {/* Floating Radius Quick Selector Pills */}
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

        {/* Floating Action Buttons: GPS Recenter & Map Legend */}
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
              <Text style={styles.legendTitle}>Map Legend & Visual Indicators</Text>
              <TouchableOpacity onPress={() => setShowLegend(false)}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0284c7' }]} />
              <Text style={styles.legendText}>You (Worker Dispatch Origin)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.legendText}>In-Progress Job (Route Guide Line)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.legendText}>Committed Scheduled Appointment</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Live Request (Blinking Radar Ring)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.legendText}>Emergency Request (Rapid Flashing)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#7c3aed' }]} />
              <Text style={styles.legendText}>High-Demand Hotspot Area</Text>
            </View>
          </View>
        )}
      </View>

      {/* Interactive Bottom Callout Sheet (Navigation & Action) */}
      {selectedJob && selectedJobDetails && (
        <View style={styles.calloutCard}>
          {/* Top Status & Price Row */}
          <View style={styles.calloutTopRow}>
            <View style={styles.statusBadgeRow}>
              {selectedJob.status === 'in_progress' && (
                <View style={[styles.statusBadge, styles.statusBadgeInProgress]}>
                  <Zap size={12} color="#1e40af" />
                  <Text style={styles.statusBadgeTextInProgress}>ACTIVE WORK NOW</Text>
                </View>
              )}
              {selectedJob.status === 'accepted' && (
                <View style={[styles.statusBadge, styles.statusBadgeAccepted]}>
                  <Calendar size={12} color="#065f46" />
                  <Text style={styles.statusBadgeTextAccepted}>
                    COMMITTED • {selectedJob.booking_time}
                  </Text>
                </View>
              )}
              {selectedJob.status === 'pending' && !selectedJob.is_emergency && (
                <View style={[styles.statusBadge, styles.statusBadgePending]}>
                  <View style={styles.pulseDotAmberSmall} />
                  <Text style={styles.statusBadgeTextPending}>LIVE REQUEST</Text>
                </View>
              )}
              {selectedJob.is_emergency && (
                <View style={[styles.statusBadge, styles.statusBadgeEmergency]}>
                  <AlertCircle size={12} color="#991b1b" />
                  <Text style={styles.statusBadgeTextEmergency}>EMERGENCY ⚡</Text>
                </View>
              )}
              <Text style={styles.bookingCodeText}>{selectedJob.booking_code}</Text>
            </View>

            <View style={styles.fareContainer}>
              <Text style={styles.fareAmount}>₹{selectedJob.final_amount}</Text>
              <Text style={styles.fareSubText}>₹{selectedJobDetails.workerWage} net (85%)</Text>
            </View>
          </View>

          {/* Job Description & Customer Info */}
          <View style={styles.jobInfoSection}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {selectedJob.service_category?.name || 'Home Service'} —{' '}
              {selectedJob.customer?.full_name || 'Customer'}
            </Text>
            <Text style={styles.jobAddress} numberOfLines={1}>
              📍 {selectedJob.address}, {selectedJob.city}
            </Text>
            <Text style={styles.jobDescription} numberOfLines={2}>
              {selectedJob.service_description}
            </Text>
          </View>

          {/* Metrics Pill Row: Distance & Driving ETA */}
          <View style={styles.navMetricsRow}>
            <View style={styles.navMetricItem}>
              <Navigation size={13} color={colors.primary} />
              <Text style={styles.navMetricValue}>{selectedJobDetails.distanceKm} km</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.navMetricItem}>
              <Clock size={13} color="#059669" />
              <Text style={styles.navMetricValue}>~{selectedJobDetails.etaMinutes} mins drive</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.navMetricItem}>
              <MapPin size={13} color="#d97706" />
              <Text style={styles.navMetricValue}>{selectedJob.city} (302001)</Text>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.navigateBtn}
              onPress={handleStartNavigation}
              activeOpacity={0.82}
            >
              <Navigation size={16} color="#ffffff" />
              <Text style={styles.navigateBtnText}>Start Navigation (Google Maps)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={handleOpenJobTicket}
              activeOpacity={0.78}
            >
              <Text style={styles.detailsBtnText}>View Ticket</Text>
              <ArrowRight size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Sheet for Demand Hotspot Selection */}
      {selectedHotspot && selectedHotspotDetails && (
        <View style={styles.calloutCard}>
          <View style={styles.calloutTopRow}>
            <View style={[styles.statusBadge, styles.statusBadgeHotspot]}>
              <Flame size={13} color="#6d28d9" />
              <Text style={styles.statusBadgeTextHotspot}>HIGH-DEMAND SERVICE CLUSTER</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedHotspot(null)}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.jobInfoSection}>
            <Text style={styles.jobTitle}>{selectedHotspot.name}</Text>
            <Text style={styles.jobAddress}>📍 {selectedHotspot.area}</Text>
            <Text style={styles.jobDescription}>{selectedHotspot.description}</Text>
          </View>

          <View style={styles.navMetricsRow}>
            <View style={styles.navMetricItem}>
              <Navigation size={13} color={colors.primary} />
              <Text style={styles.navMetricValue}>{selectedHotspotDetails.distanceKm} km</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.navMetricItem}>
              <Clock size={13} color="#059669" />
              <Text style={styles.navMetricValue}>~{selectedHotspotDetails.etaMinutes} mins</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.navMetricItem}>
              <Flame size={13} color="#d97706" />
              <Text style={styles.navMetricValue}>
                {selectedHotspot.activeRequestsCount} Live Inquiries
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.navigateBtn, { backgroundColor: '#7c3aed' }]}
              onPress={handleStartNavigation}
              activeOpacity={0.82}
            >
              <Navigation size={16} color="#ffffff" />
              <Text style={styles.navigateBtnText}>Navigate to Service Area</Text>
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
      paddingVertical: 8,
    },
    filterScroll: {
      paddingHorizontal: 12,
      gap: 8,
      alignItems: 'center',
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 12,
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
    pulseDotBlue: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#2563eb',
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
    pulseDotAmber: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#f59e0b',
    },
    filterChipHotspots: {
      backgroundColor: isDark ? '#2e1065' : '#f5f3ff',
      borderColor: isDark ? '#6d28d9' : '#ddd6fe',
    },
    filterChipHotspotsActive: {
      backgroundColor: '#7c3aed',
      borderColor: '#7c3aed',
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    floatingRadiusBar: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 24,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    radiusLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      marginRight: 2,
    },
    radiusPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    radiusPillActive: {
      backgroundColor: colors.primary,
    },
    radiusPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    radiusPillTextActive: {
      color: '#ffffff',
    },
    floatingActions: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'column',
      gap: 8,
    },
    floatingBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
    },
    floatingBtnActive: {
      backgroundColor: colors.primary,
    },
    legendOverlay: {
      position: 'absolute',
      top: 60,
      right: 12,
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 6,
      width: 250,
      zIndex: 20,
    },
    legendHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 6,
    },
    legendTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: 4,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    calloutCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      borderTopWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 8,
    },
    calloutTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statusBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusBadgeInProgress: {
      backgroundColor: '#dbeafe',
      borderWidth: 1,
      borderColor: '#93c5fd',
    },
    statusBadgeTextInProgress: {
      fontSize: 10,
      fontWeight: '800',
      color: '#1e40af',
    },
    statusBadgeAccepted: {
      backgroundColor: '#d1fae5',
      borderWidth: 1,
      borderColor: '#6ee7b7',
    },
    statusBadgeTextAccepted: {
      fontSize: 10,
      fontWeight: '800',
      color: '#065f46',
    },
    statusBadgePending: {
      backgroundColor: '#fef3c7',
      borderWidth: 1,
      borderColor: '#fde68a',
    },
    statusBadgeTextPending: {
      fontSize: 10,
      fontWeight: '800',
      color: '#92400e',
    },
    statusBadgeEmergency: {
      backgroundColor: '#fee2e2',
      borderWidth: 1,
      borderColor: '#fca5a5',
    },
    statusBadgeTextEmergency: {
      fontSize: 10,
      fontWeight: '800',
      color: '#991b1b',
    },
    statusBadgeHotspot: {
      backgroundColor: '#ede9fe',
      borderWidth: 1,
      borderColor: '#c4b5fd',
    },
    statusBadgeTextHotspot: {
      fontSize: 10,
      fontWeight: '800',
      color: '#5b21b6',
    },
    pulseDotAmberSmall: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#f59e0b',
    },
    bookingCodeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    fareContainer: {
      alignItems: 'flex-end',
    },
    fareAmount: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    fareSubText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.success,
    },
    jobInfoSection: {
      marginBottom: 10,
    },
    jobTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    jobAddress: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 3,
    },
    jobDescription: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 15,
    },
    navMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    navMetricItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    navMetricValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    metricDivider: {
      width: 1,
      height: 16,
      backgroundColor: colors.border,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    navigateBtn: {
      flex: 1.6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#2563eb',
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: '#2563eb',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 4,
    },
    navigateBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
    detailsBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailsBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });