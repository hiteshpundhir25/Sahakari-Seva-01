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
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Button, Badge } from '../../components/ui';
import RatingModal from '../../components/common/RatingModal';
import { ApiClient } from '../../services/apiClient';
import { Booking } from '../../types';
import { translateTrade } from '../../i18n';

type RouteParams = {
  BookingDetail: { bookingId: string };
};

export const BookingDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'BookingDetail'>>();
  const bookingId = route.params?.bookingId;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

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

  const handlePayNow = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const res = await ApiClient.processPayment({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        worker_id: booking.worker_id,
        amount: booking.final_amount || booking.estimated_amount,
        payment_method: 'demo',
      });

      Alert.alert(
        t('bookingDetail.payment_success'),
        t('bookingDetail.payment_success_msg', {
          amount: res.invoice.total_amount.toFixed(2),
          workerAmt: res.invoice.worker_amount.toFixed(2),
          welfareAmt: res.invoice.cooperative_share.toFixed(2),
          platformAmt: res.invoice.platform_fee.toFixed(2),
        }),
        [
          {
            text: t('bookingDetail.rate_worker'),
            onPress: () => setRatingModalVisible(true),
          },
          {
            text: t('bookingDetail.view_invoice_btn'),
            onPress: () => navigation.navigate('Invoice', { bookingId: booking.id }),
          },
        ]
      );

      // Refresh booking state
      await fetchBooking();
    } catch (err: any) {
      Alert.alert(t('bookingDetail.payment_failed_title'), err.message || t('bookingDetail.payment_failed_msg'));
    } finally {
      setPaying(false);
    }
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

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'in_progress': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(booking.status);
  const worker = booking.worker;
  const finalPrice = booking.final_amount || booking.estimated_amount;

  return (
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
          label={booking.status.toUpperCase().replace('_', ' ')}
          variant={
            booking.status === 'completed'
              ? 'success'
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
        {booking.status !== 'completed' && (
          <Button
            title={t('bookingDetail.pay_now', { amount: finalPrice.toFixed(0) })}
            variant="primary"
            size="lg"
            loading={paying}
            onPress={handlePayNow}
            style={styles.actionBtn}
          />
        )}

        {booking.status === 'completed' && (
          <>
            <Button
              title={t('bookingDetail.view_invoice')}
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('Invoice', { bookingId: booking.id })}
              style={styles.actionBtn}
            />
            <Button
              title={t('bookingDetail.rate_professional')}
              variant="outline"
              size="md"
              onPress={() => setRatingModalVisible(true)}
              style={styles.actionBtn}
            />
          </>
        )}
      </View>

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        bookingId={booking.id}
        workerId={booking.worker_id}
        customerId={booking.customer_id}
        workerName={worker?.profile?.full_name || t('bookingDetail.worker_fallback')}
        customerName={t('bookingDetail.verified_customer')}
        onClose={() => setRatingModalVisible(false)}
        onSubmitted={() => fetchBooking()}
      />
    </ScrollView>
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
  centerContainer: {
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
});

export default BookingDetailScreen;