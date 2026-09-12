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
import { Header } from '../../components/common/Header';
import { WorkerScheduleCalendar } from '../../components/worker/WorkerScheduleCalendar';
import { ApiClient } from '../../services/apiClient';
import { Worker, AvailabilityStatus, Booking } from '../../types';
import {
  ShieldCheck,
  Radio,
  Power,
  Check,
  Lock,
} from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
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
        {/* Availability Toggle Box */}
        <FadeInView distance={12} duration={320}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeadingRow}>
              <Text style={styles.statusHeading}>{t('worker.online_status', 'Availability Status')}</Text>
            </View>

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
                      </View>
                    </View>
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Insurance Coverage Card */}
        <FadeInView delay={140} distance={12} duration={320}>
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
        <FadeInView delay={220} distance={12} duration={320}>
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
    marginBottom: 14,
  },
  statusHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
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