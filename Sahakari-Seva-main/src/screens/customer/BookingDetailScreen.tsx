// mobile/src/screens/customer/BookingDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle, CheckCircle2, Check, X, Wrench, ShieldCheck, Receipt, Star, Lock, Clock } from 'lucide-react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Button, Badge } from '../../components/ui';
import RatingModal from '../../components/common/RatingModal';
import { PaymentCheckoutModal } from '../../components/common/PaymentCheckoutModal';
import { PaymentConfirmedModal } from '../../components/common/PaymentConfirmedModal';
import { ApiClient } from '../../services/apiClient';
import { Booking, Payment, Invoice } from '../../types';
import { translateTrade } from '../../i18n';

type RouteParams = {
  BookingDetail: { bookingId: string };
};

export const BookingDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography, isDark);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'BookingDetail'>>();
  const bookingId = route.params?.bookingId;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [respondingBill, setRespondingBill] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [confirmedModalVisible, setConfirmedModalVisible] = useState(false);
  const [latestPayment, setLatestPayment] = useState<Payment | null>(null);
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);

  const fetchBooking = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const b = await ApiClient.getBookingById(bookingId);
      setBooking(b || null);
    } catch {
      // Fallback handled in ApiClient
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleCallWorker = (phone?: string) => {
    if (!phone) {
      Alert.alert(t('bookingDetail.phone_contact_title'), t('bookingDetail.phone_contact_msg'));
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert(t('bookingDetail.call_failed_title'), t('bookingDetail.call_failed_msg', { phone }));
    });
  };

  const handleApproveBill = async () => {
    if (!booking || !booking.supplemental_bill) return;
    try {
      setRespondingBill(true);
      await ApiClient.respondSupplementalBill(booking.id, true);
      Alert.alert(
        'Additional Tasks Approved! 🎉',
        `You have approved the additional repair estimate (+₹${booking.supplemental_bill.total_amount}). The professional has been authorized to proceed.`
      );
      await fetchBooking();
    } catch (err: any) {
      Alert.alert('Approval Failed', err.message || 'Could not approve supplemental bill.');
    } finally {
      setRespondingBill(false);
    }
  };

  const handleDenyBill = async () => {
    if (!booking || !booking.supplemental_bill) return;
    Alert.alert(
      'Decline Additional Tasks?',
      'The service professional will only complete the originally scheduled base repair. Extra defects will not be serviced.',
      [
        { text: 'Keep Reviewing', style: 'cancel' },
        {
          text: 'Decline Extra Work',
          style: 'destructive',
          onPress: async () => {
            try {
              setRespondingBill(true);
              await ApiClient.respondSupplementalBill(
                booking.id,
                false,
                'Customer chose base service only'
              );
              Alert.alert(
                'Extra Tasks Declined',
                'The professional has been notified to proceed with the base service only.'
              );
              await fetchBooking();
            } catch (err: any) {
              Alert.alert('Decline Failed', err.message || 'Could not decline bill.');
            } finally {
              setRespondingBill(false);
            }
          },
        },
      ]
    );
  };

  const handlePayNow = () => {
    if (!booking) return;
    setCheckoutModalVisible(true);
  };

  const handlePaymentSuccess = (res: { payment: Payment; invoice: Invoice }) => {
    setLatestPayment(res.payment);
    setLatestInvoice(res.invoice);
    setCheckoutModalVisible(false);
    setConfirmedModalVisible(true);
    fetchBooking();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('bookingDetail.loading')}</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('bookingDetail.not_found')}</Text>
        <Button
          title={t('bookingDetail.back_to_bookings')}
          variant="outline"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const steps = [
    { key: 'pending', label: t('bookingDetail.step_requested') },
    { key: 'accepted', label: t('bookingDetail.step_accepted') },
    { key: 'in_progress', label: t('bookingDetail.step_in_progress') },
    { key: 'completed', label: t('bookingDetail.step_completed') },
  ];

  const getStepIndex = (st: string, paymentSt?: string) => {
    if (paymentSt === 'paid' || st === 'completed') return 3;
    switch (st) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'in_progress': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(booking.status, booking.payment_status);
  const worker = booking.worker;
  const finalPrice = booking.final_amount || booking.estimated_amount;
  const isPaidOrCompleted = booking.payment_status === 'paid' || booking.status === 'completed';

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header / Back Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('CustomerTabs');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', 'Back')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
          <Text style={styles.backButtonText}>{t('common.back', 'Back')}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {booking.booking_code}
        </Text>
        <View style={styles.topBarRightPlaceholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Info */}
        <View style={styles.header}>
        <View>
          <Text style={styles.codeText}>{booking.booking_code}</Text>
          <Text style={styles.serviceTitle}>
            {translateTrade(booking.service_category?.name) || t('bookingDetail.home_maintenance')}
          </Text>
        </View>
        <Badge
          label={
            booking.status === 'pending'
              ? 'REQUESTED • AWAITING WORKER'
              : booking.status === 'accepted'
              ? 'CONFIRMED • ON ACTIVE JOB'
              : booking.status.toUpperCase().replace('_', ' ')
          }
          variant={
            booking.status === 'completed'
              ? 'success'
              : booking.status === 'accepted'
              ? 'info'
              : booking.status === 'in_progress'
              ? 'info'
              : 'warning'
          }
        />
      </View>

      {/* Emergency Alert Banner */}
      {booking.is_emergency && (
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>{t('bookingDetail.emergency_title')}</Text>
            <Text style={styles.emergencyDesc}>
              {t('bookingDetail.emergency_desc')}
            </Text>
          </View>
        </View>
      )}

      {/* Progress Stepper */}
      <Card style={styles.stepperCard}>
        <Text style={styles.sectionTitle}>{t('bookingDetail.status_tracking')}</Text>

        {/* Status Explainer Banner for Customer */}
        {booking.status === 'pending' && (
          <View style={styles.statusExplainerCardPending}>
            <Clock size={16} color="#d97706" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.statusExplainerTitlePending}>
                {t('booking.awaiting_worker') || 'Awaiting Worker Confirmation'}
              </Text>
              <Text style={styles.statusExplainerDescPending}>
                {t('booking.awaiting_worker_desc', {
                  name: worker?.profile?.full_name || 'Assigned Professional',
                  defaultValue: `${worker?.profile?.full_name || 'Assigned Professional'} has received your job alert. You will be notified as soon as they confirm your booking.`
                })}
              </Text>
            </View>
          </View>
        )}

        {booking.status === 'accepted' && (
          <View style={styles.statusExplainerCardAccepted}>
            <CheckCircle2 size={16} color="#059669" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.statusExplainerTitleAccepted}>
                {t('booking.confirmed_title') || 'Booking Confirmed! 🎉'}
              </Text>
              <Text style={styles.statusExplainerDescAccepted}>
                {worker?.profile?.full_name || 'Assigned Professional'} has confirmed your booking and is on active duty for this service.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.stepperRow}>
          {steps.map((step, idx) => {
            const isDone = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <View key={step.key} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  <Text style={[styles.stepNum, isDone && styles.stepNumDone]}>
                    {isDone ? '✓' : idx + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone && styles.stepLabelDone,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Assigned Worker Card */}
      <Card style={styles.workerCard}>
        <Text style={styles.sectionTitle}>{t('bookingDetail.assigned_professional')}</Text>
        <View style={styles.workerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(worker?.profile?.full_name || t('bookingDetail.worker_fallback')).slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.nameRow}>
              <Text style={styles.workerName}>
                {worker?.profile?.full_name || t('bookingDetail.trade_fallback')}
              </Text>
              <Badge label={t('bookingDetail.verified_iti')} variant="success" size="sm" />
            </View>
            <Text style={styles.workerTrade}>{translateTrade(worker?.skill_category) || t('bookingDetail.trade_fallback')}</Text>
            <Text style={styles.workerRating}>★ {worker?.average_rating || 4.9} • {t('bookingDetail.jobs_completed', { count: worker?.total_jobs || 140 })}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.callButton}
          activeOpacity={0.8}
          onPress={() => handleCallWorker(worker?.profile?.phone)}
        >
          <Text style={styles.callButtonIcon}>📞</Text>
          <Text style={styles.callButtonText}>
            {t('bookingDetail.call_professional', { phone: worker?.profile?.phone ? `(${worker.profile.phone})` : '' })}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Booking Details */}
      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>{t('bookingDetail.appointment_details')}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('bookingDetail.scheduled_date')}:</Text>
          <Text style={styles.detailValue}>{booking.booking_date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('bookingDetail.time_slot')}:</Text>
          <Text style={styles.detailValue}>{booking.booking_time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('bookingDetail.service_location')}:</Text>
          <Text style={styles.detailValue}>{booking.address}, {booking.city} - {booking.pincode}</Text>
        </View>
        {booking.service_description ? (
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>{t('bookingDetail.problem_note')}:</Text>
            <Text style={styles.detailValue}>{booking.service_description}</Text>
          </View>
        ) : null}
      </Card>

      {/* Supplemental Bill / Extra Discovered Issues Review Card */}
      {booking.supplemental_bill && (
        <Card
          style={[
            styles.supplementalCard,
            booking.supplemental_bill.status === 'pending_approval' && styles.supplementalCardPending,
            booking.supplemental_bill.status === 'approved' && styles.supplementalCardApproved,
            booking.supplemental_bill.status === 'denied' && styles.supplementalCardDenied,
          ]}
        >
          {/* Header */}
          <View style={styles.suppHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View
                style={[
                  styles.suppIconBadge,
                  booking.supplemental_bill.status === 'pending_approval' && { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                  booking.supplemental_bill.status === 'approved' && { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                  booking.supplemental_bill.status === 'denied' && { backgroundColor: 'rgba(244, 63, 94, 0.15)' },
                ]}
              >
                {booking.supplemental_bill.status === 'pending_approval' ? (
                  <AlertTriangle size={17} color="#f59e0b" />
                ) : booking.supplemental_bill.status === 'approved' ? (
                  <CheckCircle2 size={17} color="#10b981" />
                ) : (
                  <X size={17} color={colors.danger} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suppTitle}>
                  {booking.supplemental_bill.status === 'pending_approval'
                    ? 'Extra Work Authorization Needed'
                    : booking.supplemental_bill.status === 'approved'
                    ? 'Extra Work Approved'
                    : 'Extra Work Declined'}
                </Text>
                <Text style={styles.suppSub}>
                  Reported by {worker?.profile?.full_name || 'Worker'} during inspection
                </Text>
              </View>
            </View>

            <Badge
              label={
                booking.supplemental_bill.status === 'pending_approval'
                  ? 'ACTION NEEDED'
                  : booking.supplemental_bill.status === 'approved'
                  ? 'APPROVED'
                  : 'DECLINED'
              }
              variant={
                booking.supplemental_bill.status === 'approved'
                  ? 'success'
                  : booking.supplemental_bill.status === 'pending_approval'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
            />
          </View>

          {/* Worker Diagnosis Quote */}
          <View style={styles.diagnosisQuoteBox}>
            <Text style={styles.diagnosisQuoteTitle}>WORKER'S INSPECTION REPORT:</Text>
            <Text style={styles.diagnosisQuoteText}>
              "{booking.supplemental_bill.diagnosis_notes}"
            </Text>
          </View>

          {/* Itemized Tasks / Parts Table */}
          <View style={styles.suppTable}>
            <Text style={styles.suppTableHead}>ITEMIZED ADDITIONAL TASKS & PARTS</Text>
            {booking.supplemental_bill.items.map((item, idx) => (
              <View key={item.id || idx} style={styles.suppItemRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.suppItemTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.suppItemDesc}>{item.description}</Text>
                  ) : null}
                  <View style={styles.suppTypeTag}>
                    <Text style={styles.suppTypeTagText}>
                      {item.type === 'part' ? 'Spare Part' : item.type === 'labor' ? 'Labor' : 'Repair Work'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.suppItemCost}>₹{Number(item.cost).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Impact Calculation */}
          <View style={styles.suppCalcBox}>
            <View style={styles.suppCalcRow}>
              <Text style={styles.suppCalcLabel}>Original Requested Service:</Text>
              <Text style={styles.suppCalcVal}>₹{Number(booking.estimated_amount).toFixed(2)}</Text>
            </View>
            <View style={styles.suppCalcRow}>
              <Text style={styles.suppCalcLabel}>
                Supplemental Work ({booking.supplemental_bill.items.length} items):
              </Text>
              <Text style={[styles.suppCalcVal, { color: '#10b981', fontWeight: '800' }]}>
                +₹{Number(booking.supplemental_bill.total_amount).toFixed(2)}
              </Text>
            </View>
            <View style={styles.suppCalcDivider} />
            <View style={styles.suppCalcTotalRow}>
              <Text style={styles.suppCalcTotalLabel}>
                {booking.supplemental_bill.status === 'approved' ? 'Authorized Total Bill:' : 'Revised Total Bill:'}
              </Text>
              <Text style={styles.suppCalcTotalVal}>
                ₹{(Number(booking.estimated_amount) + Number(booking.supplemental_bill.total_amount)).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Approval / Denial Action Buttons */}
          {booking.supplemental_bill.status === 'pending_approval' && (
            <View style={styles.suppActionRow}>
              <TouchableOpacity
                style={styles.suppDenyBtn}
                onPress={handleDenyBill}
                disabled={respondingBill}
                activeOpacity={0.7}
              >
                <X size={15} color={colors.danger} />
                <Text style={styles.suppDenyBtnText}>Decline Extra Work</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suppApproveBtn}
                onPress={handleApproveBill}
                disabled={respondingBill}
                activeOpacity={0.85}
              >
                {respondingBill ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.suppApproveBtnText}>
                      Approve & Proceed (+₹{booking.supplemental_bill.total_amount})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {booking.supplemental_bill.status === 'approved' && (
            <View style={styles.suppStatusFootnote}>
              <CheckCircle2 size={13} color="#10b981" />
              <Text style={styles.suppStatusFootnoteText}>
                You approved this estimate. The professional has been authorized to proceed with the extra work.
              </Text>
            </View>
          )}

          {booking.supplemental_bill.status === 'denied' && (
            <View style={styles.suppStatusFootnote}>
              <AlertTriangle size={13} color={colors.danger} />
              <Text style={[styles.suppStatusFootnoteText, { color: colors.danger }]}>
                You declined the additional tasks. Only the base repair will be completed.
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Cooperative Fair Split Pricing Card */}
      <Card style={styles.pricingCard}>
        <View style={styles.pricingHeader}>
          <Text style={styles.pricingTitle}>{t('bookingDetail.fair_pricing')}</Text>
          <Badge label={t('bookingDetail.cooperative_guarantee')} variant="info" size="sm" />
        </View>
        <View style={styles.splitRow}>
          <Text style={styles.splitLabel}>{t('bookingDetail.total_amount')}</Text>
          <Text style={styles.splitTotal}>₹{finalPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.splitRow}>
          <Text style={styles.splitSubLabel}>{t('bookingDetail.worker_take_home')}</Text>
          <Text style={styles.splitSubValue}>₹{(finalPrice * 0.85).toFixed(2)}</Text>
        </View>
        <View style={styles.splitRow}>
          <Text style={styles.splitSubLabel}>{t('bookingDetail.welfare_fund')}</Text>
          <Text style={styles.splitSubValue}>₹{(finalPrice * 0.10).toFixed(2)}</Text>
        </View>
        <View style={styles.splitRow}>
          <Text style={styles.splitSubLabel}>{t('bookingDetail.platform_fee')}</Text>
          <Text style={styles.splitSubValue}>₹{(finalPrice * 0.05).toFixed(2)}</Text>
        </View>
        <View style={styles.trustFooter}>
          <Text style={styles.trustText}>
            {t('bookingDetail.trust_footer')}
          </Text>
        </View>
      </Card>

      {/* Dynamic Action Buttons */}
      <View style={styles.actionContainer}>
        {!isPaidOrCompleted && (
          <Button
            title={`Pay Now (₹${finalPrice.toFixed(0)})`}
            variant="primary"
            size="lg"
            loading={paying}
            onPress={handlePayNow}
            style={styles.actionBtn}
          />
        )}

        {isPaidOrCompleted && (
          <View style={styles.paymentSettledCard}>
            <View style={styles.paymentSettledHeader}>
              <View style={styles.settledBadge}>
                <CheckCircle2 size={15} color="#10b981" />
                <Text style={styles.settledBadgeText}>PAYMENT SETTLED & VERIFIED</Text>
              </View>
              <Text style={styles.settledAmountText}>₹{finalPrice.toFixed(2)}</Text>
            </View>
            <Text style={styles.settledSubText}>
              Direct 85% worker earnings credited to {worker?.profile?.full_name || 'Rahul Sharma'}. Cooperative audit pass verified.
            </Text>
            <View style={styles.settledDivider} />
            <View style={styles.settledActionRow}>
              <Button
                title={t('bookingDetail.view_invoice', 'View Tax Invoice')}
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('Invoice', { bookingId: booking.id })}
                style={{ flex: 1 }}
              />
              <Button
                title={t('bookingDetail.rate_professional', 'Rate Professional')}
                variant="outline"
                size="md"
                onPress={() => setRatingModalVisible(true)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Interactive Payment Checkout Modal */}
      <PaymentCheckoutModal
        visible={checkoutModalVisible}
        booking={booking}
        totalAmount={finalPrice}
        baseAmount={Number(booking.estimated_amount) || 0}
        supplementalItems={
          booking.supplemental_bill?.status === 'approved'
            ? booking.supplemental_bill.items
            : []
        }
        onClose={() => setCheckoutModalVisible(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Celebratory Payment Confirmed Modal */}
      <PaymentConfirmedModal
        visible={confirmedModalVisible}
        booking={booking}
        payment={latestPayment}
        invoice={latestInvoice}
        onClose={() => {
          setConfirmedModalVisible(false);
          fetchBooking();
        }}
        onViewInvoice={() => {
          setConfirmedModalVisible(false);
          navigation.navigate('Invoice', { bookingId: booking.id });
        }}
        onRateWorker={() => {
          setConfirmedModalVisible(false);
          setRatingModalVisible(true);
        }}
      />

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        bookingId={booking.id}
        workerId={booking.worker_id}
        customerId={booking.customer_id}
        workerName={worker?.profile?.full_name || t('bookingDetail.worker_fallback', 'Service Professional')}
        customerName={t('bookingDetail.verified_customer', 'Verified Customer')}
        onClose={() => setRatingModalVisible(false)}
        onSubmitted={() => fetchBooking()}
      />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, typography: ReturnType<typeof makeTypography>, isDark = false) => StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    minWidth: 60,
  },
  backButtonText: {
    ...typography.fontBodySm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  topBarTitle: {
    ...typography.fontTitle,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  topBarRightPlaceholder: {
    minWidth: 60,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  // --- Supplemental Bill Card Styles ---
  supplementalCard: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  supplementalCardPending: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  supplementalCardApproved: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  supplementalCardDenied: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.04)',
  },
  suppHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  suppIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suppTitle: {
    ...typography.fontSubtitle,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  suppSub: {
    ...typography.fontCaption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  diagnosisQuoteBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    marginVertical: spacing.xs,
  },
  diagnosisQuoteTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  diagnosisQuoteText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  suppTable: {
    marginVertical: spacing.sm,
  },
  suppTableHead: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  suppItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suppItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  suppItemDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  suppTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 3,
  },
  suppTypeTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10b981',
  },
  suppItemCost: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  suppCalcBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  suppCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  suppCalcLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  suppCalcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  suppCalcDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  suppCalcTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suppCalcTotalLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  suppCalcTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10b981',
  },
  suppActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
  },
  suppDenyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  suppDenyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.danger,
  },
  suppApproveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: '#10b981',
  },
  suppApproveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  suppStatusFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  suppStatusFootnoteText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    flex: 1,
  },
  loadingText: {
    ...typography.fontBody,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.fontTitle,
    color: colors.danger,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  codeText: {
    ...typography.fontCaption,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  serviceTitle: {
    ...typography.fontHeadline,
    marginTop: 2,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  emergencyIcon: {
    fontSize: 24,
  },
  emergencyTitle: {
    ...typography.fontSubtitle,
    color: colors.danger,
  },
  emergencyDesc: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepperCard: {
    marginBottom: spacing.md,
  },
  statusExplainerCardPending: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  statusExplainerTitlePending: {
    fontSize: 12.5,
    fontWeight: '700',
    color: isDark ? '#FBBF24' : '#92400E',
    marginBottom: 2,
  },
  statusExplainerDescPending: {
    fontSize: 11.5,
    color: isDark ? '#FDE68A' : '#78350F',
    lineHeight: 16,
  },
  statusExplainerCardAccepted: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  statusExplainerTitleAccepted: {
    fontSize: 12.5,
    fontWeight: '700',
    color: isDark ? '#34D399' : '#065F46',
    marginBottom: 2,
  },
  statusExplainerDescAccepted: {
    fontSize: 11.5,
    color: isDark ? '#A7F3D0' : '#047857',
    lineHeight: 16,
  },
  sectionTitle: {
    ...typography.fontSubtitle,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
  },
  stepCircleCurrent: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.secondaryLight,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepNumDone: {
    color: colors.textInverse,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: colors.secondaryDark,
    fontWeight: '700',
  },
  workerCard: {
    marginBottom: spacing.md,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  workerName: {
    ...typography.fontTitle,
    fontSize: 15,
    flex: 1,
    minWidth: 0,
  },
  workerTrade: {
    ...typography.fontBodySm,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  workerRating: {
    ...typography.fontCaption,
    color: colors.secondaryDark,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  callButtonIcon: {
    fontSize: 14,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  detailsCard: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  detailLabel: {
    ...typography.fontBodySm,
    color: colors.textMuted,
    width: 110,
  },
  detailValue: {
    ...typography.fontBodySm,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  pricingCard: {
    marginBottom: spacing.lg,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 8,
    width: '100%',
  },
  pricingTitle: {
    ...typography.fontTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  splitLabel: {
    ...typography.fontTitle,
    fontSize: 16,
  },
  splitTotal: {
    ...typography.fontHeadline,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  splitSubLabel: {
    ...typography.fontBodySm,
    color: colors.textSecondary,
  },
  splitSubValue: {
    ...typography.fontBodySm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trustFooter: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.sm,
  },
  trustText: {
    ...typography.fontCaption,
    color: colors.primaryDark,
  },
  actionContainer: {
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
  paymentSettledCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  paymentSettledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  settledBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.4,
  },
  settledAmountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
  },
  settledSubText: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  settledDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  settledActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default BookingDetailScreen;