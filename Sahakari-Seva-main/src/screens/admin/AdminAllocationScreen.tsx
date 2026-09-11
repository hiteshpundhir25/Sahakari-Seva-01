// ==============================================================================
// ADMIN WORKFORCE ALLOCATION SCREEN — DEMAND BALANCING & MOBILIZATION
// Displays Understaffed, Balanced, and Overstaffed cooperative clusters
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { WorkforceAllocation, AllocationStatus } from '../../types';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  Send
} from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const AdminAllocationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'AdminDashboard', isHome: false });
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [allocations, setAllocations] = useState<WorkforceAllocation[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | AllocationStatus>('all');
  const [mobilizedZones, setMobilizedZones] = useState<Record<string, boolean>>({});

  const loadAllocations = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getWorkforceAllocations();
      setAllocations(res.data);
      setSummary(res.summary);
    } catch (err) {
      console.warn('Workforce allocation load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const handleMobilize = (item: WorkforceAllocation) => {
    Alert.alert(
      t('admin.mobilize_alert_title'),
      t('admin.mobilize_alert_msg', {
        count: item.recommended_mobilization,
        zone: item.location_zone,
        trade: translateTrade(item.service_category)
      }),
      [
        { text: t('admin.cancel'), style: 'cancel' },
        {
          text: t('admin.dispatch_now'),
          style: 'default',
          onPress: () => {
            setMobilizedZones(prev => ({ ...prev, [item.id]: true }));
            Alert.alert(
              t('admin.mobilization_dispatched'),
              t('admin.mobilization_done_msg', { zone: item.location_zone })
            );
          }
        }
      ]
    );
  };

  const filteredAllocations = allocations.filter(item => {
    if (filter === 'all') return true;
    return item.allocation_status === filter;
  });

  const getStatusBadge = (status: AllocationStatus) => {
    switch (status) {
      case 'understaffed':
        return {
          label: t('admin.deficit_badge'),
          bg: colors.dangerLight,
          text: colors.danger,
          icon: <AlertTriangle size={14} color={colors.danger} />
        };
      case 'overstaffed':
        return {
          label: t('admin.surplus_badge'),
          bg: colors.infoLight,
          text: colors.info,
          icon: <Sparkles size={14} color={colors.info} />
        };
      default:
        return {
          label: t('admin.balanced_badge'),
          bg: colors.successLight,
          text: colors.success,
          icon: <CheckCircle2 size={14} color={colors.success} />
        };
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('admin.allocation_title')}
        subtitle={t('admin.allocation_subtitle')}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAllocations();
            }}
          />
        }
      >
        {/* Metric Cards Summary */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderLeftColor: colors.danger }]}>
            <Text style={styles.metricVal}>{summary?.understaffedCount ?? 2}</Text>
            <Text style={styles.metricLbl}>{t('admin.understaffed')}</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.metricVal}>{summary?.balancedCount ?? 4}</Text>
            <Text style={styles.metricLbl}>{t('admin.balanced')}</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.info }]}>
            <Text style={styles.metricVal}>{summary?.overstaffedCount ?? 1}</Text>
            <Text style={styles.metricLbl}>{t('admin.surplus')}</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'understaffed', 'balanced', 'overstaffed'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filter === f && styles.filterPillTextActive
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading State */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('admin.calculating')}</Text>
          </View>
        ) : filteredAllocations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>{t('admin.all_zones_balanced')}</Text>
            <Text style={styles.emptyDesc}>{t('admin.no_deficits')}</Text>
          </View>
        ) : (
          filteredAllocations.map((item, idx) => {
            const badge = getStatusBadge(item.allocation_status);
            const isMobilized = mobilizedZones[item.id];

            return (
              <FadeInView key={item.id} delay={idx * 70} distance={14} duration={320}>
              <View style={styles.zoneCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.zoneInfo}>
                    <View style={styles.zoneRow}>
                      <MapPin size={16} color={colors.textSecondary} />
                      <Text style={styles.zoneName}>{item.location_zone}</Text>
                    </View>
                    <Text style={styles.zoneSub}>
                      {t('admin.category_label')}: <Text style={{ fontWeight: '700', color: colors.primary }}>{translateTrade(item.service_category)}</Text>
                    </Text>
                  </View>

                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    {badge.icon}
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Capacity vs Demand bar */}
                <View style={styles.statGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statVal}>{item.available_workers}</Text>
                    <Text style={styles.statLbl}>{t('admin.active_workers')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statVal}>{item.predicted_demand}</Text>
                    <Text style={styles.statLbl}>{t('admin.expected_jobs')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statVal,
                        {
                          color:
                            item.recommended_mobilization > 0 ? colors.danger : colors.success
                        }
                      ]}
                    >
                      {item.recommended_mobilization > 0
                        ? `+${item.recommended_mobilization}`
                        : '0'}
                    </Text>
                    <Text style={styles.statLbl}>{t('admin.mobilize')}</Text>
                  </View>
                </View>

                {/* Mobilization dispatch CTA if understaffed */}
                {item.allocation_status === 'understaffed' && (
                  <View style={styles.actionFooter}>
                    {isMobilized ? (
                      <View style={styles.dispatchedBanner}>
                        <CheckCircle2 size={16} color={colors.success} />
                        <Text style={styles.dispatchedText}>{t('admin.dispatched_banner')}</Text>
                      </View>
                    ) : (
                      <ScalePressable onPress={() => handleMobilize(item)}>
                        <View style={styles.mobilizeBtn}>
                          <Send size={16} color={colors.textInverse} />
                          <Text style={styles.mobilizeBtnText}>
                            {t('admin.mobilize_btn', { count: item.recommended_mobilization })}
                          </Text>
                        </View>
                      </ScalePressable>
                    )}
                  </View>
                )}
              </View>
              </FadeInView>
            );
          })
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
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary
  },
  metricLbl: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted
  },
  filterPillTextActive: {
    color: colors.textInverse
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4
  },
  zoneCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14
  },
  zoneInfo: {
    flex: 1,
    marginRight: 8
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary
  },
  zoneSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  statGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  statLbl: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  actionFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  mobilizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10
  },
  mobilizeBtnText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700'
  },
  dispatchedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    paddingVertical: 8,
    borderRadius: 8
  },
  dispatchedText: {
    color: colors.successDark,
    fontSize: 13,
    fontWeight: '700'
  }
});