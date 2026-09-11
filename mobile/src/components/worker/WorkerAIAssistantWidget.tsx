// ==============================================================================
// SAHAKARI SATHI — SERVICE WORKER AI ASSISTANT WIDGET
// ==============================================================================
// - Simple, elegant floating widget anchored at the bottom-right.
// - Automates the entire worker process on a SINGLE SCREEN:
//   * Check schedule & collision shield
//   * Accept jobs
//   * Start service work
//   * Add diagnostic extra parts
//   * Mark jobs completed & credit wages
//   * Audio read-aloud and voice commands with ZERO API keys
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X,
  Wrench,
  TrendingUp,
  ShieldCheck,
  Send,
  RefreshCw,
  MapPin,
  Clock,
  User,
  Info,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import {
  AIAssistantService,
  WorkerAssistantContext,
  AssistantActionOutcome,
} from '../../services/aiAssistantService';

interface WorkerAIAssistantWidgetProps {
  onActionCompleted?: () => void;
}

export const WorkerAIAssistantWidget: React.FC<WorkerAIAssistantWidgetProps> = ({
  onActionCompleted,
}) => {
  const { colors, isDark } = useTheme();

  // Widget visibility & state
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [context, setContext] = useState<WorkerAssistantContext | null>(null);

  // Voice & Audio
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');

  // Conversation/Activity history
  const [activityLog, setActivityLog] = useState<
    { id: string; text: string; isAi: boolean; timestamp: string }[]
  >([
    {
      id: 'init-1',
      text: 'Namaste! I am Sahakari Sathi ⚡. I can automate your jobs, start service, add parts, and claim wages without you needing to scroll.',
      isAi: true,
      timestamp: 'Now',
    },
  ]);

  // Pulse animation for floating trigger
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Fetch worker context whenever widget opens
  useEffect(() => {
    if (isOpen) {
      refreshContext();
    }
  }, [isOpen]);

  const refreshContext = async () => {
    try {
      setLoading(true);
      const ctx = await AIAssistantService.getWorkerContext();
      setContext(ctx);
    } catch (err) {
      console.warn('Failed to load worker assistant context', err);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (text: string, isAi: boolean = true) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivityLog(prev => [{ id: Date.now().toString(), text, isAi, timestamp: time }, ...prev.slice(0, 8)]);
  };

  // Autonomous command execution
  const handleExecute = async (command: string) => {
    if (!command.trim() || actionInProgress) return;
    setInputText('');
    addLog(command, false);

    setActionInProgress(true);
    try {
      const outcome: AssistantActionOutcome = await AIAssistantService.executeCommand(command);
      addLog(outcome.message, true);

      // Speak feedback aloud
      if (outcome.speechText) {
        setIsSpeaking(true);
        AIAssistantService.speak(outcome.speechText, () => setIsSpeaking(false));
      }

      await refreshContext();
      if (onActionCompleted) {
        onActionCompleted();
      }
    } catch (err: any) {
      addLog(`⚠️ Error: ${err.message || 'Action failed'}`, true);
    } finally {
      setActionInProgress(false);
    }
  };

  // Voice recognition toggle
  const toggleVoiceInput = () => {
    if (isListening) {
      AIAssistantService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      const started = AIAssistantService.startListening(
        (transcript: string) => {
          setIsListening(false);
          handleExecute(transcript);
        },
        (error: string) => {
          setIsListening(false);
          addLog(`Microphone: ${error}`, true);
        },
        () => {
          setIsListening(false);
        }
      );
      if (!started) {
        setIsListening(false);
        addLog('Voice input is not supported in this browser. Please use the quick action buttons.', true);
      }
    }
  };

  // Audio read-aloud toggle
  const toggleSpeechReadout = () => {
    if (isSpeaking) {
      AIAssistantService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      handleExecute('read details aloud');
    }
  };

  // Compute active target booking for dominant card
  const currentTarget = context?.activeOnSiteJob || context?.nextCommittedJob;
  const targetWage = currentTarget
    ? (Number(currentTarget.final_amount || currentTarget.estimated_amount || 0) * 0.85).toFixed(0)
    : '0';

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* 1. FLOATING ACTION BUTTON (BOTTOM-RIGHT)                            */}
      {/* ------------------------------------------------------------------- */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => setIsOpen(true)}
            activeOpacity={0.85}
            accessibilityLabel="Open Sahakari Sathi AI Assistant"
          >
            <View style={styles.fabInner}>
              <Sparkles size={22} color="#ffffff" strokeWidth={2.5} />
              {context?.activeOnSiteJob && (
                <View style={styles.fabActiveDot} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity
          style={styles.fabLabelPill}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.85}
        >
          <Zap size={11} color="#10b981" />
          <Text style={styles.fabLabelText}>AI Sathi</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------------- */}
      {/* 2. SINGLE-SCREEN AUTOMATION MODAL                                    */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          AIAssistantService.stopSpeaking();
          AIAssistantService.stopListening();
          setIsOpen(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={styles.aiBadgeIcon}>
                  <Sparkles size={16} color="#10b981" />
                </View>
                <View>
                  <View style={styles.titleRow}>
                    <Text style={[styles.sheetTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Sahakari Sathi
                    </Text>
                    <View style={styles.zeroKeyPill}>
                      <Text style={styles.zeroKeyPillText}>0 API KEYS • 100% FREE</Text>
                    </View>
                  </View>
                  <Text style={styles.sheetSubtitle}>
                    Single-Screen Autonomous Copilot for Service Workers
                  </Text>
                </View>
              </View>

              <View style={styles.sheetHeaderActions}>
                {/* Audio Read-out Button */}
                <TouchableOpacity
                  style={[styles.iconHeaderBtn, isSpeaking && styles.iconHeaderBtnActive]}
                  onPress={toggleSpeechReadout}
                  accessibilityLabel="Listen aloud"
                >
                  {isSpeaking ? (
                    <VolumeX size={18} color="#ef4444" />
                  ) : (
                    <Volume2 size={18} color="#10b981" />
                  )}
                </TouchableOpacity>

                {/* Refresh Context Button */}
                <TouchableOpacity
                  style={styles.iconHeaderBtn}
                  onPress={refreshContext}
                  disabled={loading}
                >
                  <RefreshCw size={17} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.iconHeaderBtn}
                  onPress={() => {
                    AIAssistantService.stopSpeaking();
                    AIAssistantService.stopListening();
                    setIsOpen(false);
                  }}
                >
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Single-Screen Content */}
            <ScrollView
              style={styles.sheetContent}
              contentContainerStyle={styles.sheetContentInner}
              showsVerticalScrollIndicator={false}
            >
              {loading && !context ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={styles.loadingText}>Syncing worker automation state...</Text>
                </View>
              ) : (
                <>
                  {/* --- SECTION 1: LIVE WORK STAGE & TARGET JOB --- */}
                  {currentTarget ? (
                    <View
                      style={[
                        styles.stageCard,
                        context?.activeOnSiteJob
                          ? styles.stageCardActive
                          : styles.stageCardCommitted,
                      ]}
                    >
                      <View style={styles.stageCardHeader}>
                        <View style={styles.stagePillWrap}>
                          <View
                            style={[
                              styles.stageStatusPill,
                              context?.activeOnSiteJob
                                ? styles.statusPillActive
                                : styles.statusPillCommitted,
                            ]}
                          >
                            <View
                              style={[
                                styles.stageStatusDot,
                                {
                                  backgroundColor: context?.activeOnSiteJob
                                    ? '#10b981'
                                    : '#3b82f6',
                                },
                              ]}
                            />
                            <Text style={styles.stageStatusPillText}>
                              {context?.activeOnSiteJob
                                ? 'ON-SITE IN PROGRESS'
                                : 'CONFIRMED BOOKING'}
                            </Text>
                          </View>
                          <Text style={styles.jobCodeText}>{currentTarget.booking_code}</Text>
                        </View>

                        <View style={styles.wageHighlightBox}>
                          <Text style={styles.wageHighlightLabel}>YOUR DIRECT WAGE</Text>
                          <Text style={styles.wageHighlightValue}>₹{targetWage}</Text>
                        </View>
                      </View>

                      {/* Customer & Location */}
                      <View style={styles.jobDetailsRow}>
                        <View style={styles.jobDetailItem}>
                          <User size={13} color="#64748b" />
                          <Text style={styles.jobDetailText} numberOfLines={1}>
                            {currentTarget.customer?.full_name || 'Customer'}
                          </Text>
                        </View>
                        <View style={styles.jobDetailItem}>
                          <Clock size={13} color="#64748b" />
                          <Text style={styles.jobDetailText}>
                            {currentTarget.booking_date} • {currentTarget.booking_time}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.addressRow}>
                        <MapPin size={13} color="#64748b" />
                        <Text style={styles.addressText} numberOfLines={1}>
                          {currentTarget.address || 'Address on file'}
                        </Text>
                      </View>

                      {/* --- DOMINANT ONE-TAP AUTOMATION ACTION --- */}
                      <TouchableOpacity
                        style={[
                          styles.dominantActionBtn,
                          context?.activeOnSiteJob
                            ? styles.completeDominantBtn
                            : styles.startDominantBtn,
                          actionInProgress && styles.btnDisabled,
                        ]}
                        onPress={() =>
                          handleExecute(
                            context?.activeOnSiteJob
                              ? `complete job ${currentTarget.booking_code}`
                              : `start work on ${currentTarget.booking_code}`
                          )
                        }
                        disabled={actionInProgress}
                        activeOpacity={0.85}
                      >
                        {actionInProgress ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : context?.activeOnSiteJob ? (
                          <>
                            <CheckCircle2 size={19} color="#ffffff" strokeWidth={2.5} />
                            <Text style={styles.dominantActionBtnText}>
                              Complete Job & Claim ₹{targetWage}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Zap size={19} color="#ffffff" strokeWidth={2.5} />
                            <Text style={styles.dominantActionBtnText}>
                              ⚡ Start Service Work Now
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : context?.pendingJobs && context.pendingJobs.length > 0 ? (
                    /* If no active/committed job, but pending requests exist */
                    <View style={[styles.stageCard, styles.stageCardPending]}>
                      <View style={styles.stageCardHeader}>
                        <View style={styles.stagePillWrap}>
                          <View style={[styles.stageStatusPill, styles.statusPillPending]}>
                            <Text style={styles.stageStatusPillText}>
                              {context.pendingJobs.length} PENDING REQUEST(S)
                            </Text>
                          </View>
                          <Text style={styles.jobCodeText}>
                            {context.pendingJobs[0].booking_code}
                          </Text>
                        </View>
                        <View style={styles.wageHighlightBox}>
                          <Text style={styles.wageHighlightLabel}>EST. VALUE</Text>
                          <Text style={styles.wageHighlightValue}>
                            ₹{context.pendingJobs[0].estimated_amount}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.pendingDescText}>
                        {context.pendingJobs[0].service_description || 'Standard service request'}
                      </Text>

                      {/* One-tap Accept Button */}
                      <TouchableOpacity
                        style={[styles.dominantActionBtn, styles.acceptDominantBtn]}
                        onPress={() =>
                          handleExecute(`accept job ${context.pendingJobs[0].booking_code}`)
                        }
                        disabled={actionInProgress}
                        activeOpacity={0.85}
                      >
                        {actionInProgress ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <CheckCircle2 size={19} color="#ffffff" strokeWidth={2.5} />
                            <Text style={styles.dominantActionBtnText}>
                              Accept {context.pendingJobs[0].booking_code} (No Conflict)
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* All caught up banner */
                    <View style={styles.caughtUpCard}>
                      <ShieldCheck size={28} color="#10b981" />
                      <Text style={styles.caughtUpTitle}>You are completely caught up! 🎉</Text>
                      <Text style={styles.caughtUpDesc}>
                        No pending actions. You have completed {context?.todayCompletedCount || 0}{' '}
                        jobs today with ₹{context?.todayEarnings.toFixed(0) || 0} earned.
                      </Text>
                    </View>
                  )}

                  {/* --- SECTION 2: SCHEDULE COLLISION SHIELD ALERT --- */}
                  {context?.collidingJobs && context.collidingJobs.length > 0 && (
                    <View style={styles.collisionCard}>
                      <View style={styles.collisionHeader}>
                        <AlertTriangle size={15} color="#ef4444" />
                        <Text style={styles.collisionTitle}>Schedule Collision Shield Active</Text>
                      </View>
                      {context.collidingJobs.map((c, idx) => (
                        <Text key={idx} style={styles.collisionItemText}>
                          • {c.booking.booking_code}: {c.reason}
                        </Text>
                      ))}
                      <Text style={styles.collisionSubtext}>
                        The 1-hour buffer safeguards your commitments without manual schedule math.
                      </Text>
                    </View>
                  )}

                  {/* --- SECTION 3: 1-TAP FAST WORKER ACTIONS --- */}
                  <View style={styles.fastActionSection}>
                    <Text style={styles.sectionHeaderLabel}>1-TAP COOPERATIVE AUTOMATION</Text>
                    <View style={styles.fastActionGrid}>
                      {/* Read Aloud */}
                      <TouchableOpacity
                        style={styles.fastActionChip}
                        onPress={() => handleExecute('read details aloud')}
                        activeOpacity={0.8}
                      >
                        <Volume2 size={15} color="#10b981" />
                        <Text style={styles.fastActionChipText}>Read Details Aloud</Text>
                      </TouchableOpacity>

                      {/* Diagnose Extra Parts */}
                      <TouchableOpacity
                        style={styles.fastActionChip}
                        onPress={() => handleExecute('add diagnostic parts')}
                        activeOpacity={0.8}
                      >
                        <Wrench size={15} color="#3b82f6" />
                        <Text style={styles.fastActionChipText}>Add ₹350 Parts</Text>
                      </TouchableOpacity>

                      {/* Check Earnings */}
                      <TouchableOpacity
                        style={styles.fastActionChip}
                        onPress={() => handleExecute('check my earnings and welfare')}
                        activeOpacity={0.8}
                      >
                        <TrendingUp size={15} color="#f59e0b" />
                        <Text style={styles.fastActionChipText}>Check Earnings</Text>
                      </TouchableOpacity>

                      {/* Decline Next Pending */}
                      {context?.pendingJobs && context.pendingJobs.length > 0 && (
                        <TouchableOpacity
                          style={styles.fastActionChip}
                          onPress={() => handleExecute('decline job')}
                          activeOpacity={0.8}
                        >
                          <X size={15} color="#ef4444" />
                          <Text style={styles.fastActionChipText}>Decline Request</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* --- SECTION 4: RECENT ACTION LOG --- */}
                  <View style={styles.logSection}>
                    <Text style={styles.sectionHeaderLabel}>ASSISTANT ACTIVITY FEED</Text>
                    <View style={styles.logBox}>
                      {activityLog.map(item => (
                        <View
                          key={item.id}
                          style={[
                            styles.logMessage,
                            item.isAi ? styles.logAi : styles.logUser,
                          ]}
                        >
                          <Text
                            style={[
                              styles.logText,
                              item.isAi
                                ? { color: isDark ? '#e2e8f0' : '#1e293b' }
                                : { color: '#ffffff' },
                            ]}
                          >
                            {item.text}
                          </Text>
                          <Text
                            style={[
                              styles.logTime,
                              item.isAi ? { color: '#94a3b8' } : { color: '#dcfce7' },
                            ]}
                          >
                            {item.timestamp}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* --- SECTION 5: COMMAND INPUT & VOICE MICROPHONE --- */}
            <View
              style={[
                styles.footerInputBar,
                { borderTopColor: isDark ? '#1e293b' : '#f1f5f9' },
              ]}
            >
              {/* Mic Button */}
              <TouchableOpacity
                style={[styles.micBtn, isListening && styles.micBtnActive]}
                onPress={toggleVoiceInput}
                activeOpacity={0.8}
              >
                {isListening ? (
                  <MicOff size={18} color="#ffffff" />
                ) : (
                  <Mic size={18} color="#ffffff" />
                )}
              </TouchableOpacity>

              {/* Text Input */}
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
                placeholder={
                  isListening
                    ? 'Listening... speak now'
                    : 'Tap mic or type: "start work", "complete"...'
                }
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleExecute(inputText)}
                returnKeyType="send"
              />

              {/* Send Button */}
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  !inputText.trim() && styles.sendBtnDisabled,
                ]}
                onPress={() => handleExecute(inputText)}
                disabled={!inputText.trim() || actionInProgress}
                activeOpacity={0.8}
              >
                <Send size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 84, // elevated nicely above the 66px tab bar
    right: 18,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#059669', // rich emerald green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#34d399',
  },
  fabInner: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabActiveDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  fabLabelPill: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  fabLabelText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    minHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  zeroKeyPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  zeroKeyPillText: {
    color: '#059669',
    fontSize: 8.5,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  sheetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconHeaderBtnActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },

  // Sheet Content
  sheetContent: {
    flex: 1,
  },
  sheetContentInner: {
    padding: 16,
    gap: 14,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },

  // Stage Card
  stageCard: {
    borderRadius: 16,
    padding: 15,
    borderWidth: 1.5,
  },
  stageCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  stageCardCommitted: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  stageCardPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  stageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stagePillWrap: {
    gap: 4,
  },
  stageStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 5,
    alignSelf: 'flex-start',
  },
  statusPillActive: {
    backgroundColor: '#dcfce7',
  },
  statusPillCommitted: {
    backgroundColor: '#dbeafe',
  },
  statusPillPending: {
    backgroundColor: '#fef3c7',
  },
  stageStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stageStatusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#0f172a',
  },
  jobCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  wageHighlightBox: {
    alignItems: 'flex-end',
  },
  wageHighlightLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  wageHighlightValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  jobDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobDetailText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  addressText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  pendingDescText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
  },

  // Dominant Action Button
  dominantActionBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  startDominantBtn: {
    backgroundColor: '#059669',
  },
  completeDominantBtn: {
    backgroundColor: '#2563eb',
  },
  acceptDominantBtn: {
    backgroundColor: '#059669',
  },
  dominantActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.65,
  },

  // Caught up card
  caughtUpCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
  },
  caughtUpTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065f46',
  },
  caughtUpDesc: {
    fontSize: 12,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Collision alert card
  collisionCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    gap: 5,
  },
  collisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collisionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
  },
  collisionItemText: {
    fontSize: 11,
    color: '#991b1b',
    fontWeight: '600',
  },
  collisionSubtext: {
    fontSize: 10,
    color: '#7f1d1d',
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Fast action chips
  fastActionSection: {
    gap: 8,
  },
  sectionHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748b',
  },
  fastActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fastActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fastActionChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },

  // Log box
  logSection: {
    gap: 8,
  },
  logBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logMessage: {
    padding: 9,
    borderRadius: 10,
    gap: 2,
  },
  logAi: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxWidth: '92%',
  },
  logUser: {
    backgroundColor: '#059669',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  logText: {
    fontSize: 12,
    lineHeight: 17,
  },
  logTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
  },

  // Footer Input Bar
  footerInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
    backgroundColor: 'transparent',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: '#ef4444',
  },
  inputField: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12.5,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
