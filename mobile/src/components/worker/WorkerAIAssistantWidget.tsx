// ==============================================================================
// SAHAKARI ASSISTANT WIDGET — INTERACTIVE WORKER ASSISTANT
// ==============================================================================
// - Floating bottom-right trigger with live status indicators
// - Interactive conversational assistant with action cards
// - Direct 1-tap execution of:
//   * Start Service Work
//   * Add Diagnostic Parts (+₹350)
//   * Complete Job & Claim Direct Wage
//   * View Schedule & Customer Contacts
//   * Speech recognition & text-to-speech
//   * Instant cross-app synchronization
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
  Linking,
  DeviceEventEmitter,
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
  Send,
  RefreshCw,
  MapPin,
  Clock,
  User,
  Phone,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import {
  AIAssistantService,
  WorkerAssistantContext,
  AssistantActionOutcome,
  AssistantMessage,
  AssistantActionCard,
} from '../../services/aiAssistantService';

export const WorkerAIAssistantWidget: React.FC = () => {
  const { colors, isDark } = useTheme();

  // Modal open/close & loading states
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [context, setContext] = useState<WorkerAssistantContext | null>(null);

  // Speech Recognition & Synthesis
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');

  // Conversational message feed with interactive action cards
  const [messages, setMessages] = useState<AssistantMessage[]>([]);

  // Pulse animation for floating trigger
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

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

  // Load context on mount and subscribe to app-wide updates
  useEffect(() => {
    refreshContext();
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      refreshContext();
    });
    return () => {
      sub.remove();
    };
  }, []);

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

      // Initialize conversation if empty
      if (messages.length === 0) {
        initializeConversation(ctx);
      }
    } catch (err) {
      console.warn('Failed to refresh assistant context', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeConversation = (ctx: WorkerAssistantContext) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const inProg = ctx.activeOnSiteJob;
    const accepted = ctx.nextCommittedJob;
    const pending = ctx.pendingJobs;

    let greeting = 'Namaste! I am your Sahakari Assistant ⚡.\n';
    let card: AssistantActionCard | undefined;

    if (inProg) {
      const wage = (Number(inProg.final_amount || inProg.estimated_amount || 0) * 0.85).toFixed(0);
      greeting += `You are currently on-site for job ${inProg.booking_code} (${inProg.customer?.full_name || 'Customer'}). Expected wage: ₹${wage}. What would you like to do?`;
      card = {
        id: 'init-card-1',
        type: 'action_buttons',
        booking: inProg,
        actions: [
          { label: `✓ Complete Job (Claim ₹${wage})`, command: 'complete job', variant: 'success' },
          { label: '🔧 Add Extra Parts (+₹350)', command: 'add diagnostic parts', variant: 'warning' },
          { label: '📞 Customer Details', command: 'customer contact', variant: 'neutral' },
        ],
      };
    } else if (accepted) {
      const wage = (Number(accepted.final_amount || accepted.estimated_amount || 0) * 0.85).toFixed(0);
      greeting += `You have 1 confirmed job ready to start: ${accepted.booking_code} for ${accepted.customer?.full_name || 'Customer'} on ${accepted.booking_date} at ${accepted.booking_time}. Expected direct wage: ₹${wage}.`;
      card = {
        id: 'init-card-2',
        type: 'action_buttons',
        booking: accepted,
        actions: [
          { label: '⚡ Start Service Work Now', command: 'start work', variant: 'success' },
          { label: '📍 Customer & Address', command: 'customer contact', variant: 'neutral' },
          { label: '🔊 Read Order Aloud', command: 'read details aloud', variant: 'neutral' },
        ],
      };
    } else if (pending.length > 0) {
      greeting += `You have ${pending.length} new booking request waiting for your review.`;
      card = {
        id: 'init-card-3',
        type: 'action_buttons',
        booking: pending[0],
        actions: [
          { label: `Accept ${pending[0].booking_code} (₹${pending[0].estimated_amount})`, command: 'accept job', variant: 'primary' },
          { label: 'Decline Request', command: 'decline job', variant: 'danger' },
        ],
      };
    } else {
      greeting += `You are completely caught up! No active jobs right now. You can check your earnings or review past jobs.`;
      card = {
        id: 'init-card-4',
        type: 'action_buttons',
        actions: [
          { label: '💰 Check My Earnings', command: 'earnings summary', variant: 'primary' },
          { label: '📋 View Schedule', command: 'my jobs', variant: 'neutral' },
        ],
      };
    }

    setMessages([
      {
        id: 'msg-init',
        sender: 'ai',
        text: greeting,
        timestamp: time,
        card,
      },
    ]);
  };

  const handleExecute = async (command: string) => {
    if (!command.trim() || actionInProgress) return;
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsg: AssistantMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: command,
      timestamp: userTime,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setActionInProgress(true);

    try {
      const outcome: AssistantActionOutcome = await AIAssistantService.executeCommand(command);
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const aiMsg: AssistantMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: outcome.message,
        timestamp: aiTime,
        card: outcome.card,
      };

      setMessages(prev => [...prev, aiMsg]);

      // Speak feedback
      if (outcome.speechText) {
        setIsSpeaking(true);
        AIAssistantService.speak(outcome.speechText, () => setIsSpeaking(false));
      }

      await refreshContext();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          text: `⚠️ ${err.message || 'Action could not be executed.'}`,
          timestamp: errorTime,
        },
      ]);
    } finally {
      setActionInProgress(false);
    }
  };

  // Voice toggle
  const toggleVoice = () => {
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
          console.log('Voice recognition notice:', error);
        },
        () => {
          setIsListening(false);
        }
      );
      if (!started) {
        setIsListening(false);
      }
    }
  };

  // Audio readout toggle
  const toggleAudio = () => {
    if (isSpeaking) {
      AIAssistantService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      handleExecute('read details aloud');
    }
  };

  const activeJob = context?.activeOnSiteJob || context?.nextCommittedJob;

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
            accessibilityLabel="Open Sahakari Assistant"
          >
            <View style={styles.fabInner}>
              <Sparkles size={22} color="#ffffff" strokeWidth={2.5} />
              {context?.activeOnSiteJob && <View style={styles.fabActiveDot} />}
            </View>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity
          style={styles.fabLabelPill}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.85}
        >
          <Zap size={11} color="#10b981" />
          <Text style={styles.fabLabelText}>Assistant</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------------- */}
      {/* 2. INTERACTIVE ASSISTANT MODAL SHEET                                */}
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
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={styles.aiBadgeIcon}>
                  <Sparkles size={16} color="#10b981" />
                </View>
                <View>
                  <Text style={[styles.sheetTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Sahakari Assistant
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    Your Smart Task & Voice Companion
                  </Text>
                </View>
              </View>

              <View style={styles.sheetHeaderActions}>
                {/* Audio Read-out Toggle */}
                <TouchableOpacity
                  style={[styles.iconHeaderBtn, isSpeaking && styles.iconHeaderBtnActive]}
                  onPress={toggleAudio}
                  accessibilityLabel="Listen aloud"
                >
                  {isSpeaking ? (
                    <VolumeX size={18} color="#ef4444" />
                  ) : (
                    <Volume2 size={18} color="#10b981" />
                  )}
                </TouchableOpacity>

                {/* Refresh Context */}
                <TouchableOpacity
                  style={styles.iconHeaderBtn}
                  onPress={refreshContext}
                  disabled={loading}
                >
                  <RefreshCw size={17} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Close Sheet */}
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

            {/* Status Strip */}
            {activeJob && (
              <View style={styles.statusStrip}>
                <View style={styles.statusStripLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          context?.activeOnSiteJob ? '#10b981' : '#3b82f6',
                      },
                    ]}
                  />
                  <Text style={styles.statusStripText} numberOfLines={1}>
                    {context?.activeOnSiteJob ? 'In Progress: ' : 'Confirmed: '}
                    <Text style={{ fontWeight: '800' }}>{activeJob.booking_code}</Text>
                    {' • '}
                    {activeJob.customer?.full_name || 'Customer'}
                  </Text>
                </View>
                <Text style={styles.statusStripWage}>
                  ₹{(Number(activeJob.final_amount || activeJob.estimated_amount || 0) * 0.85).toFixed(0)} wage
                </Text>
              </View>
            )}

            {/* Conversation Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatScrollInner}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.sender === 'user' ? styles.messageRowUser : styles.messageRowAi,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        msg.sender === 'user'
                          ? styles.bubbleTextUser
                          : { color: isDark ? '#f1f5f9' : '#1e293b' },
                      ]}
                    >
                      {msg.text}
                    </Text>

                    {/* Interactive Action Cards */}
                    {msg.card && msg.card.actions && msg.card.actions.length > 0 && (
                      <View style={styles.cardActionGroup}>
                        {msg.card.actions.map((act, actIdx) => (
                          <TouchableOpacity
                            key={actIdx}
                            style={[
                              styles.cardActionBtn,
                              act.variant === 'success' && styles.cardActionSuccess,
                              act.variant === 'primary' && styles.cardActionPrimary,
                              act.variant === 'warning' && styles.cardActionWarning,
                              act.variant === 'danger' && styles.cardActionDanger,
                              act.variant === 'neutral' && styles.cardActionNeutral,
                            ]}
                            onPress={() => handleExecute(act.command)}
                            disabled={actionInProgress}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.cardActionText,
                                (act.variant === 'success' ||
                                  act.variant === 'primary' ||
                                  act.variant === 'danger') && {
                                  color: '#ffffff',
                                },
                              ]}
                            >
                              {act.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <Text
                      style={[
                        styles.bubbleTime,
                        msg.sender === 'user' ? { color: '#dcfce7' } : { color: '#94a3b8' },
                      ]}
                    >
                      {msg.timestamp}
                    </Text>
                  </View>
                </View>
              ))}

              {actionInProgress && (
                <View style={styles.typingBox}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={styles.typingText}>Executing action on live bookings...</Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Action Suggestion Chips */}
            <View style={styles.chipRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleExecute('start work')}
                  disabled={actionInProgress}
                >
                  <Zap size={13} color="#10b981" />
                  <Text style={styles.chipText}>Start Work</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleExecute('complete job')}
                  disabled={actionInProgress}
                >
                  <CheckCircle2 size={13} color="#2563eb" />
                  <Text style={styles.chipText}>Complete Job</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleExecute('add diagnostic parts')}
                  disabled={actionInProgress}
                >
                  <Wrench size={13} color="#f59e0b" />
                  <Text style={styles.chipText}>Add ₹350 Parts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleExecute('my jobs')}
                  disabled={actionInProgress}
                >
                  <Clock size={13} color="#64748b" />
                  <Text style={styles.chipText}>Show My Jobs</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleExecute('earnings summary')}
                  disabled={actionInProgress}
                >
                  <TrendingUp size={13} color="#059669" />
                  <Text style={styles.chipText}>Earnings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleExecute('read details aloud')}
                  disabled={actionInProgress}
                >
                  <Volume2 size={13} color="#8b5cf6" />
                  <Text style={styles.chipText}>Read Aloud</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Input Bar */}
            <View
              style={[
                styles.footerInputBar,
                { borderTopColor: isDark ? '#1e293b' : '#f1f5f9' },
              ]}
            >
              {/* Mic Button */}
              <TouchableOpacity
                style={[styles.micBtn, isListening && styles.micBtnActive]}
                onPress={toggleVoice}
                activeOpacity={0.8}
                accessibilityLabel="Voice microphone"
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
                    ? 'Listening... speak your command'
                    : 'Type or tap quick actions...'
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
    bottom: 84,
    right: 18,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#059669',
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
    minHeight: '72%',
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
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
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

  // Status Strip
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusStripText: {
    fontSize: 11.5,
    color: '#334155',
    flex: 1,
  },
  statusStripWage: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },

  // Chat Scroll
  chatScroll: {
    flex: 1,
  },
  chatScrollInner: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  bubbleAi: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#059669',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  bubbleTime: {
    fontSize: 9.5,
    alignSelf: 'flex-end',
  },

  // Interactive Card Actions inside chat
  cardActionGroup: {
    gap: 6,
    marginTop: 4,
  },
  cardActionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionSuccess: {
    backgroundColor: '#059669',
  },
  cardActionPrimary: {
    backgroundColor: '#2563eb',
  },
  cardActionWarning: {
    backgroundColor: '#d97706',
  },
  cardActionDanger: {
    backgroundColor: '#ef4444',
  },
  cardActionNeutral: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cardActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
  },

  typingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  typingText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },

  // Quick Action Chips
  chipRow: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  chipScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
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
