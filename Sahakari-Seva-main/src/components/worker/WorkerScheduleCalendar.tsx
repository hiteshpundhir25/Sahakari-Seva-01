// ==============================================================================
// WORKER SCHEDULE CALENDAR COMPONENT
// Interactive monthly calendar for Service Worker accepted & scheduled jobs.
// Allows date filtering, inspecting job details, status management & rescheduling.
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
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
import { FadeInView, ScalePressable } from '../../animations';

interface WorkerScheduleCalendarProps {
  workerId: string;
  navigation: any;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  // Calendar View State: Year & Month (0-11)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // September 2026 default for demo
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-10');

  // Selected Job for Detail / Reschedule Modal
  const [activeJob, setActiveJob] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>('10:00');
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  // Fetch jobs for this specific worker
  const loadWorkerJobs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getBookings(undefined, workerId);
      // Filter for jobs assigned to this worker
      const filtered = (data || []).filter(
        b => b.worker_id === workerId && (b.status === 'accepted' || b.status === 'in_progress' || b.status === 'completed')
      );
      setAllJobs(filtered);

      // Smart initial date: check if any job is scheduled for today or upcoming in September
      const activeAccepted = filtered.filter(b => b.status === 'accepted' || b.status === 'in_progress');
      if (activeAccepted.length > 0) {
        // Find if any job exists on or near 2026-09-10
        const sorted = [...activeAccepted].sort((a, b) => a.booking_date.localeCompare(b.booking_date));
        const todayJob = sorted.find(b => b.booking_date === '2026-09-10');
        if (todayJob) {
          setSelectedDate(todayJob.booking_date);
          const [y, m] = todayJob.booking_date.split('-').map(Number);
          setCurrentYear(y);
          setCurrentMonth(m - 1);
        } else if (sorted[0]) {
          setSelectedDate(sorted[0].booking_date);
          const [y, m] = sorted[0].booking_date.split('-').map(Number);
          setCurrentYear(y);
          setCurrentMonth(m - 1);
        }
      }
    } catch (err) {
      console.warn('[WorkerScheduleCalendar] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerJobs();
  }, [workerId]);

  // Group accepted/in-progress jobs by YYYY-MM-DD
  const jobsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const job of allJobs) {
      if (!map[job.booking_date]) {
        map[job.booking_date] = [];
      }
      map[job.booking_date].push(job);
    }
    return map;
  }, [allJobs]);

  // Jobs for the currently selected month
  const currentMonthJobsCount = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return allJobs.filter(
      j => j.booking_date.startsWith(monthPrefix) && (j.status === 'accepted' || j.status === 'in_progress')
    ).length;
  }, [allJobs, currentYear, currentMonth]);

  // Next upcoming job after selected date
  const nextUpcomingJob = useMemo(() => {
    const futureJobs = allJobs
      .filter(j => (j.status === 'accepted' || j.status === 'in_progress') && j.booking_date > selectedDate)
      .sort((a, b) => a.booking_date.localeCompare(b.booking_date));
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
      const isToday = dateStr === '2026-09-10'; // synchronized demo today
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
  }, [currentYear, currentMonth, selectedDate, jobsByDate]);

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
    setCurrentYear(2026);
    setCurrentMonth(8); // September
    setSelectedDate('2026-09-10');
  };

  const handleJumpToDate = (targetDate: string) => {
    const [y, m] = targetDate.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
    setSelectedDate(targetDate);
  };

  // Open Job Detail Modal
  const handleOpenJobModal = (job: Booking) => {
    setActiveJob(job);
    setIsRescheduling(false);
    setNewRescheduleDate(job.booking_date);
    setNewRescheduleTime(job.booking_time || '10:00');
    setIsModalVisible(true);
  };

  // Update Status directly (Start Job / Mark Completed)
  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeJob) return;
    try {
      await ApiClient.updateBookingStatus(activeJob.id, newStatus);
      Alert.alert(
        t('worker.status_updated_title', 'Status Updated'),
        t('worker.status_updated_msg', { status: newStatus })
      );
      setActiveJob(prev => prev ? { ...prev, status: newStatus as any } : null);
      loadWorkerJobs();
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

      // Refresh jobs list and switch calendar to the rescheduled date
      await loadWorkerJobs();
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

  return (
    <View style={styles.container}>
      {/* Calendar Card Container */}
      <View style={styles.card}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconCircle}>
              <CalendarIcon size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>{t('calendar.title')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('calendar.subtitle', { count: currentMonthJobsCount })}
              </Text>
            </View>
          </View>

          {/* Quick "Today" Jump Button */}
          <TouchableOpacity
            style={styles.todayButton}
            onPress={handleJumpToToday}
            activeOpacity={0.7}
          >
            <Clock size={12} color={colors.primary} />
            <Text style={styles.todayButtonText}>{t('calendar.today')}</Text>
          </TouchableOpacity>
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
            {currentMonthJobsCount > 0 && (
              <View style={styles.monthBadge}>
                <Text style={styles.monthBadgeText}>{currentMonthJobsCount} Active</Text>
              </View>
            )}
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
                  idx === 0 && { color: colors.danger }, // Sunday subtle red
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
              const hasAccepted = item.jobs.some(j => j.status === 'accepted');
              const hasInProgress = item.jobs.some(j => j.status === 'in_progress');
              const hasEmergency = item.jobs.some(j => j.is_emergency);

              return (
                <TouchableOpacity
                  key={item.dateStr!}
                  style={[
                    styles.dayCell,
                    item.isSelected && styles.dayCellSelected,
                    item.isToday && !item.isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => setSelectedDate(item.dateStr!)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      item.isSelected && styles.dayNumberSelected,
                      item.isToday && !item.isSelected && styles.dayNumberToday,
                    ]}
                  >
                    {item.day}
                  </Text>

                  {/* Indicator Dot / Pill */}
                  {hasJobs && (
                    <View style={styles.indicatorContainer}>
                      {hasEmergency ? (
                        <View style={[styles.jobDot, { backgroundColor: colors.danger }]} />
                      ) : hasInProgress ? (
                        <View style={[styles.jobDot, { backgroundColor: '#f59e0b' }]} />
                      ) : hasAccepted ? (
                        <View style={[styles.jobDot, { backgroundColor: colors.success }]} />
                      ) : (
                        <View style={[styles.jobDot, { backgroundColor: colors.textMuted }]} />
                      )}

                      {item.jobs.length > 1 && (
                        <Text
                          style={[
                            styles.dotCountText,
                            item.isSelected && { color: colors.textInverse },
                          ]}
                        >
                          {item.jobs.length}
                        </Text>
                      )}
                    </View>
                  )}
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

          {/* If Jobs Exist for Selected Date */}
          {selectedDateJobs.length > 0 ? (
            <View style={styles.jobsList}>
              {selectedDateJobs.map((job, idx) => (
                <FadeInView key={job.id} delay={idx * 60} distance={10} duration={260}>
                  <ScalePressable
                    onPress={() => handleOpenJobModal(job)}
                    style={styles.jobCardPressable}
                    scaleTo={0.98}
                  >
                    <View style={styles.jobCard}>
                      <View style={styles.jobCardTop}>
                        <View style={styles.jobCodeGroup}>
                          <Text style={styles.jobCodeText}>{job.booking_code}</Text>
                          {job.is_emergency && (
                            <View style={styles.emergencyTag}>
                              <Zap size={10} color={colors.danger} />
                              <Text style={styles.emergencyTagText}>EMERGENCY</Text>
                            </View>
                          )}
                        </View>

                        <View
                          style={[
                            styles.statusTag,
                            job.status === 'accepted' && styles.statusTagAccepted,
                            job.status === 'in_progress' && styles.statusTagInProgress,
                            job.status === 'completed' && styles.statusTagCompleted,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusTagText,
                              job.status === 'accepted' && { color: colors.successDark },
                              job.status === 'in_progress' && { color: '#b45309' },
                              job.status === 'completed' && { color: colors.primary },
                            ]}
                          >
                            {job.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Time and Price */}
                      <View style={styles.timePriceRow}>
                        <View style={styles.timeWrap}>
                          <Clock size={12} color={colors.primary} />
                          <Text style={styles.timeSlotText}>
                            {job.booking_time ? `${job.booking_time} hrs` : '10:00 AM'}
                          </Text>
                        </View>

                        <Text style={styles.priceText}>₹{job.final_amount || job.estimated_amount}</Text>
                      </View>

                      {/* Description */}
                      <Text style={styles.jobDesc} numberOfLines={2}>
                        {job.service_description}
                      </Text>

                      {/* Customer & Location */}
                      <View style={styles.locationWrap}>
                        <MapPin size={12} color={colors.textMuted} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {job.address} ({job.pincode})
                        </Text>
                      </View>

                      {/* Card Footer Actions */}
                      <View style={styles.cardFooter}>
                        <Text style={styles.managePromptText}>
                          {t('calendar.manage_job')} • {t('calendar.reschedule')} →
                        </Text>
                      </View>
                    </View>
                  </ScalePressable>
                </FadeInView>
              ))}
            </View>
          ) : (
            /* Empty State for Selected Date */
            <View style={styles.emptyDateBox}>
              <View style={styles.emptyIconCircle}>
                <Sparkles size={18} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyDateTitle}>{t('calendar.no_jobs_date')}</Text>
              <Text style={styles.emptyDateSub}>{t('calendar.no_jobs_sub')}</Text>

              {/* Quick Jump to next upcoming job */}
              {nextUpcomingJob && (
                <TouchableOpacity
                  style={styles.jumpNextBtn}
                  onPress={() => handleJumpToDate(nextUpcomingJob.booking_date)}
                  activeOpacity={0.7}
                >
                  <CalendarDays size={13} color={colors.primary} />
                  <Text style={styles.jumpNextBtnText}>
                    {t('calendar.jump_to_next', {
                      date: nextUpcomingJob.booking_date,
                      code: nextUpcomingJob.booking_code,
                    })}
                  </Text>
                  <ArrowRight size={13} color={colors.primary} />
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
                  85% Direct Worker Take-Home (₹{Math.round((activeJob?.final_amount || 349) * 0.85)}) credited upon completion.
                </Text>
              </View>

              {/* Status Update Quick Triggers */}
              <View style={styles.statusActionSection}>
                <Text style={styles.detailSectionLabel}>JOB STATUS ACTIONS</Text>

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
                      {[
                        { label: 'Today (10 Sep)', date: '2026-09-10' },
                        { label: 'Tomorrow (11 Sep)', date: '2026-09-11' },
                        { label: '12 Sep', date: '2026-09-12' },
                        { label: '14 Sep', date: '2026-09-14' },
                        { label: '15 Sep', date: '2026-09-15' },
                        { label: '16 Sep', date: '2026-09-16' },
                        { label: '20 Sep', date: '2026-09-20' },
                      ].map(item => (
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
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    sectionSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    todayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: isDark ? 'transparent' : colors.primary,
    },
    todayButtonText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
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
      borderRadius: 10,
      padding: 2,
      position: 'relative',
    },
    dayCellSelected: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    dayCellToday: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    dayNumber: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    dayNumberSelected: {
      color: colors.textInverse,
      fontWeight: '800',
    },
    dayNumberToday: {
      color: colors.primary,
      fontWeight: '800',
    },
    indicatorContainer: {
      position: 'absolute',
      bottom: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
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
      marginBottom: 12,
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
      gap: 10,
    },
    jobCardPressable: {
      borderRadius: 14,
    },
    jobCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSubtle,
      borderRadius: 14,
      padding: 13,
      borderWidth: 1.2,
      borderColor: colors.border,
    },
    jobCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    jobCodeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    jobCodeText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    emergencyTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.dangerLight,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    emergencyTagText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: colors.danger,
    },
    statusTag: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 6,
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
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    timePriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    timeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeSlotText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    priceText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
    },
    jobDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
      marginBottom: 8,
    },
    locationWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 8,
    },
    locationText: {
      fontSize: 11,
      color: colors.textMuted,
      flex: 1,
    },
    cardFooter: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    managePromptText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    emptyDateBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.surfaceSubtle,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    emptyIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    emptyDateTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptyDateSub: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    jumpNextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    jumpNextBtnText: {
      fontSize: 11,
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
