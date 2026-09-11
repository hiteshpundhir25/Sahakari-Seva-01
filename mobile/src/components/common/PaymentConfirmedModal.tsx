// ==============================================================================
// SAHAKARI SEVA — CELEBRATORY PAYMENT CONFIRMED ANIMATED MODAL
// Matches the Flipkart & Amazon style celebratory physics of BookingConfirmedModal:
// Spring overshoot checkmark bounce, expanding radar ripples, radial confetti burst,
// Transaction ID with Copy action, completed 4-step stepper, and 85/10/5 fair wage split.
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  Check,
  ShieldCheck,
  X,
  Sparkles,
  CheckCircle2,
  Receipt,
  Star,
  Copy,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import type { Booking, Invoice, Payment } from '../../types';

interface PaymentConfirmedModalProps {
  visible: boolean;
  booking: Booking | null;
  payment: Payment | null;
  invoice: Invoice | null;
  onClose: () => void;
  onViewInvoice: () => void;
  onRateWorker: () => void;
}

// 12 radial confetti particles (burst angles, colors, and symbols)
const CONFETTI_PARTICLES = [
  { angle: 0, distance: 75, color: '#FF9933', symbol: '✦', size: 16 },
  { angle: 30, distance: 88, color: '#10B981', symbol: '●', size: 10 },
  { angle: 65, distance: 70, color: '#F59E0B', symbol: '★', size: 14 },
  { angle: 100, distance: 82, color: '#4F46E5', symbol: '◆', size: 12 },
  { angle: 135, distance: 78, color: '#EC4899', symbol: '✦', size: 15 },
  { angle: 165, distance: 85, color: '#06B6D4', symbol: '●', size: 11 },
  { angle: 195, distance: 72, color: '#FF9933', symbol: '★', size: 14 },
  { angle: 225, distance: 86, color: '#10B981', symbol: '◆', size: 13 },
  { angle: 260, distance: 80, color: '#F59E0B', symbol: '✦', size: 15 },
  { angle: 295, distance: 76, color: '#4F46E5', symbol: '●', size: 10 },
  { angle: 320, distance: 84, color: '#EC4899', symbol: '★', size: 13 },
  { angle: 345, distance: 74, color: '#06B6D4', symbol: '◆', size: 12 },
];

export const PaymentConfirmedModal: React.FC<PaymentConfirmedModalProps> = ({
  visible,
  booking,
  payment,
  invoice,
  onClose,
  onViewInvoice,
  onRateWorker,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [copiedTxn, setCopiedTxn] = useState(false);

  // Animation values
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.88)).current;
  const cardTranslateY = useRef(new Animated.Value(25)).current;

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;

  const ripple1Scale = useRef(new Animated.Value(0.6)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.8)).current;

  const ripple2Scale = useRef(new Animated.Value(0.6)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.6)).current;

  const confettiBurst = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (visible) {
      setCopiedTxn(false);

      // Reset values
      backdropAnim.setValue(0);
      cardScaleAnim.setValue(0.88);
      cardTranslateY.setValue(25);
      checkScale.setValue(0);
      checkRotate.setValue(0);
      ripple1Scale.setValue(0.6);
      ripple1Opacity.setValue(0.8);
      ripple2Scale.setValue(0.6);
      ripple2Opacity.setValue(0.6);
      confettiBurst.setValue(0);
      contentFadeAnim.setValue(0);
      contentTranslateY.setValue(15);

      // Celebratory haptics
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      const hapticTimer = setTimeout(() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      }, 240);

      // 1. Entrance backdrop and card
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // 2. Bounce scale on checkmark circle (0 -> 1.25 -> 1.0)
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 4.5,
            tension: 80,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(checkRotate, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]).start();

      // 3. Concentric radar ripples
      Animated.sequence([
        Animated.delay(160),
        Animated.parallel([
          Animated.timing(ripple1Scale, {
            toValue: 2.3,
            duration: 1100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(ripple1Opacity, {
            toValue: 0,
            duration: 1100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]).start();

      Animated.sequence([
        Animated.delay(320),
        Animated.parallel([
          Animated.timing(ripple2Scale, {
            toValue: 2.7,
            duration: 1100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(ripple2Opacity, {
            toValue: 0,
            duration: 1100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]).start();

      // 4. Confetti burst
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(confettiBurst, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // 5. Details reveal
      Animated.sequence([
        Animated.delay(280),
        Animated.parallel([
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(contentTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]).start();

      return () => clearTimeout(hapticTimer);
    }
  }, [visible]);

  if (!visible || !booking) return null;

  const totalAmount =
    payment?.amount ||
    invoice?.total_amount ||
    booking.final_amount ||
    booking.estimated_amount ||
    0;

  const workerCut =
    invoice?.worker_amount ||
    parseFloat((totalAmount * 0.85).toFixed(2));

  const welfareCut =
    invoice?.cooperative_share ||
    parseFloat((totalAmount * 0.10).toFixed(2));

  const platformCut =
    invoice?.platform_fee ||
    parseFloat((totalAmount * 0.05).toFixed(2));

  const txnRef =
    payment?.transaction_reference ||
    `TXN-${Date.now().toString().slice(-8)}`;

  const paymentMethodLabel =
    payment?.payment_method || 'UPI Instant';

  const workerName =
    booking.worker?.profile?.full_name ||
    (booking.worker as any)?.name ||
    'Rahul Sharma';

  const handleCopyTxn = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txnRef).catch(() => undefined);
      }
      setCopiedTxn(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      setTimeout(() => setCopiedTxn(false), 2500);
    } catch {
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2500);
    }
  };

  const rotateInterpolation = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '0deg'],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.72],
              }),
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { scale: cardScaleAnim },
                { translateY: cardTranslateY },
              ],
            },
          ]}
        >
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close confirmation"
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Celebratory Ripple & Confetti Area */}
          <View style={styles.celebrationArea}>
            {/* Ripple Ring 1 */}
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: ripple1Scale }],
                  opacity: ripple1Opacity,
                },
              ]}
            />

            {/* Ripple Ring 2 */}
            <Animated.View
              style={[
                styles.rippleRing,
                styles.rippleRingSecondary,
                {
                  transform: [{ scale: ripple2Scale }],
                  opacity: ripple2Opacity,
                },
              ]}
            />

            {/* Radial Confetti Particles */}
            {CONFETTI_PARTICLES.map((p, idx) => {
              const rad = (p.angle * Math.PI) / 180;
              const targetX = Math.cos(rad) * p.distance;
              const targetY = Math.sin(rad) * p.distance;

              const translateX = confettiBurst.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetX],
              });
              const translateY = confettiBurst.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetY],
              });
              const scale = confettiBurst.interpolate({
                inputRange: [0, 0.4, 0.8, 1],
                outputRange: [0.1, 1.3, 1.0, 0.3],
              });
              const opacity = confettiBurst.interpolate({
                inputRange: [0, 0.2, 0.7, 1],
                outputRange: [0, 1, 0.9, 0],
              });

              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.confettiParticle,
                    {
                      transform: [{ translateX }, { translateY }, { scale }],
                      opacity,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Text style={{ fontSize: p.size, color: p.color, fontWeight: '800' }}>
                    {p.symbol}
                  </Text>
                </Animated.View>
              );
            })}

            {/* Main Green Checkmark Badge */}
            <Animated.View
              style={[
                styles.checkCircleBadge,
                {
                  transform: [
                    { scale: checkScale },
                    { rotate: rotateInterpolation },
                  ],
                },
              ]}
            >
              <Check size={38} color="#ffffff" strokeWidth={3.5} />
            </Animated.View>
          </View>

          {/* Animated Content Section */}
          <Animated.View
            style={[
              styles.contentArea,
              {
                opacity: contentFadeAnim,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {/* Title & Success Announcement */}
            <View style={styles.titleRow}>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Sparkles size={20} color="#F59E0B" />
            </View>
            <Text style={styles.successSub}>
              ₹{Number(totalAmount).toFixed(2)} disbursed securely under Sahakari Fair-Wage rules.
            </Text>

            {/* Transaction ID Pill with Copy Action */}
            <TouchableOpacity
              style={styles.txnChip}
              onPress={handleCopyTxn}
              activeOpacity={0.75}
            >
              <Text style={styles.txnLabel}>TXN REF:</Text>
              <Text style={styles.txnCode}>{txnRef}</Text>
              {copiedTxn ? (
                <View style={styles.copiedPill}>
                  <Check size={11} color="#ffffff" />
                  <Text style={styles.copiedPillText}>Copied</Text>
                </View>
              ) : (
                <Copy size={13} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* 4-Step Settlement Stepper (All 4 Completed) */}
            <View style={styles.stepperCard}>
              <View style={styles.stepItem}>
                <View style={styles.stepCircleCompleted}>
                  <Check size={11} color="#ffffff" strokeWidth={3} />
                </View>
                <Text style={styles.stepLabelCompleted}>Requested</Text>
              </View>
              <View style={styles.stepLineCompleted} />
              <View style={styles.stepItem}>
                <View style={styles.stepCircleCompleted}>
                  <Check size={11} color="#ffffff" strokeWidth={3} />
                </View>
                <Text style={styles.stepLabelCompleted}>Accepted</Text>
              </View>
              <View style={styles.stepLineCompleted} />
              <View style={styles.stepItem}>
                <View style={styles.stepCircleCompleted}>
                  <Check size={11} color="#ffffff" strokeWidth={3} />
                </View>
                <Text style={styles.stepLabelCompleted}>Delivered</Text>
              </View>
              <View style={styles.stepLineCompleted} />
              <View style={styles.stepItem}>
                <View style={styles.stepCircleGlowing}>
                  <Check size={12} color="#ffffff" strokeWidth={3.2} />
                </View>
                <Text style={styles.stepLabelActive}>Paid & Settled</Text>
              </View>
            </View>

            {/* Cooperative Fair Split Transparency Card */}
            <View style={styles.fairShareCard}>
              <View style={styles.fairShareHeader}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={styles.fairShareTitle}>Cooperative Disbursal Receipt</Text>
                <View style={styles.methodTag}>
                  <Text style={styles.methodTagText}>{paymentMethodLabel}</Text>
                </View>
              </View>

              <View style={styles.amountBreakdownRow}>
                <Text style={styles.breakdownLabel}>
                  85% Direct to {workerName}:
                </Text>
                <Text style={[styles.breakdownValue, { color: '#10B981', fontWeight: '800' }]}>
                  ₹{Number(workerCut).toFixed(2)}
                </Text>
              </View>

              <View style={styles.amountBreakdownRow}>
                <Text style={styles.breakdownLabel}>
                  10% Social Security Welfare Fund:
                </Text>
                <Text style={styles.breakdownValue}>
                  ₹{Number(welfareCut).toFixed(2)}
                </Text>
              </View>

              <View style={styles.amountBreakdownRow}>
                <Text style={styles.breakdownLabel}>
                  5% Cooperative Platform Operations:
                </Text>
                <Text style={styles.breakdownValue}>
                  ₹{Number(platformCut).toFixed(2)}
                </Text>
              </View>

              <View style={styles.fairShareDivider} />

              <View style={styles.totalSettledRow}>
                <Text style={styles.totalSettledLabel}>Total Settled:</Text>
                <Text style={styles.totalSettledAmount}>
                  ₹{Number(totalAmount).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={onViewInvoice}
                activeOpacity={0.85}
              >
                <Receipt size={17} color="#ffffff" />
                <Text style={styles.primaryActionBtnText}>View Tax Invoice & Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={onRateWorker}
                activeOpacity={0.8}
              >
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.secondaryActionBtnText}>Rate Professional</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.doneBtnText}>Done / Back to Booking</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      backgroundColor: 'rgba(0,0,0,0.65)',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000000',
    },
    cardContainer: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    closeBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    celebrationArea: {
      width: 140,
      height: 110,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginTop: 6,
      marginBottom: 8,
    },
    rippleRing: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    rippleRingSecondary: {
      borderColor: '#34D399',
      backgroundColor: 'transparent',
    },
    confettiParticle: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleBadge: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 10,
    },
    contentArea: {
      width: '100%',
      alignItems: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    successTitle: {
      fontSize: 21,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    successSub: {
      fontSize: 12.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    txnChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    txnLabel: {
      fontSize: 10.5,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    txnCode: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.4,
    },
    copiedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#10B981',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    copiedPillText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#ffffff',
    },
    stepperCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    stepItem: {
      alignItems: 'center',
    },
    stepCircleCompleted: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    stepCircleGlowing: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#059669',
      borderWidth: 2,
      borderColor: '#34D399',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 4,
    },
    stepLabelCompleted: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    stepLabelActive: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#10B981',
    },
    stepLineCompleted: {
      flex: 1,
      height: 2.5,
      backgroundColor: '#10B981',
      marginBottom: 16,
      marginHorizontal: 4,
    },
    fairShareCard: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.25)',
      marginBottom: 16,
    },
    fairShareHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    fairShareTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#065F46',
      flex: 1,
      marginLeft: 6,
    },
    methodTag: {
      backgroundColor: 'rgba(16, 185, 129, 0.18)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    methodTagText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#047857',
    },
    amountBreakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 2.5,
    },
    breakdownLabel: {
      fontSize: 11.5,
      color: colors.textSecondary,
    },
    breakdownValue: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    fairShareDivider: {
      height: 1,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      marginVertical: 6,
    },
    totalSettledRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    totalSettledLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    totalSettledAmount: {
      fontSize: 16,
      fontWeight: '900',
      color: '#10B981',
    },
    actionsContainer: {
      width: '100%',
      gap: 8,
    },
    primaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#10B981',
      borderRadius: 12,
      paddingVertical: 12,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    primaryActionBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#ffffff',
    },
    secondaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 10,
      borderWidth: 1.5,
      borderColor: '#F59E0B',
    },
    secondaryActionBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    doneBtn: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    doneBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textSecondary,
    },
  });
