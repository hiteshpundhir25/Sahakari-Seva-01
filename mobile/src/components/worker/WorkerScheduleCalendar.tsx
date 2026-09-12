// ==============================================================================
// WORKER SCHEDULE CALENDAR COMPONENT
// Interactive monthly calendar for Service Worker accepted, pending & scheduled jobs.
// Fully reactive with real-time DeviceEventEmitter sync on incoming job requests.
// Decluttered, streamlined layout: compact job rows with essential actions.
// ==============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Linking,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Zap,
  CheckCircle2,
  Phone,
  ArrowRight,
  RotateCcw,
  X,
  Sparkles,
  CalendarDays,
} from 'lucide-react-native';
import { ApiClient } from '../../services/apiClient';
import { Booking } from '../../types';
import { useTheme, Palette } from '../../theme';
import { FadeInView } from '../../animations';

interface WorkerScheduleCalendarProps {
  workerId: string;
  navigation: any;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Normalizes dates like "2026-09-13T10:00:00Z" or "2026-9-13" into strict "YYYY-MM-DD"
 */
export const normalizeCalendarDate = (dateVal?: string): string => {
  if (!dateVal) return '';
  const clean = dateVal.trim();
  const datePart = clean.includes('T') ? clean.split('T')[0] : clean;
  const parts = datePart.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return datePart;
};

export const WorkerScheduleCalendar: React.FC<WorkerScheduleCalendarProps> = ({
  workerId,
  navigation,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Loading & Bookings State
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<Booking[]>([]);

  // Dynamic current date helper
  const getTodayDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return {
      year: y,
      month: now.getMonth(), // 0-11
      day: now.getDate(),
      dateStr: `${y}-${m}-${d}`,
    };
  };

  const todayInfo = useMemo(() => getTodayDate(), []);

  // Calendar View State: Year & Month (0-11)
  const [currentYear, setCurrentYear] = useState<number>(todayInfo.year);
  const [currentMonth, setCurrentMonth] = useState<number>(todayInfo.month);
  const [selectedDate, setSelectedDate] = useState<string>(todayInfo.dateStr);

  // Selected Job for Detail / Reschedule Modal
  const [activeJob, setActiveJob] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>('10:00');
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  // Fetch jobs for this worker (including incoming pending requests)
  const loadWorkerJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getBookings(undefined, workerId);
      const filtered = (data || []).filter(b => {
        const matchesWorker =
          !workerId ||
          b.worker_id === workerId ||
          (b.worker as any)?.id === workerId ||
          (b.worker as any)?.workerId === workerId ||
          (!b.worker_id && workerId === 'w0000000-0000-0000-0000-000000000001');

        const activeStatus =
          b.status === 'pending' ||
          b.status === 'accepted' ||
          b.status === 'in_progress' ||
          b.status === 'completed';

        return matchesWorker && activeStatus;
      });

      setAllJobs(filtered);
    } catch (err) {
      console.warn('[WorkerScheduleCalendar] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  // Initial load and real-time subscription to booking updates
  useEffect(() => {
    loadWorkerJobs();
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      loadWorkerJobs();
    });
    return () => {
      sub.remove();
    };
  }, [loadWorkerJobs]);

  // Group all relevant jobs by normalized YYYY-MM-DD
  const jobsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const job of allJobs) {
      const key = normalizeCalendarDate(job.booking_date);
      if (!key) continue;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(job);
    }

    // Sort jobs on each date: pending first (urgent action), then in_progress, accepted, completed
    for (const d in map) {
      map[d].sort((a, b) => {
        const priority: Record<string, number> = {
          pending: 1,
          in_progress: 2,
          accepted: 3,
          completed: 4,
        };
        return (priority[a.status] || 5) - (priority[b.status] || 5);
      });
    }
    return map;
  }, [allJobs]);

  // Jobs for the currently selected month
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const currentMonthJobs = useMemo(() => {
    return allJobs.filter(j => normalizeCalendarDate(j.booking_date).startsWith(monthPrefix));
  }, [allJobs, monthPrefix]);

  const pendingRequestsCount = useMemo(() => {
    return currentMonthJobs.filter(j => j.status === 'pending').length;
  }, [currentMonthJobs]);

  const activeScheduledCount = useMemo(() => {
    return currentMonthJobs.filter(j => j.status === 'accepted' || j.status === 'in_progress').length;
  }, [currentMonthJobs]);

  // Next upcoming job or pending request after selected date
  const nextUpcomingJob = useMemo(() => {
    const futureJobs = allJobs
      .filter(
        j =>
          (j.status === 'pending' || j.status === 'accepted' || j.status === 'in_progress') &&
          normalizeCalendarDate(j.booking_date) > selectedDate
      )
      .sort((a, b) =>
        normalizeCalendarDate(a.booking_date).localeCompare(normalizeCalendarDate(b.booking_date))
      );
    return futureJobs[0] || null;
  }, [allJobs, selectedDate]);

  // Days matrix for current month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{
      day: number | null;
      dateStr: string | null;
      isToday: boolean;
      isSelected: boolean;
      jobs: Booking[];
    }> = [];

    // Preceding empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        day: null,
        dateStr: null,
        isToday: false,
        isSelected: false,
        jobs: [],
      });
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayInfo.dateStr;
      const isSelected = dateStr === selectedDate;
      const dayJobs = jobsByDate[dateStr] || [];

      days.push({
        day: d,
        dateStr,
        isToday,
        isSelected,
        jobs: dayJobs,
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedDate, jobsByDate, todayInfo]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const cur = getTodayDate();
    setCurrentYear(cur.year);
    setCurrentMonth(cur.month);
    setSelectedDate(cur.dateStr);
  };

  const handleJumpToDate = (targetDate: string) => {
    const norm = normalizeCalendarDate(targetDate);
    const parts = norm.split('-').map(Number);
    if (parts.length === 3) {
      setCurrentYear(parts[0]);
      setCurrentMonth(parts[1] - 1);
      setSelectedDate(norm);
    }
  };

  // Open Job Detail Modal
  const handleOpenJobModal = (job: Booking) => {
    setActiveJob(job);
    setIsRescheduling(false);
    setNewRescheduleDate(normalizeCalendarDate(job.booking_date));
    setNewRescheduleTime(job.booking_time || '10:00');
    setIsModalVisible(true);
  };

  // Direct 1-tap Accept Job
  const handleDirectAccept = async (job: Booking) => {
    try {
      await ApiClient.updateBookingStatus(job.id, 'accepted');
      Alert.alert(
        'Job Accepted! 🎉',
        `Booking ${job.booking_code} is confirmed and scheduled.`
      );
      await loadWorkerJobs();
      DeviceEventEmitter.emit('app_booking_updated');
    } catch (err: any) {
      Alert.alert(t('booking.error_title', 'Error'), err.message || 'Could not accept job');
    }
  };

  // Direct 1-tap Decline Job
  const handleDirectDecline = (job: Booking) => {
    Alert.alert(
      'Decline Job Request',
      `Are you sure you want to decline booking ${job.booking_code}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiClient.updateBookingStatus(job.id, 'rejected');
              await loadWorkerJobs();
              DeviceEventEmitter.emit('app_booking_updated');
            } catch (err: any) {
              Alert.alert(t('booking.error_title', 'Error'), err.message || 'Could not decline job');
            }
          },
        },
      ]
    );
  };

  // Direct 1-tap Start Service
  const handleDirectStart = async (job: Booking) => {
    try {
      await ApiClient.updateBookingStatus(job.id, 'in_progress');
      await loadWorkerJobs();
      DeviceEventEmitter.emit('app_booking_updated');
    } catch (err: any) {
      Alert.alert(t('booking.error_title', 'Error'), err.message || 'Could not start job');
    }
  };

  // Direct 1-tap Complete Job
  const handleDirectComplete = async (job: Booking) => {
    try {
      await ApiClient.updateBookingStatus(job.id, 'completed');
      await loadWorkerJobs();
      DeviceEventEmitter.emit('app_booking_updated');
    } catch (err: any) {
      Alert.alert(t('booking.error_title', 'Error'), err.message || 'Could not complete job');
    }
  };

  // Update Status from Modal (Accept, Start Job, Mark Completed, Reject)
  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeJob) return;
    try {
      await ApiClient.updateBookingStatus(activeJob.id, newStatus);
      Alert.alert(
        t('worker.status_updated_title', 'Status Updated'),
        newStatus === 'accepted'
          ? `Booking ${activeJob.booking_code} accepted! Added to your schedule.`
          : newStatus === 'rejected'
          ? `Booking ${activeJob.booking_code} declined.`
          : t('worker.status_updated_msg', { status: newStatus })
      );

      if (newStatus === 'rejected') {
        setIsModalVisible(false);
        setActiveJob(null);
      } else {
        setActiveJob(prev => prev ? { ...prev, status: newStatus as any } : null);
      }

      await loadWorkerJobs();
      DeviceEventEmitter.emit('app_booking_updated');
    } catch (err: any) {
      Alert.alert(t('booking.error_title', 'Error'), err.message);
    }
  };

  // Reschedule execution
  const handleConfirmReschedule = async () => {
    if (!activeJob) return;
    if (!newRescheduleDate) {
      Alert.alert(t('calendar.reschedule_title'), 'Please select a valid date.');
      return;
    }

    try {
      setRescheduleSaving(true);
      await ApiClient.rescheduleBooking(activeJob.id, newRescheduleDate, newRescheduleTime);
      Alert.alert(
        t('calendar.reschedule_title'),
        t('calendar.rescheduled_success')
      );
      setIsRescheduling(false);
      setIsModalVisible(false);

      await loadWorkerJobs();
      DeviceEventEmitter.emit('app_booking_updated');
      handleJumpToDate(newRescheduleDate);
    } catch (err: any) {
      Alert.alert(t('calendar.reschedule_title'), err.message || t('calendar.reschedule_error'));
    } finally {
      setRescheduleSaving(false);
    }
  };

  const handleCallCustomer = (phone?: string) => {
    const targetPhone = phone || '+91 98765 43210';
    Linking.openURL(`tel:${targetPhone}`).catch(() => {
      Alert.alert(
        t('booking.phone_contact_title', 'Phone Contact'),
        `Customer phone: ${targetPhone}`
      );
    });
  };

  // Jobs for the currently selected date
  const selectedDateJobs = useMemo(() => {
    return jobsByDate[selectedDate] || [];
  }, [jobsByDate, selectedDate]);

  // Formatted date string for selected date
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const weekday = WEEKDAY_NAMES[d.getDay()];
      const monthName = MONTH_NAMES[d.getMonth()].slice(0, 3);
      return `${weekday}, ${parts[2]} ${monthName} ${parts[0]}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Dynamic quick dates for reschedule modal
  const quickRescheduleDates = useMemo(() => {
    const list: Array<{ label: string; date: string }> = [];
    const base = new Date();
    for (let offset = 0; offset <= 7; offset++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      const monthAbbr = MONTH_NAMES[d.getMonth()].slice(0, 3);
      let label = `${d.getDate()} ${monthAbbr}`;
      if (offset === 0) label = `Today (${d.getDate()} ${monthAbbr})`;
      else if (offset === 1) label = `Tomorrow (${d.getDate()} ${monthAbbr})`;
      list.push({ label, date: dateStr });
    }
    return list;
  }, []);

  return (
    <View style={styles.container}>
      {/* Calendar Card Container */}
      <View style={styles.card}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.iconCircle, pendingRequestsCount > 0 && { backgroundColor: '#fef3c7' }]}>
              <CalendarIcon size={18} color={pendingRequestsCount > 0 ? '#d97706' : colors.primary} />
            </View>
            <View style={styles.titleTextCol}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Schedule & Jobs
              </Text>
              <Text style={styles.sectionSubtitle} numberOfLines={1}>
                {pendingRequestsCount > 0
                  ? `${activeScheduledCount} scheduled, ${pendingRequestsCount} new`
                  : `${activeScheduledCount} scheduled this month`}
              </Text>
            </View>
          </View>

          {/* Quick Actions: Today & Refresh */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={handleJumpToToday}
              activeOpacity={0.7}
            >
              <Clock size={11} color={colors.primary} />
              <Text style={styles.todayButtonText}>{t('calendar.today')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshIconBtn}
              onPress={loadWorkerJobs}
              activeOpacity={0.7}
            >
              <RotateCcw size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Navigation Row */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handlePrevMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.monthLabelWrap}>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
            {pendingRequestsCount > 0 ? (
              <View style={[styles.monthBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.monthBadgeText, { color: '#b45309' }]}>
                  {pendingRequestsCount} New Request{pendingRequestsCount > 1 ? 's' : ''}
                </Text>
              </View>
            ) : currentMonthJobs.length > 0 ? (
              <View style={styles.monthBadge}>
                <Text style={styles.monthBadgeText}>{currentMonthJobs.length} Active</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handleNextMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronRight size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAY_NAMES.map((w, idx) => (
            <View key={w} style={styles.weekdayCol}>
              <Text
                style={[
                  styles.weekdayText,
                  idx === 0 && { color: colors.danger },
                ]}
              >
                {w}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Days Grid */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.grid}>
            {calendarDays.map((item, idx) => {
              if (item.day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const hasJobs = item.jobs.length > 0;
              const hasPending = item.jobs.some(j => j.status === 'pending');
              const hasInProgress = item.jobs.some(j => j.status === 'in_progress');
              const hasEmergency = item.jobs.some(j => j.is_emergency);

              return (
                <TouchableOpacity
                  key={item.dateStr!}
                  style={styles.dayCell}
                  onPress={() => setSelectedDate(item.dateStr!)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayBadge,
                      item.isSelected && styles.dayBadgeSelected,
                      item.isToday && !item.isSelected && styles.dayBadgeToday,
                      hasPending && !item.isSelected && styles.dayBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        item.isSelected && styles.dayNumberSelected,
                        item.isToday && !item.isSelected && styles.dayNumberToday,
                        hasPending && !item.isSelected && !item.isToday && styles.dayNumberPending,
                      ]}
                    >
                      {item.day}
                    </Text>

                    {/* Indicator Dot / Pill */}
                    {hasJobs ? (
                      <View style={styles.indicatorContainer}>
                        <View
                          style={[
                            styles.jobDot,
                            {
                              backgroundColor: item.isSelected
                                ? (hasEmergency ? '#fee2e2' : hasPending ? '#fef08a' : hasInProgress ? '#93c5fd' : '#ffffff')
                                : (hasEmergency ? colors.danger : hasPending ? '#f59e0b' : hasInProgress ? '#3b82f6' : colors.success),
                            },
                          ]}
                        />

                        {item.jobs.length > 1 && (
                          <Text
                            style={[
                              styles.dotCountText,
                              item.isSelected && { color: '#ffffff' },
                              hasPending && !item.isSelected && { color: '#d97706' },
                            ]}
                          >
                            {item.jobs.length}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View style={styles.emptyDotPlaceholder} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected Date Header & Jobs List */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHeaderRow}>
            <View style={styles.dateTitleRow}>
              <CalendarDays size={15} color={colors.primary} />
              <Text style={styles.scheduleDateTitle}>{selectedDateFormatted}</Text>
            </View>
            <View style={styles.jobCountPill}>
              <Text style={styles.jobCountPillText}>
                {selectedDateJobs.length} {selectedDateJobs.length === 1 ? 'Job' : 'Jobs'}
              </Text>
            </View>
          </View>

          {/* If Jobs Exist for Selected Date: Squeezed, Decluttered, Essential Info Only */}
          {selectedDateJobs.length > 0 ? (
            <View style={styles.jobsList}>
              {selectedDateJobs.map((job, idx) => {
                const isPending = job.status === 'pending';
                const isAccepted = job.status === 'accepted';
                const isInProgress = job.status === 'in_progress';
                const isCompleted = job.status === 'completed';

                return (
                  <FadeInView key={job.id} delay={idx * 25} distance={6} duration={200}>
                    <View
                      style={[
                        styles.jobCard,
                        isPending
                          ? styles.jobCardPending
                          : isAccepted
                          ? styles.jobCardAccepted
                          : isInProgress
                          ? styles.jobCardInProgress
                          : styles.jobCardCompleted,
                      ]}
                    >
                      {/* Compact Top Info: Code, Time, Price, Status */}
                      <View style={styles.compactCardTop}>
                        <View style={styles.codeTimeCol}>
                          <View style={styles.jobCodeRow}>
                            <Text style={styles.jobCodeText}>{job.booking_code}</Text>
                            {job.is_emergency && (
                              <View style={styles.emergencyTag}>
                                <Zap size={8} color={colors.danger} />
                                <Text style={styles.emergencyTagText}>EMERGENCY</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.timeWrap}>
                            <Clock size={11} color={isPending ? '#d97706' : colors.textMuted} />
                            <Text
                              style={[
                                styles.timeSlotText,
                                isPending && { color: '#b45309', fontWeight: '700' },
                              ]}
                            >
                              {job.booking_time ? `${job.booking_time} hrs` : '10:00 AM'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.priceStatusCol}>
                          <Text style={[styles.priceText, isPending && { color: '#b45309' }]}>
                            ₹{job.final_amount || job.estimated_amount}
                          </Text>
                          <View
                            style={[
                              styles.statusTag,
                              isPending && styles.statusTagPending,
                              isAccepted && styles.statusTagAccepted,
                              isInProgress && styles.statusTagInProgress,
                              isCompleted && styles.statusTagCompleted,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusTagText,
                                isPending && { color: '#b45309' },
                                isAccepted && { color: colors.successDark },
                                isInProgress && { color: '#2563eb' },
                                isCompleted && { color: colors.primary },
                              ]}
                            >
                              {isPending ? 'NEW REQUEST' : job.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Compact Action Buttons Row (Accept, Decline, Details, or Start/Complete) */}
                      <View style={styles.compactActionsRow}>
                        {isPending ? (
                          <>
                            <TouchableOpacity
                              style={styles.cardAcceptBtn}
                              onPress={() => handleDirectAccept(job)}
                              activeOpacity={0.8}
                            >
                              <CheckCircle2 size={12} color="#ffffff" />
                              <Text style={styles.cardAcceptBtnText}>Accept Job</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.cardDeclineBtn}
                              onPress={() => handleDirectDecline(job)}
                              activeOpacity={0.8}
                            >
                              <X size={12} color={colors.danger} />
                              <Text style={styles.cardDeclineBtnText}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.cardDetailsBtn}
                              onPress={() => handleOpenJobModal(job)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.cardDetailsBtnText}>Details →</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            {isAccepted && (
                              <TouchableOpacity
                                style={styles.cardStartBtn}
                                onPress={() => handleDirectStart(job)}
                                activeOpacity={0.8}
                              >
                                <CheckCircle2 size={12} color="#ffffff" />
                                <Text style={styles.cardStartBtnText}>Start Job</Text>
                              </TouchableOpacity>
                            )}

                            {isInProgress && (
                              <TouchableOpacity
                                style={styles.cardCompleteBtn}
                                onPress={() => handleDirectComplete(job)}
                                activeOpacity={0.8}
                              >
                                <CheckCircle2 size={12} color="#ffffff" />
                                <Text style={styles.cardCompleteBtnText}>Complete Job</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.cardDetailsBtn}
                              onPress={() => handleOpenJobModal(job)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.cardDetailsBtnText}>Details →</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  </FadeInView>
                );
              })}
            </View>
          ) : (
            /* Empty State for Selected Date */
            <View style={styles.emptyDateBox}>
              <View style={styles.emptyIconCircle}>
                <Sparkles size={16} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyDateTitle}>{t('calendar.no_jobs_date')}</Text>
              <Text style={styles.emptyDateSub}>{t('calendar.no_jobs_sub')}</Text>

              {nextUpcomingJob && (
                <TouchableOpacity
                  style={styles.jumpNextBtn}
                  onPress={() => handleJumpToDate(nextUpcomingJob.booking_date)}
                  activeOpacity={0.7}
                >
                  <CalendarDays size={12} color={colors.primary} />
                  <Text style={styles.jumpNextBtnText}>
                    {t('calendar.jump_to_next', {
                      date: nextUpcomingJob.booking_date,
                      code: nextUpcomingJob.booking_code,
                    })}
                  </Text>
                  <ArrowRight size={12} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* ========================================================================= */}
      {/* INTERACTIVE JOB MANAGEMENT & RESCHEDULE MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconWrap}>
                  <CalendarIcon size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>{activeJob?.booking_code}</Text>
                  <Text style={styles.modalSubtitle}>
                    {activeJob?.booking_date} at {activeJob?.booking_time || '10:00 AM'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Job Details Card */}
              <View style={styles.detailCard}>
                <Text style={styles.detailSectionLabel}>SERVICE DESCRIPTION</Text>
                <Text style={styles.detailDescText}>{activeJob?.service_description}</Text>

                <View style={styles.detailDivider} />

                <Text style={styles.detailSectionLabel}>CUSTOMER & LOCATION</Text>
                <View style={styles.detailRow}>
                  <User size={14} color={colors.textMuted} />
                  <Text style={styles.detailCustomerName}>
                    {activeJob?.customer?.full_name || 'Customer'}
                  </Text>
                </View>

                <View style={[styles.detailRow, { marginTop: 6 }]}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={styles.detailAddressText}>
                    {activeJob?.address}, {activeJob?.city} ({activeJob?.pincode})
                  </Text>
                </View>

                {/* Call Customer Button */}
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCallCustomer(activeJob?.customer?.phone)}
                  activeOpacity={0.8}
                >
                  <Phone size={14} color="#ffffff" />
                  <Text style={styles.callBtnText}>Call Customer for Coordination</Text>
                </TouchableOpacity>

                <View style={styles.detailDivider} />

                {/* Rate & Settlement */}
                <View style={styles.rateRow}>
                  <Text style={styles.rateLabel}>Total Service Rate</Text>
                  <Text style={styles.rateValue}>₹{activeJob?.final_amount || activeJob?.estimated_amount}</Text>
                </View>
                <Text style={styles.rateSub}>
                  85% Direct Worker Take-Home (₹{Math.round((activeJob?.final_amount || activeJob?.estimated_amount || 349) * 0.85)}) credited upon completion.
                </Text>
              </View>

              {/* Status Update Quick Triggers */}
              <View style={styles.statusActionSection}>
                <Text style={styles.detailSectionLabel}>JOB STATUS ACTIONS</Text>

                {activeJob?.status === 'pending' && (
                  <View style={styles.pendingModalActions}>
                    <TouchableOpacity
                      style={[styles.actionTriggerBtn, { backgroundColor: colors.success, marginBottom: 8 }]}
                      onPress={() => handleUpdateStatus('accepted')}
                      activeOpacity={0.8}
                    >
                      <CheckCircle2 size={16} color="#ffffff" />
                      <Text style={styles.actionTriggerBtnText}>Accept Job Request ✓</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionTriggerBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', borderWidth: 1, borderColor: colors.danger }]}
                      onPress={() => handleUpdateStatus('rejected')}
                      activeOpacity={0.8}
                    >
                      <X size={16} color={colors.danger} />
                      <Text style={[styles.actionTriggerBtnText, { color: colors.danger }]}>Decline Request</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeJob?.status === 'accepted' && (
                  <TouchableOpacity
                    style={[styles.actionTriggerBtn, { backgroundColor: colors.info }]}
                    onPress={() => handleUpdateStatus('in_progress')}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2 size={16} color="#ffffff" />
                    <Text style={styles.actionTriggerBtnText}>Start Service Work (In Progress)</Text>
                  </TouchableOpacity>
                )}

                {activeJob?.status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.actionTriggerBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleUpdateStatus('completed')}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2 size={16} color="#ffffff" />
                    <Text style={styles.actionTriggerBtnText}>Mark Job Completed ✓</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* RESCHEDULE SECTION */}
              <View style={styles.rescheduleContainer}>
                <View style={styles.rescheduleHeaderRow}>
                  <View style={styles.rescheduleTitleWrap}>
                    <RotateCcw size={16} color={colors.primary} />
                    <Text style={styles.rescheduleTitleText}>{t('calendar.reschedule_title')}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsRescheduling(prev => !prev)}
                    style={styles.toggleRescheduleBtn}
                  >
                    <Text style={styles.toggleRescheduleBtnText}>
                      {isRescheduling ? 'Cancel' : 'Change Date/Time'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isRescheduling && (
                  <View style={styles.rescheduleForm}>
                    <Text style={styles.formLabel}>{t('calendar.select_new_date')}</Text>
                    <View style={styles.quickDatePills}>
                      {quickRescheduleDates.map(item => (
                        <TouchableOpacity
                          key={item.date}
                          style={[
                            styles.datePill,
                            newRescheduleDate === item.date && styles.datePillActive,
                          ]}
                          onPress={() => setNewRescheduleDate(item.date)}
                        >
                          <Text
                            style={[
                              styles.datePillText,
                              newRescheduleDate === item.date && styles.datePillTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.formLabel, { marginTop: 14 }]}>
                      {t('calendar.select_new_time')}
                    </Text>
                    <View style={styles.quickTimePills}>
                      {[
                        { label: t('calendar.morning'), time: '10:00' },
                        { label: t('calendar.afternoon'), time: '14:00' },
                        { label: t('calendar.evening'), time: '17:30' },
                      ].map(slot => (
                        <TouchableOpacity
                          key={slot.time}
                          style={[
                            styles.timePill,
                            newRescheduleTime === slot.time && styles.timePillActive,
                          ]}
                          onPress={() => setNewRescheduleTime(slot.time)}
                        >
                          <Text
                            style={[
                              styles.timePillText,
                              newRescheduleTime === slot.time && styles.timePillTextActive,
                            ]}
                          >
                            {slot.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Confirm Reschedule Button */}
                    <TouchableOpacity
                      style={styles.confirmRescheduleBtn}
                      onPress={handleConfirmReschedule}
                      disabled={rescheduleSaving}
                      activeOpacity={0.8}
                    >
                      {rescheduleSaving ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="#ffffff" />
                          <Text style={styles.confirmRescheduleBtnText}>
                            {t('calendar.confirm_reschedule')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Jump to WorkerJobs Tab shortcut */}
              <TouchableOpacity
                style={styles.jobsTabLink}
                onPress={() => {
                  setIsModalVisible(false);
                  navigation.navigate('WorkerJobs');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.jobsTabLinkText}>{t('calendar.view_in_jobs')}</Text>
                <ArrowRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginTop: 6,
      marginBottom: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 8,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      marginRight: 6,
    },
    titleTextCol: {
      flex: 1,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    sectionTitle: {
      fontSize: 14.5,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    todayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: isDark ? 'transparent' : colors.primary,
      flexShrink: 0,
    },
    todayButtonText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    refreshIconBtn: {
      width: 26,
      height: 26,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 6,
      marginBottom: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : colors.surfaceSubtle,
      borderRadius: 12,
    },
    navArrowBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
    },
    monthLabelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    monthLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    monthBadge: {
      backgroundColor: colors.successLight,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    monthBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.successDark,
    },
    weekdayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 6,
    },
    weekdayCol: {
      flex: 1,
      alignItems: 'center',
    },
    weekdayText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    loadingBox: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 1,
    },
    dayBadge: {
      width: 36,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 11,
      backgroundColor: 'transparent',
    },
    dayBadgeSelected: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    dayBadgeToday: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    dayBadgePending: {
      borderWidth: 1.5,
      borderColor: '#f59e0b',
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(254, 243, 199, 0.6)',
    },
    dayNumber: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 15,
    },
    dayNumberSelected: {
      color: colors.textInverse,
      fontWeight: '800',
    },
    dayNumberToday: {
      color: colors.primary,
      fontWeight: '800',
    },
    dayNumberPending: {
      color: isDark ? '#fbbf24' : '#d97706',
      fontWeight: '800',
    },
    indicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      height: 6,
      marginTop: 2,
    },
    emptyDotPlaceholder: {
      height: 6,
      marginTop: 2,
    },
    jobDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    dotCountText: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    scheduleSection: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    scheduleHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    dateTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    scheduleDateTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    jobCountPill: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    jobCountPillText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: colors.primary,
    },
    jobsList: {
      gap: 8,
    },

    // Squeezed, Minimal Job Card
    jobCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 9,
      paddingHorizontal: 11,
      borderWidth: 1.4,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1.5 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    jobCardPending: {
      borderColor: '#f59e0b',
      borderLeftWidth: 4.5,
      borderLeftColor: '#f59e0b',
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.06)' : '#fffdf5',
    },
    jobCardAccepted: {
      borderColor: '#10b981',
      borderLeftWidth: 4.5,
      borderLeftColor: '#10b981',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.06)' : '#f0fdf4',
    },
    jobCardInProgress: {
      borderColor: '#3b82f6',
      borderLeftWidth: 4.5,
      borderLeftColor: '#3b82f6',
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.06)' : '#eff6ff',
    },
    jobCardCompleted: {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
      borderLeftWidth: 4,
      borderLeftColor: '#94a3b8',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fafafa',
    },

    // Compact Top Info Row
    compactCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    codeTimeCol: {
      flex: 1,
    },
    jobCodeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    jobCodeText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    emergencyTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.dangerLight,
      paddingHorizontal: 4,
      paddingVertical: 1.5,
      borderRadius: 3,
    },
    emergencyTagText: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.danger,
    },
    timeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    timeSlotText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    priceStatusCol: {
      alignItems: 'flex-end',
      gap: 3,
    },
    priceText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.primary,
    },
    statusTag: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    statusTagPending: {
      backgroundColor: '#fef3c7',
      borderWidth: 1,
      borderColor: '#f59e0b',
    },
    statusTagAccepted: {
      backgroundColor: colors.successLight,
    },
    statusTagInProgress: {
      backgroundColor: '#fef3c7',
    },
    statusTagCompleted: {
      backgroundColor: colors.primaryLight,
    },
    statusTagText: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    // Compact Actions Row
    compactActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    },
    cardAcceptBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.success,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 7,
    },
    cardAcceptBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ffffff',
    },
    cardDeclineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 7,
    },
    cardDeclineBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.danger,
    },
    cardStartBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.info,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 7,
    },
    cardStartBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ffffff',
    },
    cardCompleteBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.primary,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 7,
    },
    cardCompleteBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ffffff',
    },
    cardDetailsBtn: {
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    cardDetailsBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },

    emptyDateBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.surfaceSubtle,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    emptyIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    emptyDateTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptyDateSub: {
      fontSize: 10.5,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    jumpNextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 7,
    },
    jumpNextBtnText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.primary,
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '88%',
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    closeModalBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalScroll: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    detailCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : colors.surfaceSubtle,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    detailSectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    detailDescText: {
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 18,
    },
    detailDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailCustomerName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    detailAddressText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    callBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.success,
      paddingVertical: 9,
      borderRadius: 10,
      marginTop: 12,
    },
    callBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#ffffff',
    },
    rateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rateLabel: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    rateValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    rateSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
    },
    statusActionSection: {
      marginBottom: 16,
    },
    pendingModalActions: {
      marginBottom: 6,
    },
    actionTriggerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 4,
    },
    actionTriggerBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    rescheduleContainer: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : colors.surfaceSubtle,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    rescheduleHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rescheduleTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rescheduleTitleText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    toggleRescheduleBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
    },
    toggleRescheduleBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    rescheduleForm: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    formLabel: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    quickDatePills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    datePill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
      borderWidth: 1,
      borderColor: colors.border,
    },
    datePillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    datePillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    datePillTextActive: {
      color: '#ffffff',
      fontWeight: '800',
    },
    quickTimePills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    timePill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
      borderWidth: 1,
      borderColor: colors.border,
    },
    timePillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timePillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    timePillTextActive: {
      color: '#ffffff',
      fontWeight: '800',
    },
    confirmRescheduleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 14,
    },
    confirmRescheduleBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    jobsTabLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      marginBottom: 20,
    },
    jobsTabLinkText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
  });
