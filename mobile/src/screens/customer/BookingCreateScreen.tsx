// ==============================================================================
// CUSTOMER BOOKING CREATE SCREEN — DATE/TIME, ADDRESS, EMERGENCY & FAIR SPLIT
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { ShieldCheck, Calendar, Clock, MapPin, Zap } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

const localToday = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export const BookingCreateScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const worker = route?.params?.worker || {
    name: 'Rajesh Sharma',
    hourly_rate: 249,
    service: 'Electrical',
    workerId: 'w0000000-0000-0000-0000-000000000001'
  };
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [date, setDate] = useState(localToday);
  const [time, setTime] = useState('10:00 AM');
  const [address, setAddress] = useState('Flat 402, Royal Residency, Connaught Place');
  const [pincode, setPincode] = useState('110001');
  const [description, setDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const basePrice = worker.hourly_rate || worker.hourly_or_base_rate || 350;
  const finalAmount = isEmergency ? Math.round(basePrice * 1.25) : basePrice;

  // 85/10/5 fair split
  const workerCut = Math.round(finalAmount * 0.85);
  const welfareCut = Math.round(finalAmount * 0.10);
  const platformCut = finalAmount - workerCut - welfareCut;

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(t('booking.required_title'), t('booking.required_msg'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: 'p0000000-0000-0000-0000-000000000002', // Demo Customer Priya Singh
        worker_id: worker.workerId || worker.id,
        service_category_id: 's0000000-0000-0000-0000-000000000001',
        booking_date: date,
        booking_time: time,
        address,
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode,
        latitude: 26.9017,
        longitude: 77.2167,
        service_description: description,
        estimated_amount: finalAmount,
        final_amount: finalAmount,
        is_emergency: isEmergency
      };

      const result = await ApiClient.createBooking(payload);

      Alert.alert(
        t('booking.confirmed_title'),
        t('booking.confirmed_msg', {
          code: result.booking_code || 'BK-2026-NEW',
          name: worker.name || t('bookingDetail.worker_fallback')
        }),
        [
          {
            text: t('booking.view_bookings'),
            onPress: () => navigation.navigate('CustomerTabs', { screen: 'Bookings' })
          }
        ]
      );
    } catch (err: any) {
      Alert.alert(t('booking.error_title'), err.message || t('booking.error_title'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('booking.book_worker')}
        subtitle={worker.name || worker.worker_code}
        onPressLanguage={() => {}}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Worker Info Card */}
        <View style={styles.workerSummary}>
          <Text style={styles.workerName}>{worker.name || 'Verified Professional'}</Text>
          <Text style={styles.workerTrade}>{worker.service || worker.skill_category} • ★ {worker.rating || worker.average_rating}</Text>
        </View>

        {/* Schedule Inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.date_label')}</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder={t('booking.placeholder_date')}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>{t('booking.time_label')}</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder={t('booking.placeholder_time')}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.address_label')}</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder={t('booking.placeholder_address')}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>{t('booking.pincode_label')}</Text>
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={setPincode}
            keyboardType="numeric"
            maxLength={6}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Emergency Toggle */}
        <View style={styles.emergencyRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.emergencyTagRow}>
              <Zap size={16} color={colors.danger} />
              <Text style={styles.emergencyLabel}>{t('booking.emergency_label')}</Text>
            </View>
            <Text style={styles.emergencySub}>{t('booking.emergency_sub')}</Text>
          </View>
          <Switch
            value={isEmergency}
            onValueChange={setIsEmergency}
            trackColor={{ false: colors.border, true: colors.dangerLight }}
            thumbColor={isEmergency ? colors.danger : colors.surface}
          />
        </View>

        {/* Requirement Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.desc_label')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('booking.placeholder_desc')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Transparent Cooperative Fair Split Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownTitleRow}>
            <ShieldCheck size={18} color={colors.success} />
            <Text style={styles.breakdownTitle}>{t('booking.wage_split_title')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('booking.worker_cut')}</Text>
            <Text style={styles.breakdownValue}>₹{workerCut}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('booking.welfare_cut')}</Text>
            <Text style={styles.breakdownValue}>₹{welfareCut}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('booking.platform_cut')}</Text>
            <Text style={styles.breakdownValue}>₹{platformCut}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('booking.total_est')}</Text>
            <Text style={styles.totalValue}>₹{finalAmount}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.submitBtnText}>{t('booking.confirm_btn')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  workerSummary: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  workerTrade: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2
  },
  section: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top'
  },
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: 16
  },
  emergencyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  emergencyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dangerDark
  },
  emergencySub: {
    fontSize: 11,
    color: colors.dangerDark,
    marginTop: 2,
    opacity: 0.85
  },
  breakdownCard: {
    backgroundColor: colors.successLight,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: 20
  },
  breakdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.successDark
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.successDark
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successDark
  },
  divider: {
    height: 1,
    backgroundColor: colors.success,
    opacity: 0.5,
    marginVertical: 8
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.successDark
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textInverse
  }
});