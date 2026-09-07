// ==============================================================================
// MOBILE WORKER CARD COMPONENT — Localized, animated, haptic press feedback
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NearbyWorkerResult } from '../../types';
import { Star, ShieldCheck, MapPin, Zap } from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

interface WorkerCardProps {
  worker: NearbyWorkerResult;
  onPress: () => void;
  onBook: () => void;
  /** Index in a list — drives the staggered entrance delay. */
  index?: number;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onPress, onBook, index = 0 }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <FadeInView delay={index * 60} distance={14} duration={320}>
      <ScalePressable onPress={onPress}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.leftMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <ShieldCheck size={16} color={colors.primary} />
              </View>
              <Text style={styles.serviceText}>{translateTrade(worker.service)}</Text>
            </View>

            <View style={styles.ratingBadge}>
              <Star size={13} color={colors.star} fill={colors.star} />
              <Text style={styles.ratingText}>{worker.rating}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {worker.approximate_location.area}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.metricsBadge}>
              <Text style={styles.distanceText}>
                {t('common.km_away', { km: worker.distance_km })}
              </Text>
              <Text style={styles.scoreText}>
                {t('common.match', { score: worker.matchScore })}
              </Text>
            </View>

            <ScalePressable onPress={onBook} scaleTo={0.93}>
              <View style={styles.bookBtn}>
                <Zap size={12} color={colors.textInverse} />
                <Text style={styles.bookBtnText}>
                  {t('common.book', { rate: worker.hourly_rate })}
                </Text>
              </View>
            </ScalePressable>
          </View>
        </View>
      </ScalePressable>
    </FadeInView>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondaryDark,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
  },
  metricsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

export default WorkerCard;