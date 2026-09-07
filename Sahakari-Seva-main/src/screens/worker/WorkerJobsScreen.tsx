// ==============================================================================
// WORKER JOBS SCREEN — INCOMING REQUESTS & ACCEPT/DECLINE ACTIONS
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { Booking } from '../../types';
import { Clock, MapPin, Check, X, Zap } from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

export const WorkerJobsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001');
      setJobs(data);
    } catch (err) {
      console.warn('Jobs load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await ApiClient.updateBookingStatus(bookingId, newStatus);
      Alert.alert(t('worker.status_updated_title'), t('worker.status_updated_msg', { status: newStatus }));
      loadJobs();
    } catch (err: any) {
      Alert.alert(t('booking.error_title'), err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('tabs.jobs')}
        subtitle={t('worker.assigned_bookings', { count: jobs.length })}
        onPressLanguage={() => {}}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadJobs(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 40 }} />
        ) : jobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t('worker.no_requests_title')}</Text>
            <Text style={styles.emptySubtitle}>{t('worker.no_requests_sub')}</Text>
          </View>
        ) : (
          jobs.map((job, idx) => (
            <FadeInView key={job.id} delay={idx * 70} distance={14} duration={320}>
            <View style={styles.jobCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.codeRow}>
                    <Text style={styles.jobCode}>{job.booking_code}</Text>
                    {job.is_emergency && (
                      <View style={styles.emergencyPill}>
                        <Zap size={10} color={colors.danger} />
                        <Text style={styles.emergencyPillText}>{t('worker.emergency')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.timeText}>
                    <Clock size={11} color={colors.textMuted} /> {job.booking_date} at {job.booking_time}
                  </Text>
                </View>

                <View style={styles.amountBadge}>
                  <Text style={styles.amountText}>₹{job.final_amount}</Text>
                </View>
              </View>

              <Text style={styles.descText} numberOfLines={3}>
                {job.service_description}
              </Text>

              <View style={styles.addressRow}>
                <MapPin size={13} color={colors.textMuted} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {job.address} ({job.pincode})
                </Text>
              </View>

              {/* Action Buttons for Pending Requests */}
              {job.status === 'pending' && (
                <View style={styles.actionRow}>
                  <ScalePressable onPress={() => handleUpdateStatus(job.id, 'rejected')} style={styles.actionBtn}>
                    <View style={[styles.actionBtnInner, styles.declineBtn]}>
                      <X size={14} color={colors.danger} />
                      <Text style={styles.declineText}>{t('worker.decline_btn')}</Text>
                    </View>
                  </ScalePressable>

                  <ScalePressable onPress={() => handleUpdateStatus(job.id, 'accepted')} style={styles.actionBtn}>
                    <View style={[styles.actionBtnInner, styles.acceptBtn]}>
                      <Check size={14} color={colors.textInverse} />
                      <Text style={styles.acceptText}>{t('worker.accept_btn')}</Text>
                    </View>
                  </ScalePressable>
                </View>
              )}

              {/* In Progress Actions */}
              {job.status === 'accepted' && (
                <ScalePressable onPress={() => handleUpdateStatus(job.id, 'in_progress')}>
                  <View style={styles.progressBtn}>
                    <Text style={styles.progressBtnText}>{t('worker.start_service')}</Text>
                  </View>
                </ScalePressable>
              )}

              {job.status === 'in_progress' && (
                <ScalePressable onPress={() => handleUpdateStatus(job.id, 'completed')}>
                  <View style={[styles.progressBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.progressBtnText}>{t('worker.mark_completed')}</Text>
                  </View>
                </ScalePressable>
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
  jobCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  jobCode: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  emergencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3
  },
  emergencyPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.danger
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3
  },
  amountBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  amountText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.successDark
  },
  descText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12
  },
  addressText: {
    fontSize: 11,
    color: colors.textMuted
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  declineBtn: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger
  },
  declineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger
  },
  acceptBtn: {
    backgroundColor: colors.primary
  },
  acceptText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse
  },
  progressBtn: {
    backgroundColor: colors.info,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6
  },
  progressBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center'
  }
});