// ==============================================================================
// ADMIN DASHBOARD SCREEN — FEDERATION OPERATIONS & WELFARE CORPUS
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
import {
  Users,
  CalendarCheck,
  TrendingUp,
  HeartHandshake,
  ShieldCheck,
  ArrowRight
} from 'lucide-react-native';
import { FadeInView, AnimatedNumber, ScalePressable } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useAppBackHandler({ homeRouteName: 'AdminDashboard', isHome: true });
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getAdminStats();
      setStats(data);
    } catch (err) {
      console.warn('Admin stats load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title={t('admin.title')}
        subtitle={`${t('invoice.coop_name')} (Reg. 8842)`}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}
      >
        {/* KPI Grid */}
        <View style={styles.grid}>
          <FadeInView delay={0} distance={12} duration={320} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: colors.successLight }]}>
              <Users size={18} color={colors.successDark} />
            </View>
            <AnimatedNumber value={stats?.totalWorkers || 10} style={styles.cardValue} duration={900} />
            <Text style={styles.cardLabel}>{t('admin.verified_professionals')}</Text>
          </FadeInView>

          <FadeInView delay={80} distance={12} duration={320} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: colors.infoLight }]}>
              <CalendarCheck size={18} color={colors.infoDark} />
            </View>
            <AnimatedNumber value={stats?.totalBookings || 3} style={styles.cardValue} duration={900} delay={80} />
            <Text style={styles.cardLabel}>{t('admin.active_bookings')}</Text>
          </FadeInView>

          <FadeInView delay={160} distance={12} duration={320} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondaryLight }]}>
              <HeartHandshake size={18} color={colors.secondaryDark} />
            </View>
            <AnimatedNumber value={245000} prefix="₹" format={(n) => n.toLocaleString('en-IN')} duration={1100} delay={160} style={[styles.cardValue, { color: colors.secondaryDark }]} />
            <Text style={styles.cardLabel}>{t('admin.welfare_pool')}</Text>
          </FadeInView>

          <FadeInView delay={240} distance={12} duration={320} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: colors.violetLight }]}>
              <TrendingUp size={18} color={colors.violetDark} />
            </View>
            <AnimatedNumber value={160} suffix="+" duration={900} delay={240} style={[styles.cardValue, { color: colors.violetDark }]} />
            <Text style={styles.cardLabel}>{t('admin.historical_events')}</Text>
          </FadeInView>
        </View>

        {/* AI Navigation Cards */}
        <FadeInView delay={320} distance={14} duration={340}>
          <ScalePressable onPress={() => navigation.navigate('Forecast')}>
            <View style={styles.actionCard}>
              <View style={styles.actionLeft}>
                <TrendingUp size={24} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{t('admin.forecast_action_title')}</Text>
                  <Text style={styles.actionDesc}>{t('admin.forecast_action_desc')}</Text>
                </View>
              </View>
              <ArrowRight size={18} color={colors.textMuted} />
            </View>
          </ScalePressable>
        </FadeInView>

        <FadeInView delay={400} distance={14} duration={340}>
          <ScalePressable onPress={() => navigation.navigate('Allocation')}>
            <View style={styles.actionCard}>
              <View style={styles.actionLeft}>
                <ShieldCheck size={24} color={colors.info} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{t('admin.allocation_action_title')}</Text>
                  <Text style={styles.actionDesc}>{t('admin.allocation_action_desc')}</Text>
                </View>
              </View>
              <ArrowRight size={18} color={colors.textMuted} />
            </View>
          </ScalePressable>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  cardLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  actionDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16
  }
});