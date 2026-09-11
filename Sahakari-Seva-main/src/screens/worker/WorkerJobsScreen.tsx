// ==============================================================================
// WORKER JOBS SCREEN — INCOMING REQUESTS & ACCEPT/DECLINE ACTIONS
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { Booking } from '../../types';
import { Clock, MapPin, Zap, CheckCircle2, AlertCircle, ChevronRight, Lock } from 'lucide-react-native';
import { FadeInView } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const WorkerJobsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: false });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001');
      setJobs(data);
    } catch (err) {
      console.warn('Jobs load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadJobs();
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      loadJobs();
    });
    return () => {
      sub.remove();
    };
  }, []);

  const inProgressJob = jobs.find((b) => b.status === 'in_progress');
  const acceptedJobs = jobs.filter((b) => b.status === 'accepted');
  const activeBannerJob = inProgressJob || acceptedJobs[0];

  const handleOpenJobDetail = (job: Booking) => {
    if (navigation?.navigate) {
      navigation.navigate('WorkerJobDetail', { bookingId: job.id, job });
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('tabs.jobs', 'Work Orders')}
        subtitle={t('worker.assigned_bookings', { count: jobs.length, defaultValue: `${jobs.length} total bookings assigned` })}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadJobs(); }} />}
      >
        {/* Active Commitment Status Banner */}
        {activeBannerJob ? (
          <FadeInView distance={8} duration={260}>
            <TouchableOpacity
              style={[
                styles.activeBanner,
                inProgressJob && styles.activeBannerInProgress,
              ]}
              activeOpacity={0.85}
              onPress={() => handleOpenJobDetail(activeBannerJob)}
            >
              <View style={styles.activeBannerLeft}>
                <View
                  style={[
                    styles.activePulseDot,
                    inProgressJob && { backgroundColor: '#3b82f6' },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.activeBannerTitleRow}>
                    <Text style={styles.activeBannerTitle}>
                      {inProgressJob
                        ? `On-Site Active: ${inProgressJob.booking_code}`
                        : `Committed: ${activeBannerJob.booking_code}${acceptedJobs.length > 1 ? ` (+${acceptedJobs.length - 1} more)` : ''}`}
                    </Text>
                    <View
                      style={[
                        styles.activeStatusPill,
                        inProgressJob && { backgroundColor: '#3b82f6' },
                      ]}
                    >
                      <Text style={styles.activeStatusPillText}>
                        {inProgressJob ? 'ON SITE / WORKING' : 'COMMITTED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activeBannerSub} numberOfLines={1}>
                    {activeBannerJob.service_description}
                  </Text>
                  <Text
                    style={[
                      styles.activeBannerPolicyNote,
                      inProgressJob && { color: '#2563eb' },
                    ]}
                  >
                    {inProgressJob
                      ? 'Working on-site now. Complete service before starting other jobs.'
                      : `Scheduled: ${activeBannerJob.booking_date} at ${activeBannerJob.booking_time}. Multiple non-overlapping jobs permitted.`}
                  </Text>
                </View>
              </View>
              <View style={styles.activeBannerArrow}>
                <ChevronRight size={18} color={inProgressJob ? '#2563eb' : '#10b981'} />
              </View>
            </TouchableOpacity>
          </FadeInView>
        ) : (
          <FadeInView distance={8} duration={260}>
            <View style={styles.readyBanner}>
              <CheckCircle2 size={16} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.readyBannerTitle}>Available for Assignment</Text>
                <Text style={styles.readyBannerSub}>
                  Review pending work orders below. You may accept assignments that do not overlap (1-hr buffer).
                </Text>
              </View>
            </View>
          </FadeInView>
        )}

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 40 }} />
        ) : jobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t('worker.no_requests_title', 'No Work Orders')}</Text>
            <Text style={styles.emptySubtitle}>{t('worker.no_requests_sub', 'Assigned booking orders will appear here.')}</Text>
          </View>
        ) : (
          jobs.map((job, idx) => {
            const isViolation = ApiClient.isPrepaidViolation(job);
            const isThisActive = job.status === 'accepted' || job.status === 'in_progress';
            const scheduleConflict = ApiClient.checkScheduleConflict(job, jobs, 60);

            return (
              <FadeInView key={job.id} delay={idx * 40} distance={12} duration={280}>
                <TouchableOpacity
                  style={[
                    styles.jobCard,
                    isViolation && styles.jobCardViolation,
                    isThisActive && styles.jobCardActive,
                    job.status === 'pending' && scheduleConflict.isExactCollision && styles.jobCardCollisionExact,
                    job.status === 'pending' && !scheduleConflict.isExactCollision && scheduleConflict.isBufferCollision && styles.jobCardCollisionBuffer,
                  ]}
                  activeOpacity={0.78}
                  onPress={() => handleOpenJobDetail(job)}
                >
                  {/* Card Top Row: Code, Badge, Amount */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.codeRow}>
                        <Text style={styles.jobCode}>{job.booking_code}</Text>
                        {job.is_emergency && (
                          <View style={styles.emergencyPill}>
                            <Zap size={10} color="#ef4444" />
                            <Text style={styles.emergencyPillText}>{t('worker.emergency', 'EMERGENCY')}</Text>
                          </View>
                        )}
                        {isViolation && (
                          <View style={styles.violationPill}>
                            <Lock size={10} color="#ef4444" />
                            <Text style={styles.violationPillText}>SEC 14-B LOCKOUT</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.timeRow}>
                        <Clock size={11} color={colors.textMuted} />
                        <Text style={styles.timeText}>
                          {job.booking_date} at {job.booking_time}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.headerRightCol}>
                      <View style={[styles.amountBadge, isViolation && styles.amountBadgeViolation]}>
                        <Text style={[styles.amountText, isViolation && styles.amountTextViolation]}>
                          ₹{job.final_amount || job.estimated_amount}
                        </Text>
                      </View>

                      {/* Status Pill */}
                      <View
                        style={[
                          styles.statusBadge,
                          job.status === 'pending' && styles.statusBadgePending,
                          job.status === 'accepted' && styles.statusBadgeAccepted,
                          job.status === 'in_progress' && styles.statusBadgeInProgress,
                          job.status === 'completed' && styles.statusBadgeCompleted,
                          job.status === 'rejected' && styles.statusBadgeRejected,
                          isViolation && styles.statusBadgeViolation,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            job.status === 'pending' && styles.statusTextPending,
                            job.status === 'accepted' && styles.statusTextAccepted,
                            job.status === 'in_progress' && styles.statusTextInProgress,
                            job.status === 'completed' && styles.statusTextCompleted,
                            job.status === 'rejected' && styles.statusTextRejected,
                            isViolation && styles.statusTextViolation,
                          ]}
                        >
                          {isViolation
                            ? 'LOCKED'
                            : job.status === 'pending'
                            ? 'REQUESTED'
                            : job.status === 'accepted'
                            ? 'CONFIRMED'
                            : job.status === 'in_progress'
                            ? 'IN PROGRESS'
                            : job.status === 'completed'
                            ? 'COMPLETED'
                            : job.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Service Description */}
                  <Text style={styles.descText} numberOfLines={2}>
                    {job.service_description}
                  </Text>

                  {/* Address Summary */}
                  <View style={styles.addressRow}>
                    <MapPin size={12} color={isViolation ? '#ef4444' : colors.textMuted} />
                    <Text
                      style={[styles.addressText, isViolation && styles.addressTextViolation]}
                      numberOfLines={1}
                    >
                      {isViolation
                        ? 'Coordinates locked by federation audit'
                        : `${job.address} (${job.pincode})`}
                    </Text>
                  </View>

                  {/* Card Footer: Clear action to open dedicated panel */}
                  <View style={[styles.cardFooter, isViolation && styles.cardFooterViolation]}>
                    <Text
                      style={[
                        styles.cardFooterText,
                        isViolation && styles.cardFooterTextViolation,
                      ]}
                    >
                      {isViolation
                        ? '🔒 View Federation Lockout Notice'
                        : job.status === 'in_progress'
                        ? '⚡ Manage On-Site Active Work →'
                        : job.status === 'accepted'
                        ? '⚡ Manage Confirmed Job Panel →'
                        : job.status === 'pending'
                        ? '👉 Review & Manage Job Request →'
                        : 'View Job Details & Wages →'}
                    </Text>
                    <ChevronRight
                      size={14}
                      color={isViolation ? '#ef4444' : colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              </FadeInView>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    // Active Commitment Banner
    activeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
      borderRadius: 14,
      borderWidth: 1.4,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0',
      padding: 14,
      marginBottom: 16,
    },
    activeBannerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    activePulseDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#10b981',
      marginTop: 4,
    },
    activeBannerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 3,
    },
    activeBannerTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    activeStatusPill: {
      backgroundColor: '#10b981',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    activeStatusPillText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.4,
    },
    activeBannerSub: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    activeBannerPolicyNote: {
      fontSize: 10.5,
      color: '#059669',
      fontWeight: '600',
      marginTop: 4,
    },
    activeBannerArrow: {
      paddingLeft: 8,
    },
    // Ready Banner
    readyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
      padding: 12,
      marginBottom: 16,
    },
    readyBannerTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    readyBannerSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    // Job Card
    jobCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      marginBottom: 14,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    jobCardActive: {
      borderColor: '#10b981',
      borderWidth: 1.5,
    },
    jobCardViolation: {
      borderColor: '#ef4444',
      borderWidth: 1.5,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.06)' : '#fef2f2',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    jobCode: {
      fontSize: 14.5,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    emergencyPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fee2e2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 3,
    },
    emergencyPillText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#ef4444',
    },
    violationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ef4444',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 3,
    },
    violationPillText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: '#ffffff',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    timeText: {
      fontSize: 11.5,
      color: colors.textMuted,
    },
    headerRightCol: {
      alignItems: 'flex-end',
      gap: 4,
    },
    amountBadge: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      paddingHorizontal: 9,
      paddingVertical: 3.5,
      borderRadius: 8,
    },
    amountBadgeViolation: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
    },
    amountText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: '#10b981',
    },
    amountTextViolation: {
      color: '#ef4444',
    },
    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 5,
    },
    statusBadgePending: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
    },
    statusBadgeAccepted: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    },
    statusBadgeInProgress: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    },
    statusBadgeCompleted: {
      backgroundColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#f1f5f9',
    },
    statusBadgeRejected: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
    },
    statusBadgeViolation: {
      backgroundColor: '#ef4444',
    },
    statusBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    statusTextPending: {
      color: '#b45309',
    },
    statusTextAccepted: {
      color: '#059669',
    },
    statusTextInProgress: {
      color: '#2563eb',
    },
    statusTextCompleted: {
      color: '#64748b',
    },
    statusTextRejected: {
      color: '#ef4444',
    },
    statusTextViolation: {
      color: '#ffffff',
    },
    descText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 12,
    },
    addressText: {
      fontSize: 11.5,
      color: colors.textMuted,
      flex: 1,
    },
    addressTextViolation: {
      color: '#ef4444',
      fontWeight: '600',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    },
    cardFooterViolation: {
      borderTopColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca',
    },
    cardFooterText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    cardFooterTextViolation: {
      color: '#ef4444',
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    activeBannerInProgress: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : '#bfdbfe',
    },
    jobCardCollisionExact: {
      borderColor: '#ef4444',
      borderWidth: 1.3,
    },
    jobCardCollisionBuffer: {
      borderColor: '#f59e0b',
      borderWidth: 1.3,
    },
    exactCollisionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ef4444',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 3,
    },
    exactCollisionPillText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: '#ffffff',
    },
    bufferCollisionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 3,
    },
    bufferCollisionPillText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: isDark ? '#fbbf24' : '#b45309',
    },
  });