// mobile/src/screens/worker/WorkerWelfareScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Badge } from '../../components/ui';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { Welfare, Worker } from '../../types';
import { useTranslation } from 'react-i18next';
import { FadeInView, AnimatedNumber } from '../../animations';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const WorkerWelfareScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: false });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography, isDark);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [welfareList, setWelfareList] = useState<Welfare[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [w, wel] = await Promise.all([
          ApiClient.getWorkerById('w0000000-0000-0000-0000-000000000001'),
          ApiClient.getWelfare('w0000000-0000-0000-0000-000000000001'),
        ]);
        setWorker(w);
        setWelfareList(wel);
      } catch {
        // Handled in ApiClient fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalEarnings = worker?.total_earnings || 74200;
  const totalWelfareContribution = welfareList.reduce(
    (sum, item) => sum + (item.contribution_balance || 0),
    0
  ) || 14920;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('welfare.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <Header
        title={t('welfare.title')}
        subtitle={t('welfare.subtitle')}
        showBack={true}
        onBack={handleBack}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Dignity Badge Banner */}
        <FadeInView distance={12} duration={320}>
          <View style={styles.header}>
            <Text style={styles.badgeText}>{t('welfare.dignity_badge')}</Text>
          </View>
        </FadeInView>

      {/* Primary KPI Cards */}
      <View style={styles.kpiContainer}>
        {/* Welfare Balance Card */}
        <FadeInView delay={90} distance={14} duration={340}>
          <Card style={styles.welfareCard}>
            <Text style={styles.welfareLabel}>{t('welfare.accumulated_balance')}</Text>
            <AnimatedNumber
              value={totalWelfareContribution}
              prefix="₹"
              format={(n) => n.toFixed(2)}
              duration={1100}
              style={styles.welfareAmount}
            />
            <View style={styles.welfarePill}>
              <Text style={styles.welfarePillText}>{t('welfare.ring_fenced')}</Text>
            </View>
          </Card>
        </FadeInView>

        {/* Direct Earnings Card */}
        <FadeInView delay={180} distance={14} duration={340}>
          <Card style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <View>
                <Text style={styles.earningsLabel}>{t('welfare.lifetime_earnings')}</Text>
                <AnimatedNumber
                  value={totalEarnings}
                  prefix="₹"
                  format={(n) => n.toFixed(2)}
                  duration={1100}
                  delay={200}
                  style={styles.earningsAmount}
                />
              </View>
              <Badge label={t('welfare.zero_commission')} variant="success" size="sm" />
            </View>
            <Text style={styles.earningsNote}>{t('welfare.earnings_note')}</Text>
          </Card>
        </FadeInView>
      </View>

      {/* Active Social Security Policies */}
      <FadeInView delay={260} distance={12} duration={340}>
        <Text style={styles.sectionHeader}>{t('welfare.schemes_header')}</Text>
      </FadeInView>

      {welfareList.map((scheme, idx) => (
        <FadeInView key={scheme.id} delay={300 + idx * 90} distance={14} duration={340}>
          <Card style={styles.schemeCard}>
            <View style={styles.schemeHeader}>
              <View style={{ flex: 1 }}>
                <Badge label={scheme.enrollment_status.toUpperCase()} variant="success" size="sm" />
                <Text style={styles.schemeTitle}>{scheme.welfare_scheme}</Text>
              </View>
              <Text style={styles.schemeIcon}>🏛️</Text>
            </View>

            <View style={styles.schemeDetails}>
              <View style={styles.schemeDetailRow}>
                <Text style={styles.detailKey}>{t('welfare.coverage_status')}:</Text>
                <Text style={styles.detailValSuccess}>{scheme.insurance_status}</Text>
              </View>
              <View style={styles.schemeDetailRow}>
                <Text style={styles.detailKey}>{t('welfare.issuing_authority')}:</Text>
                <Text style={styles.detailVal}>{scheme.insurance_provider}</Text>
              </View>
              <View style={styles.schemeDetailRow}>
                <Text style={styles.detailKey}>{t('welfare.policy_ref')}:</Text>
                <Text style={styles.detailValMono}>{scheme.policy_reference || 'AB-PMJAY-2026'}</Text>
              </View>
              <View style={styles.schemeDetailRow}>
                <Text style={styles.detailKey}>{t('welfare.valid_until')}:</Text>
                <Text style={styles.detailVal}>{scheme.valid_until || '2027-03-31'}</Text>
              </View>
            </View>

            <View style={styles.schemeBalanceRow}>
              <Text style={styles.balanceLabel}>{t('welfare.scheme_balance')}:</Text>
              <Text style={styles.balanceVal}>₹{scheme.contribution_balance.toFixed(2)}</Text>
            </View>
          </Card>
        </FadeInView>
      ))}

      {/* Welfare Pledge Banner */}
      <FadeInView delay={400} distance={14} duration={340}>
        <View style={styles.pledgeBanner}>
          <Text style={styles.pledgeIcon}>🤝</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pledgeTitle}>{t('welfare.pledge_title')}</Text>
            <Text style={styles.pledgeText}>{t('welfare.pledge_text')}</Text>
          </View>
        </View>
      </FadeInView>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, typography: ReturnType<typeof makeTypography>, isDark: boolean) => StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.fontBody,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    marginBottom: spacing.md,
  },
  badgeText: {
    ...typography.fontCaption,
    color: colors.secondary,
    letterSpacing: 1,
  },
  title: {
    ...typography.fontHeadline,
    marginTop: 2,
  },
  subtitle: {
    ...typography.fontBodySm,
    marginTop: 2,
  },
  kpiContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  welfareCard: {
    backgroundColor: isDark ? '#451a03' : colors.secondaryDark,
    borderColor: colors.secondary,
    padding: spacing.lg,
  },
  welfareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.8,
  },
  welfareAmount: {
    ...typography.fontDisplay,
    fontSize: 32,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  welfarePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginTop: spacing.sm,
  },
  welfarePillText: {
    fontSize: 11,
    color: colors.textInverse,
    fontWeight: '500',
  },
  earningsCard: {
    padding: spacing.md,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  earningsLabel: {
    ...typography.fontCaption,
    color: colors.textMuted,
  },
  earningsAmount: {
    ...typography.fontHeadline,
    fontSize: 22,
    color: colors.primary,
    marginTop: 2,
  },
  earningsNote: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    ...typography.fontSubtitle,
    marginBottom: spacing.sm,
  },
  schemeCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  schemeTitle: {
    ...typography.fontSubtitle,
    marginTop: spacing.xs,
  },
  schemeIcon: {
    fontSize: 22,
  },
  schemeDetails: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
  },
  schemeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailKey: {
    ...typography.fontCaption,
    color: colors.textMuted,
  },
  detailVal: {
    ...typography.fontCaption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  detailValSuccess: {
    ...typography.fontCaption,
    color: colors.success,
    fontWeight: '600',
  },
  detailValMono: {
    ...typography.fontCaption,
    fontFamily: 'Courier',
    fontWeight: '600',
  },
  schemeBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceLabel: {
    ...typography.fontBodySm,
    fontWeight: '600',
  },
  balanceVal: {
    ...typography.fontSubtitle,
    color: colors.primaryDark,
  },
  pledgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pledgeIcon: {
    fontSize: 26,
  },
  pledgeTitle: {
    ...typography.fontSubtitle,
    color: colors.primaryDark,
    fontSize: 13,
  },
  pledgeText: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default WorkerWelfareScreen;