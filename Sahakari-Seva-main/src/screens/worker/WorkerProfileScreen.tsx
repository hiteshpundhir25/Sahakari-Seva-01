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
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
  DollarSign
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

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [addSkillModal, setAddSkillModal] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');
  const [langModalVisible, setLangModalVisible] = useState(false);

  useEffect(() => {
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
          setAvailability(w.availability_status || 'available');
          setRadiusKm(w.service_radius_km || 15);
        }
      } catch {
        // Handled in ApiClient fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdateAvailability = async (newStatus: AvailabilityStatus) => {
    setAvailability(newStatus);
    try {
      await ApiClient.updateWorkerAvailability('w0000000-0000-0000-0000-000000000001', newStatus);
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
    Alert.alert(
      t('workerProfile.doc_upload_title'),
      t('workerProfile.doc_upload_msg'),
      [
        {
          text: t('workerProfile.doc_ntc'),
          onPress: () => {
            setCertName('National Trade Certificate (NTC) — Verified');
            Alert.alert(t('workerProfile.uploaded_title'), t('workerProfile.doc_ntc'));
          },
        },
        {
          text: 'Polytechnic Electrical Diploma',
          onPress: () => {
            setCertName('Polytechnic Electrical Diploma — Verified');
            Alert.alert(t('workerProfile.uploaded_title'), 'Polytechnic Electrical Diploma');
          },
        },
        {
          text: 'Central Electricity Authority Safety Pass',
          onPress: () => {
            setCertName('Central Electricity Authority Safety Pass');
            Alert.alert(t('workerProfile.uploaded_title'), 'CEA Safety Pass Verified');
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
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
    Alert.alert(
      t('workerProfile.emergency_sos'),
      t('workerProfile.sos_alert_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: 'Confirm SOS Dispatch', style: 'destructive', onPress: () => {
          Alert.alert('SOS Dispatched', 'Jaipur Cooperative Control Room #8842 alerted. Emergency patrol unit deployed.');
        }}
      ]
    );
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
                <Text style={[styles.statValSuccess, availability === 'offline' && { color: '#fca5a5' }]}>
                  {availability}
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

            <View style={styles.dutyBtnGroup}>
              <TouchableOpacity
                style={[
                  styles.dutyBtn,
                  availability === 'available' && styles.dutyBtnAvailable,
                ]}
                onPress={() => handleUpdateAvailability('available')}
                activeOpacity={0.7}
              >
                <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                <Text
                  style={[
                    styles.dutyBtnText,
                    availability === 'available' && styles.dutyBtnTextActive,
                  ]}
                >
                  {t('workerProfile.status_available')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dutyBtn,
                  availability === 'busy' && styles.dutyBtnBusy,
                ]}
                onPress={() => handleUpdateAvailability('busy')}
                activeOpacity={0.7}
              >
                <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
                <Text
                  style={[
                    styles.dutyBtnText,
                    availability === 'busy' && styles.dutyBtnTextActive,
                  ]}
                >
                  {t('workerProfile.status_busy')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dutyBtn,
                  availability === 'offline' && styles.dutyBtnOffline,
                ]}
                onPress={() => handleUpdateAvailability('offline')}
                activeOpacity={0.7}
              >
                <View style={[styles.statusDot, { backgroundColor: '#94a3b8' }]} />
                <Text
                  style={[
                    styles.dutyBtnText,
                    availability === 'offline' && styles.dutyBtnTextActive,
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
              <View style={styles.earnItem}>
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
              </View>

              <View style={styles.earnItem}>
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
              </View>
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
  dutyBtnBusy: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  dutyBtnOffline: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.textMuted,
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
});

export default WorkerProfileScreen;