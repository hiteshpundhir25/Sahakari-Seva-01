import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../components/common/Header';
import { WorkerScheduleCalendar } from '../../components/worker/WorkerScheduleCalendar';
import { ApiClient } from '../../services/apiClient';
import { Worker, AvailabilityStatus, Booking } from '../../types';
import {
  ShieldCheck,
  DollarSign,
  HeartHandshake,
  MapPin,
  Sparkles,
  Radio,
  Briefcase,
  Zap,
  Power,
  Check,
  Lock,
  AlertTriangle,
} from 'lucide-react-native';
import { FadeInView, ScalePressable, AnimatedNumber, PulseDot } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

interface StatusOptionItem {
  id: 'available' | 'offline';
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
  icon: React.ComponentType<any>;
  color: string;
  lightBg: string;
}

const STATUS_OPTIONS: StatusOptionItem[] = [
  {
    id: 'available',
    titleKey: 'worker.active_for_work',
    defaultTitle: 'Active for work',
    descKey: 'worker.status_active_sub',
    defaultDesc: 'Ready for new dispatches',
    icon: Radio,
    color: '#10b981',
    lightBg: '#ecfdf5',
  },
  {
    id: 'offline',
    titleKey: 'worker.offline',
    defaultTitle: 'Offline',
    descKey: 'worker.status_offline_sub',
    defaultDesc: 'Standby • Not taking jobs',
    icon: Power,
    color: '#64748b',
    lightBg: '#f1f5f9',
  },
];

export const WorkerHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: true });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AvailabilityStatus>('available');
  const [activeJob, setActiveJob] = useState<Booking | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getWorkerById('w0000000-0000-0000-0000-000000000001'); // Demo Rahul Sharma
      const workerBookings = await ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001');
      const currentActive =
        workerBookings.find((b: Booking) => b.status === 'in_progress') ||
        workerBookings.find((b: Booking) => b.status === 'accepted') ||
        null;

      setActiveJob(currentActive);
      setWorker(data);

      if (currentActive) {
        setStatus(currentActive.is_emergency ? 'emergency_only' : 'busy');
      } else if (data) {
        setStatus(
          data.availability_status === 'busy' || data.availability_status === 'emergency_only'
            ? 'available'
            : data.availability_status
        );
      }
    } catch (err) {
      console.warn('Worker profile load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      loadProfile();
    });
    return () => {
      sub.remove();
    };
  }, []);

  const handleToggleStatus = async (newStatus: AvailabilityStatus) => {
    if (activeJob) {
      const isEmerg = activeJob.is_emergency;
      Alert.alert(
        isEmerg ? '🚨 Emergency Service Locked' : '⚡ Active Work in Progress',
        isEmerg
          ? `You are currently dispatched on an emergency SOS job (${activeJob.booking_code}). Operational mode is locked to Emergency Service until completion.`
          : `You are currently on an active service assignment (${activeJob.booking_code}). Operational mode will automatically revert to "Active for work" once this job is completed.`,
        [
          {
            text: 'View Job Details',
            onPress: () =>
              navigation.navigate('WorkerJobDetail', {
                bookingId: activeJob.id,
                job: activeJob,
              }),
          },
          { text: 'Understood', style: 'cancel' },
        ]
      );
      return;
    }

    setStatus(newStatus);
    try {
      if (worker) {
        await ApiClient.updateWorkerAvailability(worker.id, newStatus);
        DeviceEventEmitter.emit('app_booking_updated');
      }
    } catch (err: any) {
      Alert.alert(t('worker.status_error_title'), err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={worker?.profile?.full_name || 'Rahul Sharma'}
        subtitle={t('worker.federation_member')}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Availability Toggle Box with Live Pulsing Indicators */}
        <FadeInView distance={12} duration={320}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeadingRow}>
              <View style={styles.statusTitleCol}>
                <Text style={styles.statusHeading}>{t('worker.online_status', 'Availability Status')}</Text>
                <Text style={styles.statusSubheading}>
                  {activeJob?.is_emergency
                    ? '🚨 Locked on Emergency Dispatch • Arrival SLA < 15-30 mins'
                    : activeJob
                    ? '⚡ Engaged on Active Work • Status locked until completion'
                    : status === 'available'
                    ? 'Live on dispatch • Ready for new customer bookings'
                    : 'Offline standby • Not accepting new requests'}
                </Text>
              </View>

              <View
                style={[
                  styles.liveIndicatorRow,
                  activeJob?.is_emergency
                    ? styles.liveIndicatorEmergency
                    : activeJob
                    ? styles.liveIndicatorBusy
                    : status === 'available'
                    ? styles.liveIndicatorAvailable
                    : styles.liveIndicatorOffline,
                ]}
              >
                {activeJob?.is_emergency ? (
                  <PulseDot color="#ef4444" size={7} ringScale={2.4} duration={1200} />
                ) : activeJob ? (
                  <PulseDot color="#f59e0b" size={7} ringScale={2.4} duration={1200} />
                ) : status === 'available' ? (
                  <PulseDot color="#10b981" size={7} ringScale={2.4} duration={1400} />
                ) : (
                  <View style={styles.offlineDot} />
                )}
                <Text
                  style={[
                    styles.liveIndicatorText,
                    activeJob?.is_emergency
                      ? { color: '#dc2626' }
                      : activeJob
                      ? { color: '#b45309' }
                      : status === 'available'
                      ? { color: '#059669' }
                      : { color: colors.textSecondary },
                  ]}
                >
                  {activeJob?.is_emergency
                    ? '🚨 ON EMERGENCY JOB'
                    : activeJob
                    ? '⚡ ON ACTIVE WORK'
                    : status === 'available'
                    ? 'ACTIVE FOR WORK'
                    : 'OFFLINE'}
                </Text>
              </View>
            </View>

            {/* Active Emergency SOS Job Alert Banner */}
            {activeJob && activeJob.is_emergency && (
              <View style={styles.activeEmergencyBanner}>
                <View style={styles.activeEmergencyDotGlow} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Zap size={14} color="#ef4444" fill="#ef4444" />
                    <Text style={styles.activeEmergencyBannerTitle}>
                      On Emergency Service (24/7 Rapid SOS)
                    </Text>
                  </View>
                  <Text style={styles.activeEmergencyBannerSub}>
                    Assigned to SOS #{activeJob.booking_code}. Arrival SLA: &lt; 15–30 mins. Operational mode locked until service is completed.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.activeEmergencyBtn}
                  onPress={() =>
                    navigation.navigate('WorkerJobDetail', {
                      bookingId: activeJob.id,
                      job: activeJob,
                    })
                  }
                >
                  <Text style={styles.activeEmergencyBtnText}>View Job</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Standard Active Job Alert Banner */}
            {activeJob && !activeJob.is_emergency && (
              <View style={styles.activeJobBanner}>
                <View style={styles.activeJobDotGlow} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Briefcase size={14} color="#f59e0b" />
                    <Text style={styles.activeJobBannerTitle}>
                      On Active Work
                    </Text>
                  </View>
                  <Text style={styles.activeJobBannerSub}>
                    Assigned to booking #{activeJob.booking_code}. Operational mode locked until job completion.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.activeJobBtn}
                  onPress={() =>
                    navigation.navigate('WorkerJobDetail', {
                      bookingId: activeJob.id,
                      job: activeJob,
                    })
                  }
                >
                  <Text style={styles.activeJobBtnText}>View Job</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2-Option Availability Selection (Active for work vs Offline) */}
            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((item) => {
                const isSelected = !activeJob ? status === item.id : item.id === 'available';
                const IconComponent = item.icon;
                const isLocked = !!activeJob;

                return (
                  <ScalePressable
                    key={item.id}
                    onPress={() => handleToggleStatus(item.id)}
                    style={styles.gridItemWrap}
                    scaleTo={0.96}
                  >
                    <View
                      style={[
                        styles.statusCardOption,
                        isSelected
                          ? [
                              styles.statusCardOptionActive,
                              {
                                backgroundColor: isDark ? `${item.color}22` : item.lightBg,
                                borderColor: item.color,
                              },
                            ]
                          : styles.statusCardOptionInactive,
                        isLocked && item.id === 'offline' && { opacity: 0.5 },
                      ]}
                    >
                      <View style={styles.statusCardTopRow}>
                        <View
                          style={[
                            styles.statusIconWrap,
                            {
                              backgroundColor: isSelected
                                ? item.color
                                : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : colors.surfaceSubtle,
                            },
                          ]}
                        >
                          <IconComponent
                            size={16}
                            color={isSelected ? '#ffffff' : item.color}
                          />
                        </View>

                        {isLocked ? (
                          <View style={styles.lockedBadge}>
                            <Lock size={10} color={colors.textMuted} />
                            <Text style={styles.lockedBadgeText}>LOCKED</Text>
                          </View>
                        ) : isSelected ? (
                          <View style={[styles.activeBadge, { backgroundColor: item.color }]}>
                            <Check size={10} color="#ffffff" strokeWidth={3} />
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                          </View>
                        ) : (
                          <View style={styles.inactiveIndicator} />
                        )}
                      </View>

                      <View style={styles.statusCardBody}>
                        <Text
                          style={[
                            styles.statusOptionTitle,
                            isSelected && {
                              color: isDark ? '#ffffff' : colors.textPrimary,
                              fontWeight: '800',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.defaultTitle}
                        </Text>
                        <Text
                          style={[
                            styles.statusOptionSub,
                            isSelected && {
                              color: isDark ? 'rgba(255, 255, 255, 0.8)' : colors.textSecondary,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {isLocked && item.id === 'available'
                            ? activeJob?.is_emergency
                              ? 'Emergency duty active'
                              : 'Active job underway'
                            : item.defaultDesc}
                        </Text>
                      </View>
                    </View>
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Dynamic Earnings & Welfare Cards with Gradient Accents */}
        <FadeInView delay={100} distance={12} duration={320}>
          <View style={styles.metricsGrid}>
            <LinearGradient
              colors={isDark ? ['#1e1b4b', '#0f172a'] : ['#eef2ff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.metricBox, { borderColor: isDark ? '#3730a3' : '#c7d2fe' }]}
            >
              <View style={styles.metricIconWrap}>
                <DollarSign size={20} color={colors.primary} />
              </View>
              <AnimatedNumber
                value={Number(worker?.total_earnings || 74200)}
                prefix="₹"
                format={(n) => Math.round(n).toLocaleString('en-IN')}
                duration={1100}
                style={styles.metricAmount}
              />
              <Text style={styles.metricTitle}>{t('worker.direct_earnings')}</Text>
            </LinearGradient>

            <LinearGradient
              colors={isDark ? ['#451a03', '#0f172a'] : ['#fffbeb', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.metricBox, { borderColor: isDark ? '#78350f' : '#fde68a' }]}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: colors.secondaryLight }]}>
                <HeartHandshake size={20} color={colors.secondaryDark} />
              </View>
              <AnimatedNumber
                value={7420}
                prefix="₹"
                format={(n) => Math.round(n).toLocaleString('en-IN')}
                duration={1100}
                delay={200}
                style={[styles.metricAmount, { color: colors.secondaryDark }]}
              />
              <Text style={styles.metricTitle}>{t('worker.welfare_corpus')}</Text>
            </LinearGradient>
          </View>
        </FadeInView>

        {/* Quick Action: Location & Radius Settings */}
        <FadeInView delay={190} distance={12} duration={320}>
          <ScalePressable onPress={() => navigation.navigate('WorkerLocation')}>
            <View style={styles.locationLinkCard}>
              <View style={styles.locLeft}>
                <MapPin size={20} color={colors.primary} />
                <View>
                  <Text style={styles.locTitle}>{t('worker.service_area_settings')}</Text>
                  <Text style={styles.locDesc}>{t('worker.location_link_desc', { radius: worker?.service_radius_km || 12 })}</Text>
                </View>
              </View>
              <Text style={styles.chevronText}>→</Text>
            </View>
          </ScalePressable>
        </FadeInView>

        {/* Insurance Coverage Card */}
        <FadeInView delay={280} distance={12} duration={320}>
          <View style={styles.insuranceCard}>
            <View style={styles.insuranceHeader}>
              <ShieldCheck size={20} color={colors.success} />
              <Text style={styles.insuranceTitle}>{t('worker.insurance_title')}</Text>
            </View>
            <Text style={styles.insuranceDesc}>
              {t('worker.insurance_desc')}
            </Text>
            <Text style={styles.insurancePolicy}>{t('worker.insurance_policy')}</Text>
          </View>
        </FadeInView>

        {/* Accepted & Scheduled Work Calendar */}
        <FadeInView delay={360} distance={12} duration={320}>
          <WorkerScheduleCalendar
            workerId={worker?.id || 'w0000000-0000-0000-0000-000000000001'}
            navigation={navigation}
          />
        </FadeInView>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
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
  statusCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  statusTitleCol: {
    flex: 1,
  },
  statusHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  statusSubheading: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceSubtle,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
    flexShrink: 0,
  },
  liveIndicatorAvailable: {
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ecfdf5',
    borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0',
  },
  liveIndicatorBusy: {
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#fffbeb',
    borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
  },
  liveIndicatorEmergency: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : '#fef2f2',
    borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fecaca',
  },
  liveIndicatorOffline: {
    backgroundColor: isDark ? 'rgba(100, 116, 139, 0.12)' : '#f1f5f9',
    borderColor: isDark ? 'rgba(100, 116, 139, 0.25)' : '#e2e8f0',
  },
  offlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#64748b',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  activeEmergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#fef2f2',
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#fca5a5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  activeEmergencyDotGlow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  activeEmergencyBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: isDark ? '#f87171' : '#dc2626',
    letterSpacing: 0.2,
  },
  activeEmergencyBannerSub: {
    fontSize: 11,
    color: isDark ? '#fca5a5' : '#b91c1c',
    marginTop: 2,
    lineHeight: 15,
  },
  activeEmergencyBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeEmergencyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  activeJobBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#fef3c7',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  activeJobDotGlow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  activeJobBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: isDark ? '#fbbf24' : '#b45309',
    letterSpacing: 0.2,
  },
  activeJobBannerSub: {
    fontSize: 11,
    color: isDark ? '#fde68a' : '#92400e',
    marginTop: 2,
    lineHeight: 15,
  },
  activeJobBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeJobBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItemWrap: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  statusCardOption: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    minHeight: 84,
  },
  statusCardOptionInactive: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.surfaceSubtle,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
  },
  statusCardOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statusCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  lockedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  inactiveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#cbd5e1',
  },
  statusCardBody: {
    marginTop: 'auto',
  },
  statusOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  statusOptionSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  metricAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary
  },
  metricTitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  locationLinkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  locLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  locTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  locDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  chevronText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted
  },
  insuranceCard: {
    backgroundColor: colors.successLight,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.success
  },
  insuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  insuranceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.successDark
  },
  insuranceDesc: {
    fontSize: 12,
    color: colors.successDark,
    lineHeight: 17,
    opacity: 0.9
  },
  insurancePolicy: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successDark,
    marginTop: 8
  }
});