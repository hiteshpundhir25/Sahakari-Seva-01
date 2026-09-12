// ==============================================================================
// WORKER PROFILE SCREEN — SHRAMIK DIGITAL CREDENTIALS & OPERATIONAL CONTROLS
// Digital Smart ID pass with QR verification, operational duty & dispatch radius,
// statutory base rate floor, verified trade skills, welfare passbook, and SOS.
// ==============================================================================

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  DeviceEventEmitter,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import {
  User,
  Shield,
  MapPin,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Radio,
  Navigation as NavIcon,
  Heart,
  TrendingUp,
  Globe,
  LifeBuoy,
  Plus,
  Trash2,
  X,
  Sparkles,
  ChevronRight,
  LogOut,
  Sliders,
  DollarSign,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  FileCheck,
  Check,
  ExternalLink,
} from 'lucide-react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Button, Badge } from '../../components/ui';
import { Header } from '../../components/common/Header';
import { LanguageModal } from '../../components/common/LanguageModal';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { FadeInView, AnimatedNumber, ScalePressable } from '../../animations';
import { ApiClient } from '../../services/apiClient';
import { Worker, AvailabilityStatus } from '../../types';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';
import { AuthContext } from '../../navigation/RootNavigator';

// Robust communication helpers for mobile and web
const openDialer = (phoneNumber: string) => {
  const clean = phoneNumber.replace(/[^0-9+]/g, '');
  if (typeof window !== 'undefined') {
    window.location.href = `tel:${clean}`;
  } else {
    Linking.openURL(`tel:${clean}`).catch(err => {
      console.warn('Dialer error:', err);
    });
  }
};

const openWhatsApp = (phoneNumber: string, text: string) => {
  const clean = phoneNumber.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url).catch(err => {
      console.warn('WhatsApp error:', err);
    });
  }
};

export const WorkerProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: false });
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography, isDark);
  const { logout } = useContext(AuthContext);

  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable Form Fields
  const [bio, setBio] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('350');
  const [serviceArea, setServiceArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [certName, setCertName] = useState('');
  const [availability, setAvailability] = useState<AvailabilityStatus>('available');
  const [radiusKm, setRadiusKm] = useState(15);
  const [activeJob, setActiveJob] = useState<any>(null);

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [addSkillModal, setAddSkillModal] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [showWorkerSosModal, setShowWorkerSosModal] = useState(false);
  const [workerBeaconActive, setWorkerBeaconActive] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCertType, setSelectedCertType] = useState('National Trade Certificate (NTC) — ITI');
  const [certRollNumber, setCertRollNumber] = useState('NTC-RJ-2021-88421');
  const [certIssuingBody, setCertIssuingBody] = useState('National Council for Vocational Training (NCVT)');
  const [certYear, setCertYear] = useState('2021');
  const [certSubmitting, setCertSubmitting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const w = await ApiClient.getWorkerById('w0000000-0000-0000-0000-000000000001');
          if (w) {
            setWorker(w);
            setBio(w.bio || 'Govt ITI certified electrician with 8+ years experience in domestic and commercial troubleshooting.');
            setSkillCategory(w.skill_category || 'Electrical');
            setHourlyRate(String(w.hourly_or_base_rate || 350));
            setServiceArea(w.service_area || 'C-Scheme, Jaipur (MI Road)');
            setPincode(w.pincode || '302001');
            setSkillsList(w.skills && w.skills.length > 0 ? w.skills : ['House Wiring', 'MCB Fix', 'Inverter Cabling']);
            setCertName(w.certification_name || 'Govt ITI National Trade Certificate');
            setRadiusKm(w.service_radius_km || 15);

            const bookings = await ApiClient.getBookings(undefined, w.id);
            const currentActive = bookings.find(
              (b: any) => b.status === 'accepted' || b.status === 'in_progress'
            );
            setActiveJob(currentActive || null);
            if (currentActive) {
              setAvailability(currentActive.is_emergency ? 'emergency_only' : 'busy');
            } else {
              setAvailability(
                w.availability_status === 'busy' || w.availability_status === 'emergency_only'
                  ? 'available'
                  : w.availability_status || 'available'
              );
            }
          }
        } catch {
          // Handled in ApiClient fallback
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001').then(bookings => {
        const currentActive = bookings.find(
          (b: any) => b.status === 'accepted' || b.status === 'in_progress'
        );
        setActiveJob(currentActive || null);
        if (currentActive) {
          setAvailability(currentActive.is_emergency ? 'emergency_only' : 'busy');
        }
      });
    });
    return () => {
      sub.remove();
    };
  }, []);

  const handleUpdateAvailability = async (newStatus: AvailabilityStatus) => {
    if (activeJob) {
      const isEmerg = activeJob.is_emergency;
      Alert.alert(
        isEmerg ? '🚨 Emergency Service Locked' : '⚡ Active Work in Progress',
        isEmerg
          ? `You are currently dispatched on an emergency SOS job (${activeJob.booking_code}). Operational mode is locked to Emergency Service until completion.`
          : `You are currently on an active service assignment (${activeJob.booking_code}). Operational mode will automatically revert to "Active for work" once this job is completed.`,
        [
          {
            text: 'View Job Details',
            onPress: () => {
              if (navigation) {
                navigation.navigate('WorkerJobDetail', {
                  bookingId: activeJob.id,
                  job: activeJob,
                });
              }
            },
          },
          { text: 'Understood', style: 'cancel' },
        ]
      );
      return;
    }

    setAvailability(newStatus);
    try {
      await ApiClient.updateWorkerAvailability('w0000000-0000-0000-0000-000000000001', newStatus);
      DeviceEventEmitter.emit('app_booking_updated');
    } catch (e) {
      console.warn('Availability update failed:', e);
    }
  };

  const handleUpdateRadius = async (newRadius: number) => {
    setRadiusKm(newRadius);
    try {
      await ApiClient.updateWorkerLocation('w0000000-0000-0000-0000-000000000001', 26.9124, 75.7873, newRadius);
    } catch (e) {
      console.warn('Radius update failed:', e);
    }
  };

  const handleSimulateCertUpload = () => {
    setShowCertModal(true);
  };

  const handleSaveCert = async () => {
    setCertSubmitting(true);
    try {
      const updatedCert = `${selectedCertType} (${certRollNumber.trim() || 'VERIFIED'})`;
      setCertName(updatedCert);
      await ApiClient.updateWorkerProfile('w0000000-0000-0000-0000-000000000001', {
        certification_name: updatedCert,
      });
      setShowCertModal(false);
    } catch (e) {
      console.warn('Cert update failed:', e);
    } finally {
      setCertSubmitting(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillText.trim()) return;
    if (!skillsList.includes(newSkillText.trim())) {
      setSkillsList([...skillsList, newSkillText.trim()]);
    }
    setNewSkillText('');
    setAddSkillModal(false);
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkillsList(skillsList.filter(s => s !== skillToDelete));
  };

  const handleSaveProfile = async () => {
    const rateNum = Number(hourlyRate);
    if (rateNum < 249) {
      Alert.alert(
        'Statutory Floor Warning',
        'Cooperative minimum wage floor is ₹249/hr. Base rate cannot be set lower than statutory regulations.'
      );
      return;
    }

    setSaving(true);
    try {
      await ApiClient.updateWorkerProfile('w0000000-0000-0000-0000-000000000001', {
        bio,
        skill_category: skillCategory,
        hourly_or_base_rate: rateNum,
        service_area: serviceArea,
        pincode,
        skills: skillsList,
        certification_name: certName,
      });
      Alert.alert(t('workerProfile.profile_saved_title'), t('workerProfile.profile_saved_msg'));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEmergencySOS = () => {
    setShowWorkerSosModal(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('workerProfile.loading')}</Text>
      </View>
    );
  }

  const workerName = worker?.profile?.full_name || 'Rajesh Sharma';
  const workerInitials = workerName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={styles.screenWrapper}>
      <Header
        title={workerName}
        subtitle={t('worker.federation_member')}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shramik Digital Smart ID Card */}
        <FadeInView delay={0} distance={10} duration={320}>
          <Card style={styles.idCard}>
            <View style={styles.idCardHeader}>
              <View style={styles.idAvatar}>
                <Text style={styles.idAvatarText}>{workerInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.idNameRow}>
                  <Text style={styles.idName}>{workerName}</Text>
                  <Badge label={t('workerProfile.id_verified')} variant="success" size="sm" />
                </View>
                <Text style={styles.idCode}>{worker?.worker_code || 'WRK-JPR-0101'}</Text>
                <Text style={styles.idCoop}>Jaipur Shramik Sahakari Sangh (Reg. #8842)</Text>
              </View>
            </View>

            {/* Badges Strip */}
            <View style={styles.badgeStrip}>
              <View style={styles.certBadge}>
                <Shield size={11} color="#86efac" />
                <Text style={styles.certBadgeText}>Govt ITI Certified</Text>
              </View>
              <View style={styles.certBadge}>
                <CheckCircle2 size={11} color="#86efac" />
                <Text style={styles.certBadgeText}>Police Verified</Text>
              </View>
              <View style={styles.certBadge}>
                <Heart size={11} color="#86efac" />
                <Text style={styles.certBadgeText}>Ayushman Insured</Text>
              </View>
            </View>

            {/* QR / Digital Pass Toggle */}
            <TouchableOpacity
              style={styles.qrToggleRow}
              onPress={() => setShowQrModal(true)}
              activeOpacity={0.8}
            >
              <QrCode size={15} color="#ffffff" />
              <Text style={styles.qrToggleText}>{t('workerProfile.show_qr')}</Text>
              <ChevronRight size={14} color="#bbf7d0" />
            </TouchableOpacity>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('workerProfile.experience_label')}</Text>
                <Text style={styles.statVal}>{worker?.experience_years || 8} Yrs</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('workerProfile.jobs_label')}</Text>
                <Text style={styles.statVal}>{worker?.total_jobs || 142}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('workerProfile.rating_label')}</Text>
                <Text style={styles.statVal}>★ {worker?.average_rating || 4.9}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('workerProfile.standby_label')}</Text>
                <Text style={[styles.statValSuccess, !activeJob && availability === 'offline' && { color: '#fca5a5' }]}>
                  {activeJob
                    ? activeJob.is_emergency
                      ? 'Emergency'
                      : 'On Job'
                    : availability}
                </Text>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* Operational Standby & Duty Status Controls */}
        <FadeInView delay={80} distance={10} duration={320}>
          <Card style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <Radio size={16} color={colors.primary} />
              <Text style={styles.controlTitle}>{t('workerProfile.duty_status_title')}</Text>
            </View>

            {/* Active Job Alert Banner if on active job */}
            {activeJob && (
              <View
                style={[
                  styles.activeJobBanner,
                  activeJob.is_emergency && styles.activeEmergencyJobBanner,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.activeJobBannerTitle,
                      activeJob.is_emergency && { color: '#dc2626' },
                    ]}
                  >
                    {activeJob.is_emergency
                      ? '🚨 On Emergency Job (Locked)'
                      : '⚡ On Active Work (Locked)'}
                  </Text>
                  <Text style={styles.activeJobBannerSub}>
                    Assignment #{activeJob.booking_code} · {activeJob.service_name || 'Electrical Service'}. Operational mode is locked until completion.
                  </Text>
                </View>
                {navigation && (
                  <TouchableOpacity
                    style={[
                      styles.viewJobBtn,
                      activeJob.is_emergency && { backgroundColor: '#ef4444' },
                    ]}
                    onPress={() =>
                      navigation.navigate('WorkerJobDetail', {
                        bookingId: activeJob.id,
                        job: activeJob,
                      })
                    }
                  >
                    <Text style={styles.viewJobBtnText}>View Job</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.dutyBtnGroup}>
              <TouchableOpacity
                style={[
                  styles.dutyBtn,
                  (activeJob || availability === 'available') && styles.dutyBtnAvailable,
                  activeJob && styles.dutyBtnDisabled,
                ]}
                onPress={() => handleUpdateAvailability('available')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: activeJob
                        ? activeJob.is_emergency
                          ? '#ef4444'
                          : '#f59e0b'
                        : '#10b981',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.dutyBtnText,
                    (activeJob || availability === 'available') && styles.dutyBtnTextActive,
                  ]}
                >
                  {activeJob
                    ? activeJob.is_emergency
                      ? 'On Emergency Service'
                      : 'On Active Work'
                    : 'Active for work'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dutyBtn,
                  !activeJob && availability === 'offline' && styles.dutyBtnOffline,
                  activeJob && styles.dutyBtnDisabled,
                ]}
                onPress={() => handleUpdateAvailability('offline')}
                activeOpacity={0.7}
              >
                <View style={[styles.statusDot, { backgroundColor: '#94a3b8' }]} />
                <Text
                  style={[
                    styles.dutyBtnText,
                    !activeJob && availability === 'offline' && styles.dutyBtnTextActive,
                  ]}
                >
                  {t('workerProfile.status_offline')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Service Radius Selector */}
            <View style={styles.radiusWrap}>
              <View style={styles.radiusHeader}>
                <NavIcon size={14} color={colors.primary} />
                <Text style={styles.radiusTitle}>{t('workerProfile.dispatch_radius_title')}</Text>
                <Text style={styles.radiusValBadge}>{radiusKm} km</Text>
              </View>

              <View style={styles.radiusChips}>
                {[5, 10, 15, 25].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
                    onPress={() => handleUpdateRadius(r)}
                  >
                    <Text style={[styles.radiusChipText, radiusKm === r && styles.radiusChipTextActive]}>
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* Lifetime Earnings & Welfare Fund Card */}
        <FadeInView delay={140} distance={10} duration={320}>
          <Card style={styles.earningsCard}>
            <View style={styles.earningsGrid}>
              <TouchableOpacity
                style={styles.earnItem}
                onPress={() => {
                  if (navigation) {
                    navigation.navigate('WorkerWelfare');
                  }
                }}
                activeOpacity={0.75}
              >
                <View style={styles.earnIconWrap}>
                  <TrendingUp size={16} color={colors.successDark} />
                </View>
                <AnimatedNumber
                  value={worker?.total_earnings || 74200}
                  prefix="₹"
                  format={n => n.toLocaleString('en-IN')}
                  style={[styles.earnValue, { color: colors.successDark }]}
                />
                <Text style={styles.earnLabel}>Direct Take-Home Earnings</Text>
                <Text style={styles.earnSub}>100% Payout (0% Commission)</Text>
                <Text style={styles.earnActionHint}>Tap to view passbook →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.earnItem}
                onPress={() => {
                  if (navigation) {
                    navigation.navigate('WorkerWelfare');
                  }
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.earnIconWrap, { backgroundColor: colors.secondaryLight }]}>
                  <Heart size={16} color={colors.secondaryDark} />
                </View>
                <AnimatedNumber
                  value={2450}
                  prefix="₹"
                  format={n => n.toLocaleString('en-IN')}
                  style={[styles.earnValue, { color: colors.secondaryDark }]}
                />
                <Text style={styles.earnLabel}>Solidarity Welfare Fund</Text>
                <Text style={styles.earnSub}>Emergency Aid & Health Pool</Text>
                <Text style={styles.earnActionHint}>Tap to view welfare schemes →</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </FadeInView>

        {/* Trade Details Form */}
        <FadeInView delay={200} distance={10} duration={320}>
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>{t('workerProfile.trade_profile_title')}</Text>

            <Text style={styles.label}>{t('workerProfile.primary_trade')}</Text>
            <TextInput
              style={styles.input}
              value={skillCategory}
              onChangeText={setSkillCategory}
              placeholder="e.g. Electrical, Plumbing"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.rateHeaderRow}>
              <Text style={styles.label}>{t('workerProfile.base_rate_label')}</Text>
              <Text style={styles.statutoryBadge}>Min Floor: ₹249/hr</Text>
            </View>
            <TextInput
              style={styles.input}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
              placeholder="350"
              placeholderTextColor={colors.textMuted}
            />

            {/* Specialized Skills Tags */}
            <View style={styles.skillsHeaderRow}>
              <Text style={styles.label}>{t('workerProfile.skills_tags_title')}</Text>
              <TouchableOpacity
                style={styles.addSkillBtn}
                onPress={() => setAddSkillModal(true)}
              >
                <Plus size={11} color={colors.primary} />
                <Text style={styles.addSkillText}>{t('workerProfile.add_skill')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skillsTagWrap}>
              {skillsList.map((skill, idx) => (
                <View key={idx} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteSkill(skill)}
                    style={styles.skillDeleteBtn}
                  >
                    <X size={11} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={styles.label}>{t('workerProfile.coverage_label')}</Text>
            <TextInput
              style={styles.input}
              value={serviceArea}
              onChangeText={setServiceArea}
              placeholder="C-Scheme, Jaipur"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>{t('workerProfile.pincode_label')}</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              placeholder="302001"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>{t('workerProfile.bio_label')}</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholder={t('workerProfile.bio_placeholder')}
              placeholderTextColor={colors.textMuted}
            />
          </Card>
        </FadeInView>

        {/* Certification Documents Card */}
        <FadeInView delay={260} distance={10} duration={320}>
          <Card style={styles.certCard}>
            <Text style={styles.sectionTitle}>{t('workerProfile.cert_title')}</Text>
            <Text style={styles.certDesc}>{t('workerProfile.cert_desc')}</Text>

            <View style={styles.attachedDocRow}>
              <Award size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.docTitle}>{certName || 'ITI Certificate (Verified)'}</Text>
                <Text style={styles.docStatus}>{t('workerProfile.verified_by')}</Text>
              </View>
            </View>

            <Button
              title={t('workerProfile.attach_replace')}
              variant="outline"
              size="sm"
              onPress={handleSimulateCertUpload}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </FadeInView>

        {/* Worker Safety SOS Helpline */}
        <FadeInView delay={320} distance={10} duration={320}>
          <Card style={styles.sosCard}>
            <View style={styles.sosHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosTitle}>{t('workerProfile.emergency_sos')}</Text>
                <Text style={styles.sosSub}>{t('workerProfile.emergency_sos_sub')}</Text>
              </View>
              <TouchableOpacity style={styles.sosBtn} onPress={handleEmergencySOS} activeOpacity={0.8}>
                <LifeBuoy size={16} color="#ffffff" />
                <Text style={styles.sosBtnText}>SOS ALERT</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </FadeInView>

        {/* App Preferences (Language & Theme) */}
        <FadeInView delay={380} distance={10} duration={320}>
          <Card style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setLangModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLabelRow}>
                <Globe size={16} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>{t('customerProfile.language_label')}</Text>
                  <Text style={styles.settingSub}>{t(`lang.${i18n.language || 'hi'}`)} (Active)</Text>
                </View>
              </View>
              <View style={styles.langPill}>
                <Text style={styles.langPillText}>{(i18n.language || 'hi').toUpperCase()}</Text>
                <ChevronRight size={13} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Text style={{ fontSize: 14 }}>{isDark ? '🌙' : '☀️'}</Text>
                <View>
                  <Text style={styles.settingTitle}>{t('customerProfile.theme_label')}</Text>
                  <Text style={styles.settingSub}>{isDark ? 'Night Mode' : 'Day Mode'}</Text>
                </View>
              </View>
              <ThemeToggle />
            </View>
          </Card>
        </FadeInView>

        {/* Save Changes Button */}
        <Button
          title={t('workerProfile.save_profile')}
          variant="primary"
          size="lg"
          loading={saving}
          onPress={handleSaveProfile}
          style={{ marginTop: spacing.md }}
        />

        {/* Logout / Switch Role */}
        <Card style={styles.logoutCard}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.75}>
            <LogOut size={16} color={colors.danger} />
            <Text style={styles.logoutText}>{t('auth.switch_role')}</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* QR Identity Modal */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowQrModal(false)}>
          <Pressable style={styles.qrModalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>{t('workerProfile.nfc_qr_title')}</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.qrModalSub}>{t('workerProfile.nfc_qr_sub')}</Text>

            {/* Simulated QR Code Graphic */}
            <View style={styles.qrFrame}>
              <View style={styles.qrPattern}>
                <View style={styles.qrCornerTopLeft} />
                <View style={styles.qrCornerTopRight} />
                <View style={styles.qrCornerBottomLeft} />
                <View style={styles.qrCenterBadge}>
                  <Shield size={24} color={colors.primary} />
                  <Text style={styles.qrBadgeText}>CO-OP</Text>
                </View>
              </View>
            </View>

            <View style={styles.qrInfoBox}>
              <Text style={styles.qrWorkerName}>{workerName}</Text>
              <Text style={styles.qrCodeText}>{worker?.worker_code || 'WRK-JPR-0101'}</Text>
              <Text style={styles.qrGovtText}>✓ Authenticated by Rajasthan Cooperative Federation</Text>
            </View>

            <Button
              title={t('common.close', 'Close')}
              variant="outline"
              size="sm"
              onPress={() => setShowQrModal(false)}
              style={{ marginTop: 14 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Skill Modal */}
      <Modal visible={addSkillModal} transparent animationType="fade" onRequestClose={() => setAddSkillModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddSkillModal(false)}>
          <Pressable style={styles.qrModalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>{t('workerProfile.add_skill')}</Text>
              <TouchableOpacity onPress={() => setAddSkillModal(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.qrModalSub}>{t('workerProfile.add_skill_prompt')}</Text>
            <TextInput
              style={styles.modalInput}
              value={newSkillText}
              onChangeText={setNewSkillText}
              placeholder="e.g. Solar Panel Inverters"
              placeholderTextColor={colors.textMuted}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                size="sm"
                onPress={() => setAddSkillModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('workerProfile.add_skill')}
                variant="primary"
                size="sm"
                onPress={handleAddSkill}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language Selector Modal */}
      <LanguageModal visible={langModalVisible} onClose={() => setLangModalVisible(false)} />

      {/* Worker Emergency Safety & Distress Modal */}
      <Modal
        visible={showWorkerSosModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorkerSosModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowWorkerSosModal(false)}>
          <Pressable style={styles.actionSheetBox} onPress={e => e.stopPropagation()}>
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetTitleRow}>
                <View style={styles.sosIconWrap}>
                  <LifeBuoy size={20} color="#dc2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetTitle}>Rajasthan Shramik Sahakari SOS</Text>
                  <Text style={styles.actionSheetSub}>Direct Shramik Safety & Police Dispatch Desk</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowWorkerSosModal(false)} style={styles.closeBtn}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Worker Location & Operational Beacon Banner */}
            <View style={styles.workerDistressBanner}>
              <View style={styles.distressHeader}>
                <Radio size={14} color="#dc2626" />
                <Text style={styles.distressTitle}>Active Worker Standby Coords</Text>
                <View style={styles.livePulseBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.livePulseText}>GPS LIVE</Text>
                </View>
              </View>
              <Text style={styles.distressCoords}>26.9124° N, 75.7873° E (Jaipur Metro Zone)</Text>
              <Text style={styles.distressSub}>
                ID: {worker?.worker_code || 'WRK-JPR-0101'} · {workerName} · Federation Registry #8842
              </Text>
            </View>

            {/* Emergency Channels */}
            <Text style={styles.sosSectionHeader}>INSTANT ASSISTANCE CHANNELS</Text>

            <TouchableOpacity
              style={styles.sosActionRowPrimary}
              onPress={() => openDialer('18007242527')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconPrimary}>
                <PhoneCall size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitlePrimary}>Call Shramik Control Room</Text>
                <Text style={styles.actionSubPrimary}>1800-SAHAKAR (1800-724-2527) · Toll Free 24x7</Text>
              </View>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosActionRow}
              onPress={() => openDialer('112')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                <Shield size={18} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Police Emergency & Shramik Desk</Text>
                <Text style={styles.actionSub}>Direct line to Dial 112 with priority co-op tag</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosActionRow}
              onPress={() => openDialer('108')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Heart size={18} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Medical Emergency / Ambulance</Text>
                <Text style={styles.actionSub}>Dial 108 Emergency Medical Response Service</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosActionRow}
              onPress={() =>
                openWhatsApp(
                  '911412227000',
                  `🚨 WORKER DISTRESS ALERT:\nWorker: ${workerName} (${worker?.worker_code || 'WRK-JPR-0101'})\nTrade: ${skillCategory}\nGPS: 26.9124° N, 75.7873° E (Jaipur Metro)\nImmediate police/cooperative intervention requested.`
                )
              }
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <MessageSquare size={18} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>WhatsApp Distress Broadcast</Text>
                <Text style={styles.actionSub}>Sends prefilled coordinates to Control Room</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* One-Tap Dispatch Beacon */}
            <View style={styles.beaconWrap}>
              {workerBeaconActive ? (
                <View style={styles.beaconActiveBox}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.beaconActiveTitle}>Distress Beacon Activated (#SOS-9182)</Text>
                    <Text style={styles.beaconActiveSub}>
                      Nearest patrol unit (Patrol-04, MI Road) alerted. Contact established with Jaipur Control Room #8842.
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.beaconBtn}
                  onPress={() => setWorkerBeaconActive(true)}
                  activeOpacity={0.85}
                >
                  <AlertTriangle size={16} color="#ffffff" />
                  <Text style={styles.beaconBtnText}>Broadcast Live Distress Beacon</Text>
                </TouchableOpacity>
              )}
            </View>

            <Button
              title="Dismiss & Close"
              variant="outline"
              size="sm"
              onPress={() => setShowWorkerSosModal(false)}
              style={{ marginTop: 12 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Shramik Trade Certification Modal */}
      <Modal
        visible={showCertModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCertModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCertModal(false)}>
          <Pressable style={styles.actionSheetBox} onPress={e => e.stopPropagation()}>
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetTitleRow}>
                <View style={[styles.sosIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Award size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetTitle}>Trade Qualification & License</Text>
                  <Text style={styles.actionSheetSub}>Statutory accreditation for zero-commission registry</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCertModal(false)} style={styles.closeBtn}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>SELECT TECHNICAL ACCREDITATION</Text>
              {[
                'National Trade Certificate (NTC) — ITI',
                'Polytechnic Electrical Diploma',
                'Central Electricity Authority Safety Pass',
                'NSDC Skill India Level-4 Certificate',
              ].map((certOption) => (
                <TouchableOpacity
                  key={certOption}
                  style={[
                    styles.certOptionRow,
                    selectedCertType === certOption && styles.certOptionRowActive,
                  ]}
                  onPress={() => setSelectedCertType(certOption)}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.certOptionTitle,
                        selectedCertType === certOption && styles.certOptionTitleActive,
                      ]}
                    >
                      {certOption}
                    </Text>
                    <Text style={styles.certOptionSub}>
                      {certOption.includes('NTC')
                        ? 'NCVT / SCVT Ministry of Skill Development'
                        : certOption.includes('Diploma')
                        ? 'Board of Technical Education, Rajasthan'
                        : certOption.includes('Authority')
                        ? 'Govt of India Electrical Inspectorate'
                        : 'National Skill Development Corporation'}
                    </Text>
                  </View>
                  {selectedCertType === certOption && (
                    <Check size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>ROLL / CERTIFICATE REGISTRATION NUMBER</Text>
              <TextInput
                style={styles.sheetInput}
                value={certRollNumber}
                onChangeText={setCertRollNumber}
                placeholder="e.g. NTC-RJ-2021-88421"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>ISSUING BODY & YEAR</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.sheetInput, { flex: 2 }]}
                  value={certIssuingBody}
                  onChangeText={setCertIssuingBody}
                  placeholder="e.g. NCVT Rajasthan"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.sheetInput, { flex: 1 }]}
                  value={certYear}
                  onChangeText={setCertYear}
                  keyboardType="numeric"
                  placeholder="2021"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.statutoryNoticeBox}>
                <Shield size={14} color={colors.successDark} />
                <Text style={styles.statutoryNoticeText}>
                  Verified under Rajasthan Cooperative Societies Act 2026. Trade credentials qualify worker for priority allocation.
                </Text>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                size="sm"
                onPress={() => setShowCertModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={certSubmitting ? 'Saving...' : 'Submit & Verify'}
                variant="primary"
                size="sm"
                onPress={handleSaveCert}
                disabled={certSubmitting}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (colors: Palette, typography: ReturnType<typeof makeTypography>, isDark: boolean) => StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
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
  idCard: {
    padding: spacing.md,
    backgroundColor: isDark ? '#142a20' : colors.primaryDark,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    borderRadius: 16,
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  idAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  idAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  idNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idName: {
    ...typography.fontHeadline,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '800',
  },
  idCode: {
    fontSize: 11,
    color: '#dcfce7',
    fontFamily: 'Courier',
    marginTop: 2,
    fontWeight: '600',
  },
  idCoop: {
    ...typography.fontCaption,
    color: '#bbf7d0',
    marginTop: 2,
  },
  badgeStrip: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  certBadgeText: {
    fontSize: 9,
    color: '#86efac',
    fontWeight: '700',
  },
  qrToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  qrToggleText: {
    flex: 1,
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    color: '#dcfce7',
    fontWeight: '600',
  },
  statVal: {
    ...typography.fontSubtitle,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '800',
  },
  statValSuccess: {
    ...typography.fontSubtitle,
    color: '#86efac',
    textTransform: 'capitalize',
    marginTop: 2,
    fontWeight: '800',
  },
  controlCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  controlTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dutyBtnGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dutyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dutyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dutyBtnTextActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  dutyBtnAvailable: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  dutyBtnOffline: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.textMuted,
  },
  dutyBtnDisabled: {
    opacity: 0.85,
  },
  activeJobBanner: {
    backgroundColor: isDark ? '#2e1c0c' : '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  activeEmergencyJobBanner: {
    backgroundColor: isDark ? '#2a0e0e' : '#fee2e2',
    borderColor: '#ef4444',
  },
  activeJobBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#fbbf24' : '#92400e',
  },
  activeJobBannerSub: {
    fontSize: 10,
    color: isDark ? '#fcd34d' : '#78350f',
    marginTop: 2,
    lineHeight: 14,
  },
  viewJobBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewJobBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  radiusWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  radiusTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  radiusValBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
  },
  radiusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  radiusChipTextActive: {
    color: '#ffffff',
  },
  earningsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  earnItem: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  earnIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  earnValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  earnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  earnSub: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  sectionTitle: {
    ...typography.fontSubtitle,
    marginBottom: spacing.sm,
    fontWeight: '800',
  },
  label: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statutoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successDark,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 3,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
  },
  skillsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addSkillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addSkillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  skillsTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  skillDeleteBtn: {
    padding: 2,
  },
  bioInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  certCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  certDesc: {
    ...typography.fontBodySm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  attachedDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  docTitle: {
    ...typography.fontSubtitle,
    fontSize: 13,
    fontWeight: '700',
  },
  docStatus: {
    ...typography.fontCaption,
    color: colors.success,
    marginTop: 2,
  },
  sosCard: {
    padding: 12,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderColor: colors.danger,
    borderWidth: 1,
  },
  sosHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.danger,
  },
  sosSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sosBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  settingsCard: {
    padding: 12,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  logoutCard: {
    padding: 6,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  qrModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qrModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  qrModalSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrFrame: {
    width: 200,
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: 14,
  },
  qrPattern: {
    width: '100%',
    height: '100%',
    borderWidth: 1.5,
    borderColor: '#0f172a',
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 36,
    height: 36,
    borderWidth: 4,
    borderColor: '#0f172a',
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 36,
    height: 36,
    borderWidth: 4,
    borderColor: '#0f172a',
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 36,
    height: 36,
    borderWidth: 4,
    borderColor: '#0f172a',
  },
  qrCenterBadge: {
    alignItems: 'center',
  },
  qrBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  qrInfoBox: {
    alignItems: 'center',
    marginBottom: 4,
  },
  qrWorkerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  qrCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  qrGovtText: {
    fontSize: 10,
    color: colors.successDark,
    fontWeight: '600',
    marginTop: 4,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
    marginTop: 6,
  },
  earnActionHint: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  actionSheetBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionSheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  actionSheetSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sosIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  workerDistressBanner: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fff1f2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecdd3',
    marginBottom: 14,
  },
  distressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distressTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    flex: 1,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  livePulseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#dc2626',
  },
  distressCoords: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
    fontFamily: 'Courier',
  },
  distressSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sosSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sosActionRowPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  actionIconPrimary: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitlePrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  actionSubPrimary: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  sosActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  beaconWrap: {
    marginTop: 6,
    marginBottom: 6,
  },
  beaconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#b91c1c',
    borderRadius: 10,
    paddingVertical: 12,
  },
  beaconBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  beaconActiveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#dcfce7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(22, 163, 74, 0.3)' : '#86efac',
  },
  beaconActiveTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  beaconActiveSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  certOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    marginBottom: 8,
  },
  certOptionRowActive: {
    borderColor: colors.primary,
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
  },
  certOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  certOptionTitleActive: {
    color: colors.primary,
  },
  certOptionSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sheetInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
  },
  statutoryNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0',
  },
  statutoryNoticeText: {
    fontSize: 10,
    color: colors.successDark,
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
  },
});

export default WorkerProfileScreen;