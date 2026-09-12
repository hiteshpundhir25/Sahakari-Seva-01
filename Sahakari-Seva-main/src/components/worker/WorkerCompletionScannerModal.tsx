// mobile/src/components/worker/WorkerCompletionScannerModal.tsx
// ==============================================================================
// WORKER COMPLETION SCANNER MODAL (CO-OP DUAL-KEY VERIFICATION)
// Allows the worker to scan the customer's completion QR or manually input
// the 4-digit PIN to verify and mark the service as completed.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { QrCode, X, CheckCircle2, ShieldCheck, Camera } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { ApiClient } from '../../services/apiClient';
import type { Booking } from '../../types';

interface WorkerCompletionScannerModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSuccess: (completedBooking: Booking) => void;
}

export const WorkerCompletionScannerModal: React.FC<WorkerCompletionScannerModalProps> = ({
  visible,
  booking,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [pinInput, setPinInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  // Animated scanning line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPinInput('');
      setSuccessAnim(false);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, scanLineAnim]);

  if (!visible || !booking) return null;

  const handleVerifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) {
      Alert.alert('Verification Code Required', 'Please enter the 4-digit code shown on the customer screen.');
      return;
    }

    try {
      setVerifying(true);
      const res = await ApiClient.verifyAndCompleteJob(booking.id, codeToVerify.trim());
      setSuccessAnim(true);
      setTimeout(() => {
        setVerifying(false);
        onSuccess(res);
        onClose();
      }, 700);
    } catch (err: any) {
      setVerifying(false);
      Alert.alert('Verification Failed', err.message || 'Incorrect verification code. Please ask customer to display their QR.');
    }
  };

  const handleSimulateScan = () => {
    handleVerifyCode(booking.completion_code || 'SIMULATED_QR_SCAN');
  };

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 130],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <QrCode size={18} color={colors.primary} />
              <Text style={styles.title}>Scan Customer QR</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Ask customer to open their completion pass for {booking.booking_code}.
          </Text>

          {/* Scanner Viewfinder Box */}
          <View style={styles.viewfinder}>
            {/* Corner Crosshairs */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Laser scanning beam */}
            {!successAnim && (
              <Animated.View
                style={[
                  styles.laserBeam,
                  {
                    transform: [{ translateY }],
                  },
                ]}
              />
            )}

            {successAnim ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={44} color="#059669" />
                <Text style={styles.successText}>Verified ✓</Text>
              </View>
            ) : (
              <View style={styles.viewfinderContent}>
                <Camera size={26} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={styles.viewfinderHint}>Align with Customer QR</Text>
              </View>
            )}
          </View>

          {/* 1-Tap Simulated Camera Scan */}
          <TouchableOpacity
            style={styles.scanSimBtn}
            onPress={handleSimulateScan}
            disabled={verifying}
            activeOpacity={0.8}
          >
            {verifying ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <ShieldCheck size={16} color="#ffffff" />
                <Text style={styles.scanSimBtnText}>Scan Customer QR</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR ENTER 4-DIGIT PIN</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Manual PIN Input Box */}
          <View style={styles.pinInputRow}>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={text => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
                setPinInput(cleaned);
                if (cleaned.length === 4) {
                  handleVerifyCode(cleaned);
                }
              }}
              placeholder="4-digit PIN"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              editable={!verifying}
            />

            <TouchableOpacity
              style={[
                styles.verifyPinBtn,
                pinInput.length < 4 && styles.verifyPinBtnDisabled,
              ]}
              onPress={() => handleVerifyCode(pinInput)}
              disabled={pinInput.length < 4 || verifying}
              activeOpacity={0.8}
            >
              <Text style={styles.verifyPinBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.coopNotice}>
            Autonomous verification under Rajasthan Co-op Act §16
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    dialog: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 20,
      width: '100%',
      maxWidth: 345,
      padding: 18,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 8,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 6,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeBtn: {
      padding: 4,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 16,
    },
    viewfinder: {
      width: 170,
      height: 150,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(15, 23, 42, 0.04)',
      borderRadius: 12,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    },
    corner: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderColor: colors.primary,
    },
    cornerTL: {
      top: 6,
      left: 6,
      borderTopWidth: 2.5,
      borderLeftWidth: 2.5,
      borderTopLeftRadius: 4,
    },
    cornerTR: {
      top: 6,
      right: 6,
      borderTopWidth: 2.5,
      borderRightWidth: 2.5,
      borderTopRightRadius: 4,
    },
    cornerBL: {
      bottom: 6,
      left: 6,
      borderBottomWidth: 2.5,
      borderLeftWidth: 2.5,
      borderBottomLeftRadius: 4,
    },
    cornerBR: {
      bottom: 6,
      right: 6,
      borderBottomWidth: 2.5,
      borderRightWidth: 2.5,
      borderBottomRightRadius: 4,
    },
    laserBeam: {
      position: 'absolute',
      left: 10,
      right: 10,
      height: 2,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
    },
    viewfinderContent: {
      alignItems: 'center',
      gap: 6,
    },
    viewfinderHint: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
    },
    successBox: {
      alignItems: 'center',
      gap: 4,
    },
    successText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#059669',
    },
    scanSimBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#059669',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      width: '100%',
      marginBottom: 12,
    },
    scanSimBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      marginVertical: 4,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    },
    dividerText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.6,
    },
    pinInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      marginTop: 10,
      marginBottom: 10,
    },
    pinInput: {
      flex: 1,
      minWidth: 0,
      flexBasis: 0,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      height: 40,
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: 2,
    },
    verifyPinBtn: {
      flexShrink: 0,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
    },
    verifyPinBtnDisabled: {
      opacity: 0.45,
    },
    verifyPinBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#ffffff',
    },
    coopNotice: {
      fontSize: 9.5,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
      paddingHorizontal: 4,
    },
  });
