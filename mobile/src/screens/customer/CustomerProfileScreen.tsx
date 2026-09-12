// ==============================================================================
// CUSTOMER PROFILE SCREEN — CITIZEN MEMBER PASSBOOK & COOPERATIVE SETTINGS
// Displays citizen credentials, transparent zero-surge cooperative savings,
// saved delivery addresses, safety/emergency contacts, and multi-language controls.
// ==============================================================================

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  ActivityIndicator,
  Pressable,
  Linking
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  User,
  Shield,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  HeartHandshake,
  TrendingDown,
  Globe,
  Bell,
  ChevronRight,
  LogOut,
  LifeBuoy,
  Edit3,
  Save,
  X,
  Sparkles,
  PhoneCall,
  Scale
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { LanguageModal } from '../../components/common/LanguageModal';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { Card, Badge, Button } from '../../components/ui';
import { FadeInView, AnimatedNumber, ScalePressable } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { ApiClient } from '../../services/apiClient';
import { Profile, CustomerAddress, CustomerEmergencyContact } from '../../types';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';
import { AuthContext } from '../../navigation/RootNavigator';

export const CustomerProfileScreen: React.FC = () => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'Home', isHome: false });
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { logout } = useContext(AuthContext);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals & Sheets
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Edit Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Add Address Form State
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrPincode, setAddrPincode] = useState('302001');
  const [addrCity, setAddrCity] = useState('Jaipur');

  // Notification Preference
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getCustomerProfile();
      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setCity(data.city || '');
      setPincode(data.pincode || '');
    } catch (err) {
      console.warn('Customer profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert(t('customerProfile.save_profile'), t('customerProfile.full_name') + ' & ' + t('customerProfile.phone') + ' are required.');
      return;
    }
    try {
      setSaving(true);
      const updated = await ApiClient.updateCustomerProfile(profile?.id || 'p0000000-0000-0000-0000-000000000002', {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
      });
      setProfile(updated);
      setEditModalVisible(false);
      Alert.alert(t('customerProfile.profile_saved_title'), t('customerProfile.profile_saved_msg'));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!addrStreet.trim()) {
      Alert.alert(t('customerProfile.add_address'), t('customerProfile.address_text') + ' is required.');
      return;
    }
    try {
      const currentAddresses = profile?.saved_addresses || [];
      const newAddr: CustomerAddress = {
        id: `addr-${Date.now()}`,
        label: addrLabel.trim() || 'Other',
        address: addrStreet.trim(),
        city: addrCity.trim() || 'Jaipur',
        state: 'Rajasthan',
        pincode: addrPincode.trim() || '302001',
        is_default: currentAddresses.length === 0,
      };
      const updatedList = [...currentAddresses, newAddr];
      const updated = await ApiClient.updateCustomerProfile(profile?.id || 'p0000000-0000-0000-0000-000000000002', {
        saved_addresses: updatedList,
      });
      setProfile(updated);
      setAddrStreet('');
      setAddressModalVisible(false);
      Alert.alert(t('customerProfile.address_added_title'), t('customerProfile.address_added_msg'));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    const current = profile?.saved_addresses || [];
    const filtered = current.filter(a => a.id !== addrId);
    const updated = await ApiClient.updateCustomerProfile(profile?.id || 'p0000000-0000-0000-0000-000000000002', {
      saved_addresses: filtered,
    });
    setProfile(updated);
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    const current = profile?.saved_addresses || [];
    const updatedList = current.map(a => ({
      ...a,
      is_default: a.id === addrId,
    }));
    const updated = await ApiClient.updateCustomerProfile(profile?.id || 'p0000000-0000-0000-0000-000000000002', {
      saved_addresses: updatedList,
    });
    setProfile(updated);
  };

  const handleCallSOS = (contactPhone: string) => {
    Alert.alert(
      t('customerProfile.sos_dial_title'),
      t('customerProfile.sos_dial_msg', { phone: contactPhone }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            const clean = contactPhone.replace(/[^0-9+]/g, '');
            Linking.openURL(`tel:${clean}`).catch(err => {
              console.warn('Cannot open phone dialer:', err);
            });
          },
        },
      ]
    );
  };

  const handleCallHelpline = () => {
    Alert.alert(
      t('customerProfile.state_helpline'),
      'Connecting to Rajasthan Cooperative Shramik Helpline (1800-SAHAKAR / 1800-724-2527). Available 24 hours a day with bilingual grievance officers.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Call 1800-724-2527',
          onPress: () => {
            Linking.openURL('tel:18007242527').catch(err => {
              console.warn('Cannot open helpline dialer:', err);
            });
          },
        },
      ]
    );
  };

  const handleOmbudsmanConnect = () => {
    Alert.alert(
      t('customerProfile.ombudsman_btn'),
      'Rajasthan Cooperative Ombudsman Portal (Reg. Act 2026). Your ticket #GRV-2026-9912 is queued for immediate resolution.',
      [{ text: 'Acknowledged' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading', 'Loading profile...')}</Text>
      </View>
    );
  }

  const initials = (profile?.full_name || 'Priya Singh')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.screenWrapper}>
      <Header
        title={t('customerProfile.title')}
        subtitle={t('customerProfile.subtitle')}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Member Identity Hero Card */}
        <FadeInView delay={0} distance={10} duration={320}>
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.heroName}>{profile?.full_name || 'Priya Singh'}</Text>
                  <TouchableOpacity
                    style={styles.editPill}
                    onPress={() => setEditModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Edit3 size={12} color="#ffffff" />
                    <Text style={styles.editPillText}>{t('customerProfile.edit_profile')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.badgeRow}>
                  <Badge label={t('customerProfile.coop_citizen')} variant="success" size="sm" />
                  <Text style={styles.memberId}>
                    {profile?.membership_id || 'COP-CUS-2026-8842'}
                  </Text>
                </View>
                <View style={styles.contactDetails}>
                  <View style={styles.contactRow}>
                    <Phone size={11} color="#bbf7d0" />
                    <Text style={styles.contactText}>{profile?.phone || '+91 98711 54321'}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Mail size={11} color="#bbf7d0" />
                    <Text style={styles.contactText}>{profile?.email || 'priya.singh@customer.in'}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <MapPin size={11} color="#bbf7d0" />
                    <Text style={styles.contactText}>
                      {profile?.address ? `${profile.address}, ${profile.city || 'Jaipur'}` : 'Flat 402, C-Scheme, Jaipur (302001)'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* Cooperative Patronage & Savings Ticker */}
        <FadeInView delay={80} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.sectionHeading}>{t('customerProfile.coop_metrics_title')}</Text>
          </View>
          <Text style={styles.sectionSub}>{t('customerProfile.coop_metrics_sub')}</Text>

          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { borderLeftColor: colors.success }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.successLight }]}>
                <TrendingDown size={15} color={colors.successDark} />
              </View>
              <AnimatedNumber
                value={profile?.coop_savings || 1450}
                prefix="₹"
                format={n => n.toLocaleString('en-IN')}
                style={[styles.kpiValue, { color: colors.successDark }]}
              />
              <Text style={styles.kpiLabel}>{t('customerProfile.savings_vs_platforms')}</Text>
              <Text style={styles.kpiHint}>{t('customerProfile.zero_surge_guarantee')}</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: colors.primary }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.primaryLight }]}>
                <HeartHandshake size={15} color={colors.primary} />
              </View>
              <AnimatedNumber
                value={profile?.total_spent || 4890}
                prefix="₹"
                format={n => n.toLocaleString('en-IN')}
                style={styles.kpiValue}
              />
              <Text style={styles.kpiLabel}>{t('customerProfile.direct_spent')}</Text>
              <Text style={styles.kpiHint}>{t('customerProfile.direct_spent_sub')}</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: colors.secondary }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.secondaryLight }]}>
                <Shield size={15} color={colors.secondaryDark} />
              </View>
              <AnimatedNumber
                value={profile?.welfare_contribution || 146}
                prefix="₹"
                format={n => n.toLocaleString('en-IN')}
                style={[styles.kpiValue, { color: colors.secondaryDark }]}
              />
              <Text style={styles.kpiLabel}>{t('customerProfile.welfare_contribution')}</Text>
              <Text style={styles.kpiHint}>{t('customerProfile.welfare_contribution_sub')}</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: colors.violet }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.violetLight }]}>
                <CheckCircle2 size={15} color={colors.violetDark} />
              </View>
              <AnimatedNumber
                value={7}
                suffix=" Bookings"
                style={[styles.kpiValue, { color: colors.violetDark }]}
              />
              <Text style={styles.kpiLabel}>{t('customerProfile.services_completed')}</Text>
              <Text style={styles.kpiHint}>100% On-time Verified Dispatch</Text>
            </View>
          </View>
        </FadeInView>

        {/* Saved Addresses Section */}
        <FadeInView delay={160} distance={10} duration={320}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.sectionHeading}>{t('customerProfile.saved_addresses_title')}</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtnSmall}
              onPress={() => setAddressModalVisible(true)}
              activeOpacity={0.7}
            >
              <Plus size={12} color={colors.primary} />
              <Text style={styles.addBtnText}>{t('customerProfile.add_address')}</Text>
            </TouchableOpacity>
          </View>

          {(profile?.saved_addresses || []).map((addr) => (
            <Card key={addr.id} style={styles.addressCard}>
              <View style={styles.addrHeaderRow}>
                <View style={styles.addrLabelBadge}>
                  <Text style={styles.addrLabelText}>{addr.label}</Text>
                </View>
                {addr.is_default && (
                  <Badge label={t('customerProfile.default_badge')} variant="info" size="sm" />
                )}
              </View>
              <Text style={styles.addrStreet}>{addr.address}</Text>
              <Text style={styles.addrCity}>
                {addr.city}, {addr.state} - {addr.pincode}
              </Text>
              <View style={styles.addrActionsRow}>
                {!addr.is_default && (
                  <TouchableOpacity
                    style={styles.setDefaultBtn}
                    onPress={() => handleSetDefaultAddress(addr.id)}
                  >
                    <Text style={styles.setDefaultText}>{t('customerProfile.set_as_default')}</Text>
                  </TouchableOpacity>
                )}
                {(profile?.saved_addresses || []).length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteAddrBtn}
                    onPress={() => handleDeleteAddress(addr.id)}
                  >
                    <Trash2 size={13} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </FadeInView>

        {/* Safety & Emergency SOS Section */}
        <FadeInView delay={240} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <LifeBuoy size={16} color={colors.danger} />
            <Text style={styles.sectionHeading}>{t('customerProfile.safety_title')}</Text>
          </View>
          <Text style={styles.sectionSub}>{t('customerProfile.safety_sub')}</Text>

          <Card style={styles.sosCard}>
            <View style={styles.sosHeaderRow}>
              <View>
                <Text style={styles.sosTitle}>{t('customerProfile.emergency_contact')}</Text>
                <Text style={styles.sosContactName}>
                  {profile?.emergency_contacts?.[0]?.name || 'Dr. Alok Singh (Father)'}
                </Text>
                <Text style={styles.sosContactPhone}>
                  {profile?.emergency_contacts?.[0]?.phone || '+91 98290 11223'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sosCallBtn}
                onPress={() => handleCallSOS(profile?.emergency_contacts?.[0]?.phone || '+91 98290 11223')}
                activeOpacity={0.8}
              >
                <PhoneCall size={14} color="#ffffff" />
                <Text style={styles.sosCallText}>{t('customerProfile.call_sos')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.helplineBanner} onPress={handleCallHelpline} activeOpacity={0.8}>
              <View style={styles.helplineIcon}>
                <Shield size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.helplineTitle}>{t('customerProfile.state_helpline')}</Text>
                <Text style={styles.helplinePhone}>1800-SAHAKAR (1800-724-2527)</Text>
                <Text style={styles.helplineDesc}>{t('customerProfile.state_helpline_sub')}</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.ombudsmanRow} onPress={handleOmbudsmanConnect} activeOpacity={0.8}>
              <Scale size={15} color={colors.secondaryDark} />
              <Text style={styles.ombudsmanText}>{t('customerProfile.ombudsman_btn')}</Text>
              <ChevronRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        </FadeInView>

        {/* App Preferences & Settings */}
        <FadeInView delay={320} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <Globe size={16} color={colors.primary} />
            <Text style={styles.sectionHeading}>{t('customerProfile.app_preferences')}</Text>
          </View>

          <Card style={styles.settingsCard}>
            {/* Language Selector */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setLangModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLabelRow}>
                <Globe size={16} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>{t('customerProfile.language_label')}</Text>
                  <Text style={styles.settingSub}>
                    {t(`lang.${i18n.language || 'en'}`)} (Active)
                  </Text>
                </View>
              </View>
              <View style={styles.langPill}>
                <Text style={styles.langPillText}>{(i18n.language || 'en').toUpperCase()}</Text>
                <ChevronRight size={13} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Theme Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <View style={styles.themeIconWrap}>
                  <Text style={{ fontSize: 14 }}>{isDark ? '🌙' : '☀️'}</Text>
                </View>
                <View>
                  <Text style={styles.settingTitle}>{t('customerProfile.theme_label')}</Text>
                  <Text style={styles.settingSub}>
                    {isDark ? 'Dark Theme (Night Mode)' : 'Light Theme (Day Mode)'}
                  </Text>
                </View>
              </View>
              <ThemeToggle />
            </View>

            <View style={styles.divider} />

            {/* Notifications Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Bell size={16} color={colors.violet} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.settingTitle}>{t('customerProfile.notifications_label')}</Text>
                  <Text style={styles.settingSub}>{t('customerProfile.notifications_sub')}</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </Card>
        </FadeInView>

        {/* Account Actions */}
        <FadeInView delay={400} distance={10} duration={320}>
          <Card style={styles.accountCard}>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.75}>
              <LogOut size={16} color={colors.danger} />
              <Text style={styles.logoutText}>{t('customerProfile.switch_role')}</Text>
            </TouchableOpacity>
          </Card>
        </FadeInView>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('customerProfile.edit_profile')}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>{t('customerProfile.full_name')}</Text>
              <TextInput
                style={styles.modalInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('customerProfile.phone')}</Text>
              <TextInput
                style={styles.modalInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('customerProfile.email')}</Text>
              <TextInput
                style={styles.modalInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('customerProfile.city')}</Text>
              <TextInput
                style={styles.modalInput}
                value={city}
                onChangeText={setCity}
                placeholder="Jaipur"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('customerProfile.pincode')}</Text>
              <TextInput
                style={styles.modalInput}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                placeholder="302001"
                placeholderTextColor={colors.textMuted}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Button
                title={t('customerProfile.cancel')}
                variant="outline"
                size="sm"
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('customerProfile.save_profile')}
                variant="primary"
                size="sm"
                loading={saving}
                onPress={handleSaveProfile}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Address Modal */}
      <Modal visible={addressModalVisible} transparent animationType="fade" onRequestClose={() => setAddressModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddressModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('customerProfile.add_address')}</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('customerProfile.address_label')}</Text>
            <View style={styles.labelPickerRow}>
              {['Home', 'Office', 'Other'].map(lbl => (
                <TouchableOpacity
                  key={lbl}
                  style={[styles.labelChip, addrLabel === lbl && styles.labelChipActive]}
                  onPress={() => setAddrLabel(lbl)}
                >
                  <Text style={[styles.labelChipText, addrLabel === lbl && styles.labelChipTextActive]}>
                    {lbl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>{t('customerProfile.address_text')}</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60 }]}
              value={addrStreet}
              onChangeText={setAddrStreet}
              multiline
              placeholder="e.g. Flat 301, Sunshine Heights, C-Scheme"
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('customerProfile.city')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrCity}
                  onChangeText={setAddrCity}
                  placeholder="Jaipur"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('customerProfile.pincode')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrPincode}
                  onChangeText={setAddrPincode}
                  keyboardType="numeric"
                  placeholder="302001"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                title={t('customerProfile.cancel')}
                variant="outline"
                size="sm"
                onPress={() => setAddressModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('customerProfile.add_address')}
                variant="primary"
                size="sm"
                onPress={handleAddAddress}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reusable Language Modal */}
      <LanguageModal visible={langModalVisible} onClose={() => setLangModalVisible(false)} />
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  heroCard: {
    padding: 16,
    backgroundColor: isDark ? '#142a20' : colors.primaryDark,
    borderColor: colors.primary,
    borderWidth: 1.2,
    marginBottom: 16,
    borderRadius: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  editPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  memberId: {
    fontSize: 10,
    color: '#bbf7d0',
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  contactDetails: {
    gap: 3,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
    marginLeft: 22,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  kpiHint: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  addressCard: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  addrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addrLabelBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addrLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addrStreet: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  addrCity: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  addrActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  setDefaultBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.surfaceSubtle,
  },
  setDefaultText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
  deleteAddrBtn: {
    padding: 4,
  },
  sosCard: {
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  sosHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
  },
  sosContactName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sosContactPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sosCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sosCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  helplineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 8,
  },
  helplineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helplineTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  helplinePhone: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  helplineDesc: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  ombudsmanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 4,
  },
  ombudsmanText: {
    flex: 1,
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  settingsCard: {
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    marginTop: 1,
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
  themeIconWrap: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCard: {
    padding: 6,
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  labelPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  labelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  labelChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  labelChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelChipTextActive: {
    color: colors.primary,
  },
});

export default CustomerProfileScreen;
