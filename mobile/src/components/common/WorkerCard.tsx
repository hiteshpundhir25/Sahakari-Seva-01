// ==============================================================================
// MOBILE WORKER CARD COMPONENT — Localized, animated, haptic press feedback
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { NearbyWorkerResult } from '../../types';
import { Star, ShieldCheck, MapPin, Zap, Sparkles } from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { getTradeTheme } from '../../theme/tradeThemes';

interface WorkerCardProps {
  worker: NearbyWorkerResult;
  onPress: () => void;
  onBook: () => void;
  /** Index in a list — drives the staggered entrance delay. */
  index?: number;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onPress, onBook, index = 0 }) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const tradeTheme = getTradeTheme(worker.service, isDark);

  return (
    <FadeInView delay={index * 60} distance={14} duration={320}>
      <ScalePressable onPress={onPress} scaleTo={0.98}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.leftMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <ShieldCheck size={16} color={colors.primary} />
              </View>
              {/* Vibrant Trade Category Chip */}
              <View style={[styles.tradeChip, { backgroundColor: tradeTheme.badgeBg, borderColor: tradeTheme.border }]}>
                <View style={[styles.tradeDot, { backgroundColor: tradeTheme.primary }]} />
                <Text style={[styles.tradeText, { color: tradeTheme.badgeText }]}>
                  {translateTrade(worker.service)}
                </Text>
              </View>
            </View>

            {/* Glowing Amber Rating Badge */}
            <View style={styles.ratingBadge}>
              <Star size={13} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{worker.rating}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {worker.approximate_location.area}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.metricsBadge}>
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>
                  {t('common.km_away', { km: worker.distance_km })}
                </Text>
              </View>
              {/* Energetic Emerald Match Score Chip */}
              <View style={styles.matchScoreBadge}>
                <Sparkles size={11} color="#059669" />
                <Text style={styles.scoreText}>
                  {t('common.match', { score: worker.matchScore })}
                </Text>
              </View>
            </View>

            <ScalePressable onPress={onBook} scaleTo={0.93}>
              <LinearGradient
                colors={['#4f46e5', '#4338ca']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookBtn}
              >
                <Zap size={12} color="#ffffff" />
                <Text style={styles.bookBtnText}>
                  {t('common.book', { rate: worker.hourly_rate })}
                </Text>
              </LinearGradient>
            </ScalePressable>
          </View>
        </View>
      </ScalePressable>
    </FadeInView>
  );
};

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
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
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 5,
  },
  tradeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tradeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fef3c7',
    borderWidth: 1,
    borderColor: isDark ? '#b45309' : '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#fde68a' : '#b45309',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
  },
  metricsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.18)' : '#ecfdf5',
    borderWidth: 1,
    borderColor: isDark ? '#065f46' : '#a7f3d0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: isDark ? '#6ee7b7' : '#047857',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 9,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default WorkerCard;