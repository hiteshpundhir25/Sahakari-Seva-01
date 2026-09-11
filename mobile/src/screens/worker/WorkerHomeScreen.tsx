import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../components/common/Header';
import { WorkerScheduleCalendar } from '../../components/worker/WorkerScheduleCalendar';
import { ApiClient } from '../../services/apiClient';
import { Worker, AvailabilityStatus } from '../../types';
import {
  ShieldCheck,
  DollarSign,
  HeartHandshake,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { FadeInView, ScalePressable, AnimatedNumber, PulseDot } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const WorkerHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: true });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AvailabilityStatus>('available');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getWorkerById('w0000000-0000-0000-0000-000000000001'); // Demo Rahul Sharma
      setWorker(data);
      if (data) setStatus(data.availability_status);
    } catch (err) {
      console.warn('Worker profile load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleToggleStatus = async (newStatus: AvailabilityStatus) => {
    setStatus(newStatus);
    try {
      if (worker) {
        await ApiClient.updateWorkerAvailability(worker.id, newStatus);
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
              <Text style={styles.statusHeading}>{t('worker.online_status')}</Text>
              <View style={styles.liveIndicatorRow}>
                {status === 'available' && <PulseDot color="#10b981" size={7} ringScale={2.4} duration={1400} />}
                {status === 'emergency_only' && <PulseDot color="#ef4444" size={7} ringScale={2.4} duration={1200} />}
                <Text style={styles.liveIndicatorText}>
                  {status === 'available' ? 'DISPATCH READY' : status === 'emergency_only' ? 'SOS PRIORITY' : 'STANDBY'}
                </Text>
              </View>
            </View>

            <View style={styles.statusPills}>
              <ScalePressable
                onPress={() => handleToggleStatus('available')}
                style={styles.statusPillFlexReady}
                scaleTo={0.95}
              >
                <View style={[styles.statusPill, status === 'available' && styles.statusPillActive]}>
                  <Text
                    style={[styles.statusPillText, status === 'available' && styles.statusTextActive]}
                    numberOfLines={1}
                  >
                    {t('worker.online_ready')}
                  </Text>
                </View>
              </ScalePressable>

              <ScalePressable
                onPress={() => handleToggleStatus('emergency_only')}
                style={styles.statusPillFlexEmergency}
                scaleTo={0.95}
              >
                <View style={[styles.statusPill, status === 'emergency_only' && styles.emergencyPillActive]}>
                  <Text
                    style={[styles.statusPillText, status === 'emergency_only' && { color: colors.textInverse }]}
                    numberOfLines={1}
                  >
                    {t('worker.emergency_24_7')}
                  </Text>
                </View>
              </ScalePressable>

              <ScalePressable
                onPress={() => handleToggleStatus('offline')}
                style={styles.statusPillFlexOffline}
                scaleTo={0.95}
              >
                <View style={[styles.statusPill, status === 'offline' && styles.offlinePillActive]}>
                  <Text
                    style={[styles.statusPillText, status === 'offline' && { color: colors.textInverse }]}
                    numberOfLines={1}
                  >
                    {t('worker.offline')}
                  </Text>
                </View>
              </ScalePressable>
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
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statusHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveIndicatorText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  statusPills: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPillFlexReady: {
    flex: 1.05,
  },
  statusPillFlexEmergency: {
    flex: 1.3,
  },
  statusPillFlexOffline: {
    flex: 0.85,
  },
  statusPill: {
    flexDirection: 'row',
    paddingVertical: 9.5,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  statusPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyPillActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  offlinePillActive: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.textSecondary,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusTextActive: {
    color: colors.textInverse,
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