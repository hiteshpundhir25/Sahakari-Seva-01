// mobile/src/screens/admin/AdminVerificationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Button, Badge, EmptyState } from '../../components/ui';
import { ApiClient } from '../../services/apiClient';
import { Worker } from '../../types';
import { useTranslation } from 'react-i18next';
import { FadeInView } from '../../animations';
import { translateTrade } from '../../i18n';
import { Header } from '../../components/common/Header';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const AdminVerificationScreen: React.FC = () => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'AdminDashboard', isHome: false });
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const all = await ApiClient.getWorkers();
      setWorkers(all);
    } catch {
      // Handled in ApiClient fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const pendingWorkers = workers.filter(w => w.verification_status === 'pending');
  const verifiedWorkers = workers.filter(w => w.verification_status === 'verified');

  const handleApprove = async (worker: Worker) => {
    setActionInProgress(worker.id);
    try {
      await ApiClient.verifyWorker(
        worker.id,
        'verified',
        'Verified by Cooperative Secretariat. National trade certificate verified.'
      );
      Alert.alert(
        t('admin.approve_success_title'),
        t('admin.approve_success_msg', { name: worker.profile?.full_name || t('bookingDetail.worker_fallback') })
      );
      // Update local state
      setWorkers(prev =>
        prev.map(w =>
          w.id === worker.id ? { ...w, verification_status: 'verified' } : w
        )
      );
    } catch (err: any) {
      Alert.alert(t('admin.approval_failed'), err.message || t('admin.error_approving'));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (worker: Worker) => {
    Alert.alert(
      t('admin.confirm_reject'),
      t('admin.confirm_reject_msg', { name: worker.profile?.full_name }),
      [
        { text: t('admin.cancel'), style: 'cancel' },
        {
          text: t('admin.reject_action'),
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(worker.id);
            try {
              await ApiClient.verifyWorker(
                worker.id,
                'rejected',
                'Trade certification document does not meet federation criteria.'
              );
              Alert.alert(t('admin.application_rejected'), t('admin.application_rejected_msg'));
              setWorkers(prev =>
                prev.map(w =>
                  w.id === worker.id ? { ...w, verification_status: 'rejected' } : w
                )
              );
            } catch (err: any) {
              Alert.alert(t('admin.error_title'), err.message || t('admin.error_rejecting'));
            } finally {
              setActionInProgress(null);
            }
          },
        },
      ]
    );
  };

  const displayedWorkers = activeTab === 'pending' ? pendingWorkers : verifiedWorkers;

  return (
    <View style={styles.container}>
      <Header
        title={t('tabs.verify_kyc')}
        subtitle={t('admin.verification_sub')}
        showBack={true}
        onBack={handleBack}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Governance Badge Banner */}
        <FadeInView distance={12} duration={320}>
          <View style={styles.header}>
            <Text style={styles.badgeText}>{t('admin.governance_badge')}</Text>
          </View>
        </FadeInView>

      {/* Segmented Control Tabs */}
      <FadeInView delay={70} distance={10} duration={300}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('pending')}
            style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              {t('admin.pending_review', { count: pendingWorkers.length })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('verified')}
            style={[styles.tabBtn, activeTab === 'verified' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'verified' && styles.tabTextActive]}>
              {t('admin.verified_count', { count: verifiedWorkers.length })}
            </Text>
          </TouchableOpacity>
        </View>
      </FadeInView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('admin.loading_queue')}</Text>
        </View>
      ) : displayedWorkers.length === 0 ? (
        <EmptyState
          icon={activeTab === 'pending' ? '✅' : '👷'}
          title={activeTab === 'pending' ? t('admin.all_clean') : t('admin.no_verified')}
          message={
            activeTab === 'pending'
              ? t('admin.no_pending_msg')
              : t('admin.no_verified_msg')
          }
        />
      ) : (
        displayedWorkers.map((worker, idx) => {
          const isPending = worker.verification_status === 'pending';
          const isProcessing = actionInProgress === worker.id;

          return (
            <FadeInView key={worker.id} delay={140 + idx * 70} distance={14} duration={320}>
            <Card style={styles.workerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.workerIdentity}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {(worker.profile?.full_name || 'Worker').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.workerName}>{worker.profile?.full_name || 'Arjun Meena'}</Text>
                    <Text style={styles.workerCode}>
                      {worker.worker_code} • {worker.profile?.phone || '+91 98114 77889'}
                    </Text>
                  </View>
                </View>
                <Badge
                  label={worker.verification_status.toUpperCase()}
                  variant={isPending ? 'warning' : 'success'}
                />
              </View>

              {/* Trade & Experience */}
              <View style={styles.tradeRow}>
                <View style={styles.tradeBox}>
                  <Text style={styles.tradeLabel}>{t('admin.primary_trade')}</Text>
                  <Text style={styles.tradeValue}>{translateTrade(worker.skill_category)}</Text>
                </View>
                <View style={styles.tradeBox}>
                  <Text style={styles.tradeLabel}>{t('admin.experience')}</Text>
                  <Text style={styles.tradeValue}>{worker.experience_years} {t('admin.years_label')}</Text>
                </View>
                <View style={styles.tradeBox}>
                  <Text style={styles.tradeLabel}>{t('admin.base_rate')}</Text>
                  <Text style={styles.tradeValue}>₹{worker.hourly_or_base_rate}/hr</Text>
                </View>
              </View>

              {/* Certification Box */}
              <View style={styles.certBox}>
                <Text style={styles.certIcon}>📜</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle}>
                    {worker.certification_name || 'National Trade Certificate (ITI)'}
                  </Text>
                  <Text style={styles.certDesc}>
                    {worker.verification_notes || 'Uploaded credential document submitted for cooperative onboarding.'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons for Pending */}
              {isPending && (
                <View style={styles.actionsRow}>
                  <Button
                    title={t('admin.reject')}
                    variant="outline"
                    size="md"
                    disabled={isProcessing}
                    onPress={() => handleReject(worker)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={t('admin.approve_member')}
                    variant="primary"
                    size="md"
                    loading={isProcessing}
                    onPress={() => handleApprove(worker)}
                    style={{ flex: 1.5 }}
                  />
                </View>
              )}
            </Card>
            </FadeInView>
          );
        })
      )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, typography: ReturnType<typeof makeTypography>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  badgeText: {
    ...typography.fontCaption,
    color: colors.primary,
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm - 2,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  center: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.fontBodySm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  workerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  workerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  workerName: {
    ...typography.fontTitle,
    fontSize: 15,
  },
  workerCode: {
    ...typography.fontCaption,
    color: colors.textMuted,
  },
  tradeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  tradeBox: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.xs + 2,
    borderRadius: radii.xs,
  },
  tradeLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tradeValue: {
    ...typography.fontBodySm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 1,
  },
  certBox: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  certIcon: {
    fontSize: 20,
  },
  certTitle: {
    ...typography.fontSubtitle,
    fontSize: 12,
    color: colors.warningDark,
  },
  certDesc: {
    ...typography.fontCaption,
    color: colors.warningDark,
    fontSize: 10,
    marginTop: 1,
    opacity: 0.85,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});

export default AdminVerificationScreen;