// ==============================================================================
// WORKER HOME SCREEN — EARNINGS, WELFARE CORPUS & AVAILABILITY STATUS
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { Worker, AvailabilityStatus } from '../../types';
import {
  ShieldCheck,
  DollarSign,
  HeartHandshake,
  MapPin
} from 'lucide-react-native';
import { FadeInView, ScalePressable, AnimatedNumber } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

export const WorkerHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
        {/* Availability Toggle Box */}
        <FadeInView distance={12} duration={320}>
          <View style={styles.statusCard}>
            <Text style={styles.statusHeading}>{t('worker.online_status')}</Text>
            <View style={styles.statusPills}>
              <ScalePressable onPress={() => handleToggleStatus('available')} style={styles.statusPillFlex}>
                <View style={[styles.statusPill, status === 'available' && styles.statusPillActive]}>
                  <Text style={[styles.statusPillText, status === 'available' && styles.statusTextActive]}>
                    {t('worker.online_ready')}
                  </Text>
                </View>
              </ScalePressable>

              <ScalePressable onPress={() => handleToggleStatus('emergency_only')} style={styles.statusPillFlex}>
                <View style={[styles.statusPill, status === 'emergency_only' && styles.emergencyPillActive]}>
                  <Text style={[styles.statusPillText, status === 'emergency_only' && { color: colors.textInverse }]}>
                    {t('worker.emergency_24_7')}
                  </Text>
                </View>
              </ScalePressable>

              <ScalePressable onPress={() => handleToggleStatus('offline')} style={styles.statusPillFlex}>
                <View style={[styles.statusPill, status === 'offline' && styles.offlinePillActive]}>
                  <Text style={[styles.statusPillText, status === 'offline' && { color: colors.textInverse }]}>
                    {t('worker.offline')}
                  </Text>
                </View>
              </ScalePressable>
            </View>
          </View>
        </FadeInView>

        {/* Earnings & Welfare Cards */}
        <FadeInView delay={100} distance={12} duration={320}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
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
            </View>

            <View style={styles.metricBox}>
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
            </View>
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
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  statusCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  statusHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10
  },
  statusPills: {
    flexDirection: 'row',
    gap: 8
  },
  statusPillFlex: {
    flex: 1,
  },
  statusPill: {
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle
  },
  statusPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  emergencyPillActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  offlinePillActive: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.textSecondary
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  statusTextActive: {
    color: colors.textInverse
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
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