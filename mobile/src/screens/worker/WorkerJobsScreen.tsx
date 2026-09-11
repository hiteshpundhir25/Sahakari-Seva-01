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
import { Booking, ExtraTaskItem } from '../../types';
import { Clock, MapPin, Check, X, Zap, Wrench, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { SupplementalBillModal } from '../../components/worker/SupplementalBillModal';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const WorkerJobsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: false });
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJobForBill, setSelectedJobForBill] = useState<Booking | null>(null);
  const [billModalVisible, setBillModalVisible] = useState(false);

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
      Alert.alert('Update Failed', err.message);
    }
  };

  const handleOpenBillModal = (job: Booking) => {
    setSelectedJobForBill(job);
    setBillModalVisible(true);
  };

  const handleSubmitSupplementalBill = async (billData: {
    diagnosis_notes: string;
    items: ExtraTaskItem[];
  }) => {
    if (!selectedJobForBill) return;
    try {
      await ApiClient.sendSupplementalBill(selectedJobForBill.id, billData);
      const totalExtra = billData.items.reduce((s, it) => s + (Number(it.cost) || 0), 0);
      Alert.alert(
        'Estimate Sent to Customer',
        `Supplemental bill for ₹${totalExtra} has been sent to ${selectedJobForBill.customer?.full_name || 'Customer'}'s profile. Once approved, you can proceed with the repairs.`
      );
      loadJobs();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send supplemental bill.');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('tabs.jobs')}
        subtitle={t('worker.assigned_bookings', { count: jobs.length })}
        showBack={true}
        onBack={handleBack}
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

              {/* Supplemental Bill Status or Trigger */}
              {(job.status === 'accepted' || job.status === 'in_progress') && (
                <View style={styles.supplementalSection}>
                  {job.supplemental_bill ? (
                    <View
                      style={[
                        styles.sbBanner,
                        job.supplemental_bill.status === 'pending_approval' && styles.sbBannerPending,
                        job.supplemental_bill.status === 'approved' && styles.sbBannerApproved,
                        job.supplemental_bill.status === 'denied' && styles.sbBannerDenied,
                      ]}
                    >
                      <View style={styles.sbBannerHeader}>
                        {job.supplemental_bill.status === 'pending_approval' && (
                          <>
                            <Clock size={13} color="#f59e0b" />
                            <Text style={[styles.sbStatusTitle, { color: '#f59e0b' }]}>
                              Supplemental Bill Pending (₹{job.supplemental_bill.total_amount})
                            </Text>
                          </>
                        )}
                        {job.supplemental_bill.status === 'approved' && (
                          <>
                            <CheckCircle2 size={13} color="#10b981" />
                            <Text style={[styles.sbStatusTitle, { color: '#10b981' }]}>
                              Customer Approved (+₹{job.supplemental_bill.total_amount})
                            </Text>
                          </>
                        )}
                        {job.supplemental_bill.status === 'denied' && (
                          <>
                            <AlertCircle size={13} color={colors.danger} />
                            <Text style={[styles.sbStatusTitle, { color: colors.danger }]}>
                              Customer Declined Extra Work
                            </Text>
                          </>
                        )}
                      </View>

                      <Text style={styles.sbDiagnosisText} numberOfLines={2}>
                        "{job.supplemental_bill.diagnosis_notes}"
                      </Text>

                      <View style={styles.sbItemsWrap}>
                        {job.supplemental_bill.items.map((it) => (
                          <View key={it.id} style={styles.sbItemChip}>
                            <Text style={styles.sbItemChipText}>
                              {it.title}: <Text style={{ fontWeight: '800' }}>₹{it.cost}</Text>
                            </Text>
                          </View>
                        ))}
                      </View>

                      {job.supplemental_bill.status === 'approved' && (
                        <Text style={styles.sbInstructionProceed}>
                          👉 Customer approved this work. Please proceed with all tasks!
                        </Text>
                      )}
                      {job.supplemental_bill.status === 'denied' && (
                        <Text style={styles.sbInstructionDenied}>
                          👉 Customer opted for base service only. Do not perform extra tasks.
                        </Text>
                      )}
                      {job.supplemental_bill.status === 'pending_approval' && (
                        <Text style={styles.sbInstructionPending}>
                          ⏳ Sent to customer's phone. Awaiting approval before proceeding.
                        </Text>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.extraBillTriggerBtn}
                      onPress={() => handleOpenBillModal(job)}
                      activeOpacity={0.75}
                    >
                      <Wrench size={13} color="#10b981" />
                      <Text style={styles.extraBillTriggerText}>
                        Diagnose Extra Issues & Bill Customer
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {job.status === 'in_progress' && (
                <ScalePressable onPress={() => handleUpdateStatus(job.id, 'completed')}>
                  <View style={[styles.progressBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.progressBtnText}>
                      {t('worker.mark_completed')} (₹{job.final_amount})
                    </Text>
                  </View>
                </ScalePressable>
              )}
            </View>
            </FadeInView>
          ))
        )}
      </ScrollView>

      {/* Supplemental Bill Builder Modal */}
      <SupplementalBillModal
        visible={billModalVisible}
        booking={selectedJobForBill}
        onClose={() => setBillModalVisible(false)}
        onSubmit={handleSubmitSupplementalBill}
      />
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
  },
  // --- Supplemental Bill Styles ---
  supplementalSection: {
    marginTop: 8,
  },
  extraBillTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: 6,
  },
  extraBillTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  sbBanner: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  sbBannerPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  sbBannerApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  sbBannerDenied: {
    backgroundColor: 'rgba(244, 63, 94, 0.10)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  sbBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sbStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  sbDiagnosisText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  sbItemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  sbItemChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  sbItemChipText: {
    fontSize: 10.5,
    color: colors.textPrimary,
  },
  sbInstructionProceed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  sbInstructionDenied: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 2,
  },
  sbInstructionPending: {
    fontSize: 10.5,
    color: '#f59e0b',
    marginTop: 2,
  },
});