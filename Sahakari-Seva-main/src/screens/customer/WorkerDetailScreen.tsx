// ==============================================================================
// CUSTOMER WORKER DETAIL SCREEN — CERTIFICATION, RATINGS & BIO
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { Worker } from '../../types';
import {
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle,
  Zap
} from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

export const WorkerDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const workerId = route?.params?.workerId || 'w0000000-0000-0000-0000-000000000001';
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ApiClient.getWorkerById(workerId);
        setWorker(data);
      } catch (err) {
        console.warn('Worker load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workerId]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.notFoundText}>{t('workerDetail.not_found')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={worker.profile?.full_name || worker.worker_code}
        subtitle={`${translateTrade(worker.skill_category)} • ${t('workerDetail.yrs_exp', { years: worker.experience_years })}`}
        onPressLanguage={() => {}}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Verification Banner */}
        <FadeInView distance={12} duration={320}>
          <View style={styles.verifiedCard}>
            <ShieldCheck size={24} color={colors.success} />
            <View style={styles.verifiedInfo}>
              <Text style={styles.verifiedTitle}>{t('workerDetail.verified_title')}</Text>
              <Text style={styles.verifiedDesc}>
                {t('workerDetail.verified_desc', { coop: worker.cooperative?.name || 'Jaipur Shramik Sahakari Sangh' })}
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Rating and Stats Row */}
        <FadeInView delay={90} distance={12} duration={320}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Star size={16} color={colors.star} fill={colors.star} />
                <Text style={styles.statLarge}>{worker.average_rating}</Text>
              </View>
              <Text style={styles.statLabel}>{t('workerDetail.rating')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLarge}>{worker.total_jobs}</Text>
              <Text style={styles.statLabel}>{t('workerDetail.jobs_done')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLarge}>{worker.experience_years} {t('workerDetail.yrs')}</Text>
              <Text style={styles.statLabel}>{t('workerDetail.experience')}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Bio */}
        <FadeInView delay={170} distance={12} duration={320}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('workerDetail.about')}</Text>
            <Text style={styles.bioText}>{worker.bio || t('workerDetail.bio_fallback')}</Text>
          </View>
        </FadeInView>

        {/* Verified Skills */}
        <FadeInView delay={250} distance={12} duration={320}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('workerDetail.verified_skills')}</Text>
            <View style={styles.skillsWrap}>
              {worker.skills.map((skill, i) => (
                <View key={i} style={styles.skillPill}>
                  <CheckCircle size={12} color={colors.success} />
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Service Area */}
        <FadeInView delay={330} distance={12} duration={320}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('workerDetail.service_coverage')}</Text>
            <View style={styles.locationBox}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={styles.locationText}>{worker.service_area} (Pincode: {worker.pincode})</Text>
            </View>
          </View>
        </FadeInView>
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>{t('workerDetail.base_rate')}</Text>
          <Text style={styles.priceValue}>₹{worker.hourly_or_base_rate} {t('workerDetail.per_hr')}</Text>
        </View>
        <ScalePressable onPress={() => navigation.navigate('BookingCreate', { worker })}>
          <View style={styles.bookNowBtn}>
            <Zap size={16} color={colors.textInverse} />
            <Text style={styles.bookNowBtnText}>{t('workerDetail.book_service')}</Text>
          </View>
        </ScalePressable>
      </View>
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  notFoundText: {
    fontSize: 14,
    color: colors.textSecondary
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100
  },
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.successLight,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: 16,
    gap: 12
  },
  verifiedInfo: {
    flex: 1
  },
  verifiedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.successDark
  },
  verifiedDesc: {
    fontSize: 11,
    color: colors.successDark,
    marginTop: 2,
    lineHeight: 16,
    opacity: 0.9
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  statItem: {
    alignItems: 'center'
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statLarge: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border
  },
  section: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8
  },
  bioText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  skillText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textMuted
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12
  },
  bookNowBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse
  }
});