// ==============================================================================
// FLIPKART & AMAZON STYLE ORDER CONFIRMED ANIMATED MODAL
// Celebratory green checkmark with spring overshoot bounce, expanding pulse
// ripples, radial celebratory confetti burst, live 4-step order stepper,
// worker summary & cooperative fair wage transparency.
// ==============================================================================

import React, { useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import type { Booking } from '../../types';

interface BookingConfirmedModalProps {
  visible: boolean;
  booking: Booking | null;
  worker?: any;
  onClose: () => void;
  onViewBookings: () => void;
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

export const BookingConfirmedModal: React.FC<BookingConfirmedModalProps> = ({
  visible,
  booking,
  worker,
  onClose,
  onViewBookings,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Animation values
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.85)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;

  const ripple1Scale = useRef(new Animated.Value(0.6)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.8)).current;

  const ripple2Scale = useRef(new Animated.Value(0.6)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.6)).current;

  const confettiBurst = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(15)).current;

  const stepperPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
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
      stepperPulse.setValue(1);

      // Trigger celebratory haptic feedback
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

      // 2. Flipkart/Amazon bounce scale on checkmark circle (0 -> 1.25 -> 1.0)
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

      // 3. Concentric radar ripples bursting outward
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

      // 5. Order details and stepper reveal
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

      // 6. Stepper pulse loop
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(stepperPulse, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(stepperPulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        clearTimeout(hapticTimer);
        pulseLoop.stop();
      };
    }
  }, [visible]);

  if (!visible && !booking) return null;

  const bookingCode = booking?.booking_code || 'BK-2026-CONFIRMED';
  const workerName = worker?.name || booking?.worker?.profile?.full_name || (booking?.worker as any)?.name || 'Assigned Professional';
  const workerTrade = worker?.service || worker?.skill_category || booking?.service_description || 'Home Service';
  const workerRating = worker?.rating || worker?.average_rating || 4.9;
  const bookingDate = booking?.booking_date || 'Today';
  const bookingTime = booking?.booking_time || '10:00 AM';
  const finalAmount = booking?.final_amount || worker?.hourly_rate || 249;
  const workerCut = Math.round(finalAmount * 0.85);

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
        {/* Animated backdrop with tap-outside dismiss */}
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

        {/* Modal Card */}
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

          {/* Celebratory Animation Header */}
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
              <Check size={42} color="#ffffff" strokeWidth={3.8} />
            </Animated.View>
          </View>

          {/* Animated Content Section */}
          <Animated.View
            style={[
              styles.contentSection,
              {
                opacity: contentFadeAnim,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {/* Title & Badge */}
            <Text style={styles.titleText}>
              {t('booking.confirmed_title') || 'Booking Confirmed! 🎉'}
            </Text>

            <View style={styles.orderCodeBadge}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.orderCodeText}>
                ORDER #{bookingCode}
              </Text>
            </View>

            <Text style={styles.subtitleText}>
              Your request has been dispatched to {workerName}. Instant demand recorded!
            </Text>

            {/* ============================================================== */}
            {/* FLIPKART / AMAZON 4-STEP TRACKER */}
            {/* ============================================================== */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepperTrackRow}>
                {/* Step 1: Placed */}
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, styles.stepCircleDone]}>
                    <Check size={13} color="#ffffff" strokeWidth={3} />
                  </View>
                  <Text style={[styles.stepLabel, styles.stepLabelActive]}>Placed</Text>
                </View>

                {/* Connecting Line 1-2 */}
                <View style={[styles.stepLine, styles.stepLineActive]} />

                {/* Step 2: Confirmed */}
                <View style={styles.stepItem}>
                  <Animated.View
                    style={[
                      styles.stepCircle,
                      styles.stepCircleDone,
                      { transform: [{ scale: stepperPulse }] },
                    ]}
                  >
                    <Check size={13} color="#ffffff" strokeWidth={3} />
                  </Animated.View>
                  <Text style={[styles.stepLabel, styles.stepLabelActive]}>Confirmed</Text>
                </View>

                {/* Connecting Line 2-3 */}
                <View style={styles.stepLine} />

                {/* Step 3: On The Way */}
                <View style={styles.stepItem}>
                  <View style={styles.stepCirclePending}>
                    <Clock size={12} color={colors.textMuted} />
                  </View>
                  <Text style={styles.stepLabel}>On The Way</Text>
                </View>

                {/* Connecting Line 3-4 */}
                <View style={styles.stepLine} />

                {/* Step 4: Done */}
                <View style={styles.stepCirclePending}>
                  <ShieldCheck size={12} color={colors.textMuted} />
                </View>
                <Text style={styles.stepLabel}>Done</Text>
              </View>
            </View>

            {/* Summary Details Card */}
            <View style={styles.summaryCard}>
              <View style={styles.workerRow}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerAvatarText}>
                    {workerName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerNameText} numberOfLines={1}>
                    {workerName}
                  </Text>
                  <Text style={styles.workerServiceText}>
                    {workerTrade} • ★ {workerRating}
                  </Text>
                </View>
                <View style={styles.amountPill}>
                  <Text style={styles.amountPillText}>₹{finalAmount}</Text>
                </View>
              </View>

              <View style={styles.scheduleRow}>
                <View style={styles.scheduleCol}>
                  <Calendar size={14} color={colors.primary} />
                  <Text style={styles.scheduleText}>{bookingDate}</Text>
                </View>
                <View style={styles.scheduleCol}>
                  <Clock size={14} color={colors.primary} />
                  <Text style={styles.scheduleText}>{bookingTime}</Text>
                </View>
              </View>

              {/* Fair Wage Guarantee */}
              <View style={styles.fairWageBanner}>
                <ShieldCheck size={15} color={colors.successDark} />
                <Text style={styles.fairWageText}>
                  Cooperative Fair Share: ₹{workerCut} (85%) directly to {workerName.split(' ')[0]}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onViewBookings}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>
                  {t('booking.view_bookings') || 'Track & View in Bookings'}
                </Text>
                <ArrowRight size={18} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>Done</Text>
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
      padding: 18,
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
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.45 : 0.22,
      shadowRadius: 30,
      elevation: 20,
    },
    closeBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      zIndex: 10,
      padding: 6,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    celebrationArea: {
      width: 140,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 6,
    },
    rippleRing: {
      position: 'absolute',
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: '#10B981',
    },
    rippleRingSecondary: {
      backgroundColor: '#34D399',
    },
    confettiParticle: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircleBadge: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: '#059669',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 3.5,
      borderColor: '#ffffff',
    },
    contentSection: {
      width: '100%',
      alignItems: 'center',
    },
    titleText: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: 4,
      letterSpacing: -0.3,
    },
    orderCodeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#ECFDF5',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      marginTop: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16,185,129,0.4)' : '#A7F3D0',
    },
    liveGreenDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10B981',
      marginRight: 6,
    },
    orderCodeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.successDark,
      letterSpacing: 0.6,
    },
    subtitleText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 16,
      paddingHorizontal: 10,
      lineHeight: 18,
    },

    // Stepper styling
    stepperContainer: {
      width: '100%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepperTrackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepItem: {
      alignItems: 'center',
    },
    stepCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepCircleDone: {
      backgroundColor: '#059669',
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    stepCirclePending: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    stepLabelActive: {
      color: colors.successDark,
      fontWeight: '700',
    },
    stepLine: {
      flex: 1,
      height: 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
      marginHorizontal: 4,
      marginBottom: 16,
    },
    stepLineActive: {
      backgroundColor: '#059669',
    },

    // Summary Card
    summaryCard: {
      width: '100%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    workerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    workerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    workerAvatarText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '800',
    },
    workerInfo: {
      flex: 1,
    },
    workerNameText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    workerServiceText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    amountPill: {
      backgroundColor: isDark ? 'rgba(79,70,229,0.2)' : colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    amountPillText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
    },
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
      marginBottom: 8,
    },
    scheduleCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    scheduleText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    fairWageBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(5,150,105,0.14)' : '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    fairWageText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.successDark,
      flex: 1,
    },

    // Action buttons
    actionButtonsCol: {
      width: '100%',
      gap: 8,
    },
    primaryBtn: {
      width: '100%',
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    secondaryBtn: {
      width: '100%',
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
  });
