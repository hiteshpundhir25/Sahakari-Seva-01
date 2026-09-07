// ==============================================================================
// ADMIN DEMAND FORECAST SCREEN — PREDICTIVE DEMAND, CONFIDENCE & COLD START
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { DemandForecastRecord } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react-native';
import { FadeInView } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

export const AdminForecastScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [forecasts, setForecasts] = useState<DemandForecastRecord[]>([]);
  const [weeklyCurve, setWeeklyCurve] = useState<any[]>([]);
  const [totalEvents, setTotalEvents] = useState(160);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getDemandForecast();
      setForecasts(res.zone_forecasts || []);
      setWeeklyCurve(res.weekly_demand_curve || []);
      if (res.total_historical_events) setTotalEvents(res.total_historical_events);
    } catch (err) {
      console.warn('Forecast load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title={t('admin.forecast_tab')}
        subtitle={t('admin.grounding', { count: totalEvents })}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadForecast(); }} />}
      >
        {/* ML Transparency Header Box */}
        <FadeInView distance={12} duration={320}>
          <View style={styles.transparencyCard}>
            <Info size={18} color={colors.info} />
            <View style={{ flex: 1 }}>
              <Text style={styles.transparencyTitle}>{t('admin.model_title')}</Text>
              <Text style={styles.transparencyDesc}>{t('admin.model_desc')}</Text>
            </View>
          </View>
        </FadeInView>

        {/* 7-Day Forward Demand Curve Bar */}
        <FadeInView delay={90} distance={12} duration={320}>
        <View style={styles.curveCard}>
          <Text style={styles.curveHeading}>{t('admin.curve_heading')}</Text>
          <View style={styles.curveBarsRow}>
            {weeklyCurve.map((day, i) => {
              const heightPct = Math.min(100, Math.max(20, (day.predictedDemand / 25) * 100));
              const isWeekend = day.dayName === 'Sat' || day.dayName === 'Sun';

              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barDemandText}>{day.predictedDemand}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPct}%` },
                        isWeekend && { backgroundColor: colors.warning }
                      ]}
                    />
                  </View>
                  <Text style={[styles.dayLabel, isWeekend && { fontWeight: '800', color: colors.warning }]}>
                    {day.dayName}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.curveFootnote}>{t('admin.curve_footnote')}</Text>
        </View>
        </FadeInView>

        {/* Zone Specific Forecast Outputs */}
        <FadeInView delay={170} distance={12} duration={320}>
          <Text style={styles.zoneSectionTitle}>{t('admin.zonal_predictions')}</Text>
        </FadeInView>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          forecasts.map((fc, idx) => (
            <FadeInView key={fc.id} delay={220 + idx * 80} distance={14} duration={320}>
            <View style={styles.forecastCard}>
              <View style={styles.fcHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fcZone}>{fc.location_zone}</Text>
                  <Text style={styles.fcTrade}>{translateTrade(fc.service_category)}</Text>
                </View>

                <View
                  style={[
                    styles.confidenceBadge,
                    fc.is_baseline_fallback ? { backgroundColor: colors.warningLight } : { backgroundColor: colors.successLight }
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceText,
                      fc.is_baseline_fallback ? { color: colors.warningDark } : { color: colors.successDark }
                    ]}
                  >
                    {t('admin.confidence', { score: fc.confidence_score })}
                  </Text>
                </View>
              </View>

              {/* Demand Numbers */}
              <View style={styles.demandMetricsRow}>
                <View style={styles.demandMetric}>
                  <Text style={styles.metricBig}>{fc.predicted_demand}</Text>
                  <Text style={styles.metricSub}>{t('admin.predicted_jobs')}</Text>
                </View>
                <View style={styles.metricSep} />
                <View style={styles.demandMetric}>
                  <Text style={styles.metricMedium}>
                    {fc.confidence_lower_bound || fc.predicted_demand - 2} – {fc.confidence_upper_bound || fc.predicted_demand + 3}
                  </Text>
                  <Text style={styles.metricSub}>{t('admin.bound_range')}</Text>
                </View>
                <View style={styles.metricSep} />
                <View style={styles.demandMetric}>
                  <Text style={styles.metricMedium}>{fc.forecast_time_window}</Text>
                  <Text style={styles.metricSub}>{t('admin.time_window')}</Text>
                </View>
              </View>

              {/* Cold Start Notice If Applicable */}
              {fc.is_baseline_fallback ? (
                <View style={styles.coldStartNotice}>
                  <AlertTriangle size={14} color={colors.warningDark} />
                  <Text style={styles.coldStartText}>
                    {fc.status_note || t('admin.cold_start')}
                  </Text>
                </View>
              ) : (
                <View style={styles.trendNotice}>
                  <CheckCircle2 size={14} color={colors.success} />
                  <Text style={styles.trendText}>{fc.status_note || t('admin.trend_note')}</Text>
                </View>
              )}
            </View>
            </FadeInView>
          ))
        )}
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
  transparencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoLight,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.info,
    marginBottom: 16,
    gap: 10
  },
  transparencyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.infoDark
  },
  transparencyDesc: {
    fontSize: 11,
    color: colors.infoDark,
    marginTop: 2,
    lineHeight: 16,
    opacity: 0.9
  },
  curveCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  curveHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14
  },
  curveBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10
  },
  barCol: {
    alignItems: 'center',
    width: '12%'
  },
  barDemandText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4
  },
  barTrack: {
    height: 75,
    width: 14,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6
  },
  curveFootnote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 12,
    fontStyle: 'italic'
  },
  zoneSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12
  },
  forecastCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14
  },
  fcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  fcZone: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  fcTrade: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700'
  },
  demandMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10
  },
  demandMetric: {
    alignItems: 'center'
  },
  metricBig: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary
  },
  metricMedium: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  metricSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  metricSep: {
    width: 1,
    height: 24,
    backgroundColor: colors.border
  },
  coldStartNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: 10,
    borderRadius: 8,
    gap: 6
  },
  coldStartText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warningDark,
    flex: 1
  },
  trendNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: 10,
    borderRadius: 8,
    gap: 6
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successDark,
    flex: 1
  }
});