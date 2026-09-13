// ==============================================================================
// CUSTOMER PROFILE SCREEN — CITIZEN MEMBER PASSBOOK & COOPERATIVE SETTINGS
// Fully interactive UX: Emergency SOS Sheet, 24x7 Citizen Helpline Center,
// Statutory Cooperative Ombudsman Portal, Patronage Audit Passbook,
// Address Editor, and regional accessibility settings.
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
  Linking,
  Platform,
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
  Scale,
  MessageSquare,
  Clock,
  AlertTriangle,
  FileCheck,
  Share2,
  Send,
  ExternalLink,
  Check,
  Download,
  AlertCircle,
  Building2,
  CheckCircle
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
import { AuthContext, rootNavigationRef } from '../../navigation/RootNavigator';

// Robust communication helpers for mobile and web
const openDialer = (phoneNumber: string) => {
  const clean = phoneNumber.replace(/[^0-9+]/g, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = `tel:${clean}`;
  } else {
    Linking.openURL(`tel:${clean}`).catch(err => {
      console.warn('Dialer error:', err);
    });
  }
};

const openSms = (phoneNumber: string, body: string) => {
  const clean = phoneNumber.replace(/[^0-9+]/g, '');
  const url = `sms:${clean}?body=${encodeURIComponent(body)}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = url;
  } else {
    Linking.openURL(url).catch(err => {
      console.warn('SMS error:', err);
    });
  }
};

const openWhatsApp = (phoneNumber: string, text: string) => {
  const clean = phoneNumber.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url).catch(err => {
      console.warn('WhatsApp error:', err);
    });
  }
};

interface GrievanceTicket {
  id: string;
  category: string;
  bookingId: string;
  date: string;
  status: 'Resolved' | 'Under Investigation' | 'Hearing Scheduled';
  statusVariant: 'success' | 'warning' | 'info';
  resolution: string;
  arbitrator: string;
}

export const CustomerProfileScreen: React.FC = () => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'Home', isHome: false });
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { logout } = useContext(AuthContext);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core Modals & Interactive Sheets
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editAddressModalVisible, setEditAddressModalVisible] = useState(false);
  const [editingAddr, setEditingAddr] = useState<CustomerAddress | null>(null);
  const [langModalVisible, setLangModalVisible] = useState(false);

  // New Interactive Feature Sheets
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [helplineModalVisible, setHelplineModalVisible] = useState(false);
  const [ombudsmanModalVisible, setOmbudsmanModalVisible] = useState(false);
  const [patronageModalVisible, setPatronageModalVisible] = useState(false);

  // Edit Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Add & Edit Address Form State
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrPincode, setAddrPincode] = useState('302001');
  const [addrCity, setAddrCity] = useState('Jaipur');

  // Emergency SOS Contact Management
  const [contactName, setContactName] = useState('Dr. Alok Singh');
  const [contactRelation, setContactRelation] = useState('Father / Guardian');
  const [contactPhone, setContactPhone] = useState('+91 98290 11223');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // Ombudsman State
  const [ombudsmanTab, setOmbudsmanTab] = useState<'file' | 'tickets'>('file');
  const [grievanceCategory, setGrievanceCategory] = useState('Billing & Overcharging Dispute');
  const [grievanceBookingId, setGrievanceBookingId] = useState('BK-1002');
  const [grievanceDesc, setGrievanceDesc] = useState('');
  const [grievanceUrgency, setGrievanceUrgency] = useState<'Normal (12h SLA)' | 'Urgent (1h SLA)'>('Normal (12h SLA)');
  const [submittingGrievance, setSubmittingGrievance] = useState(false);
  const [grievanceSuccessMsg, setGrievanceSuccessMsg] = useState('');
  const [tickets, setTickets] = useState<GrievanceTicket[]>([
    {
      id: 'OMB-RAJ-2026-9912',
      category: 'Billing & Overcharging Dispute',
      bookingId: 'BK-0988',
      date: '2026-09-08',
      status: 'Resolved',
      statusVariant: 'success',
      resolution: 'Worker billed ₹150 over statutory rate for cabling. Difference of ₹150 refunded directly to citizen passbook under Section 42 of Cooperative Byelaws.',
      arbitrator: 'Registrar of Cooperatives, Jaipur Division',
    },
    {
      id: 'OMB-RAJ-2026-8431',
      category: 'Service Quality & Incomplete Work',
      bookingId: 'BK-0842',
      date: '2026-08-19',
      status: 'Resolved',
      statusVariant: 'success',
      resolution: 'Substituted artisan dispatched free of charge within 24 hours. Primary artisan issued advisory note.',
      arbitrator: 'Grievance Redressal Committee, Division 1',
    }
  ]);

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

      if (data.emergency_contacts && data.emergency_contacts.length > 0) {
        setContactName(data.emergency_contacts[0].name || 'Dr. Alok Singh');
        setContactPhone(data.emergency_contacts[0].phone || '+91 98290 11223');
        setContactRelation(data.emergency_contacts[0].relation || 'Father / Guardian');
      }
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

  const handleStartEditAddress = (addr: CustomerAddress) => {
    setEditingAddr(addr);
    setAddrLabel(addr.label);
    setAddrStreet(addr.address);
    setAddrCity(addr.city);
    setAddrPincode(addr.pincode);
    setEditAddressModalVisible(true);
  };

  const handleSaveEditedAddress = async () => {
    if (!editingAddr || !addrStreet.trim()) return;
    const current = profile?.saved_addresses || [];
    const updatedList = current.map(a =>
      a.id === editingAddr.id
        ? { ...a, label: addrLabel, address: addrStreet.trim(), city: addrCity.trim(), pincode: addrPincode.trim() }
        : a
    );
    try {
      const updated = await ApiClient.updateCustomerProfile(profile?.id || 'p0000000-0000-0000-0000-000000000002', {
        saved_addresses: updatedList,
      });
      setProfile(updated);
      setEditAddressModalVisible(false);
      setEditingAddr(null);
      setAddrStreet('');
      Alert.alert('Address Updated', 'Your address changes have been saved.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update address');
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

  const handleSaveEmergencyContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Required', 'Please enter a valid name and phone number.');
      return;
    }
    setSavingContact(true);
    try {
      const updated = await ApiClient.updateCustomerProfile(profile?.id || 'p0000000-0000-0000-0000-000000000002', {
        emergency_contacts: [
          {
            id: profile?.emergency_contacts?.[0]?.id || 'emg-1',
            name: contactName.trim(),
            phone: contactPhone.trim(),
            relation: contactRelation.trim() || 'Guardian',
          },
        ],
      });
      setProfile(updated);
      setIsEditingContact(false);
      Alert.alert('Contact Saved', 'Your verified emergency contact has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save contact');
    } finally {
      setSavingContact(false);
    }
  };

  const handleSubmitGrievance = () => {
    if (!grievanceDesc.trim()) {
      Alert.alert('Description Required', 'Please provide specific details regarding your dispute or grievance.');
      return;
    }
    setSubmittingGrievance(true);
    setTimeout(() => {
      const newId = `OMB-RAJ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket: GrievanceTicket = {
        id: newId,
        category: grievanceCategory,
        bookingId: grievanceBookingId.trim() || 'BK-1002',
        date: 'Today (Active)',
        status: 'Under Investigation',
        statusVariant: 'warning',
        resolution: `Official grievance lodged under Section 19 of Rajasthan Cooperative Societies Act. Arbitrator assigned: Registrar Grievance Cell. Mandatory resolution SLA: < 12 hours.`,
        arbitrator: 'Duty Registrar of Cooperatives, Jaipur Division',
      };
      setTickets([newTicket, ...tickets]);
      setSubmittingGrievance(false);
      setGrievanceDesc('');
      setGrievanceSuccessMsg(`Statutory Ticket ${newId} registered! Binding resolution guaranteed in < 12 hours.`);
      setOmbudsmanTab('tickets');
    }, 400);
  };

  const handleDownloadPassbook = () => {
    const statement = {
      member_id: profile?.membership_id || 'COP-CUS-2026-8842',
      citizen_name: profile?.full_name || 'Priya Singh',
      cooperative_body: 'Jaipur Shramik Sahakari Sangh (Reg. #8842)',
      generated_at: new Date().toISOString(),
      financial_passbook: {
        total_spent_inr: profile?.total_spent || 4890,
        direct_artisan_payout_inr: 4744,
        platform_commission_deducted: 0,
        solidarity_welfare_contribution_3_pct: profile?.welfare_contribution || 146,
        citizen_coop_savings_vs_corporate_surge: profile?.coop_savings || 1450,
        completed_certified_services: 7,
      },
      statutory_compliance: 'Audited and verified compliant with Section 12 of the Rajasthan Cooperative Societies Act 2026. Zero platform extraction verified.'
    };
    const jsonStr = JSON.stringify(statement, null, 2);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.document) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sahakari_Member_Passbook_${statement.member_id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Alert.alert('Passbook Statement Exported', 'Certified passbook statement downloaded to your device.');
    } else {
      Alert.alert('Passbook Statement Exported', `Certified Statement for ${statement.member_id} generated.`);
    }
  };

  const handleNavigateToBookings = () => {
    setPatronageModalVisible(false);
    if (rootNavigationRef.isReady()) {
      rootNavigationRef.navigate('CustomerTabs', { screen: 'Bookings' });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading', 'Loading citizen profile...')}</Text>
      </View>
    );
  }

  const currentContactPhone = profile?.emergency_contacts?.[0]?.phone || contactPhone;
  const currentContactName = profile?.emergency_contacts?.[0]?.name || contactName;

  const initials = (profile?.full_name || 'Priya Singh')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.screenWrapper}>
      <Header
        title={t('customerProfile.title', 'Citizen Profile')}
        subtitle={t('customerProfile.subtitle', 'Cooperative Member Passbook & Settings')}
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
                    <Text style={styles.editPillText}>{t('customerProfile.edit_profile', 'Edit Profile')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.badgeRow}>
                  <Badge label={t('customerProfile.coop_citizen', 'Co-op Citizen')} variant="success" size="sm" />
                  <Text style={styles.memberId}>
                    {profile?.membership_id || 'COP-CUS-2026-8842'}
                  </Text>
                </View>
                <View style={styles.contactDetails}>
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => openDialer(profile?.phone || '+91 98711 54321')}
                    activeOpacity={0.7}
                  >
                    <Phone size={12} color="#86efac" />
                    <Text style={styles.contactText}>{profile?.phone || '+91 98711 54321'}</Text>
                    <Text style={styles.contactActionHint}>· Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => Linking.openURL('mailto:' + (profile?.email || 'priya.singh@customer.in'))}
                    activeOpacity={0.7}
                  >
                    <Mail size={12} color="#86efac" />
                    <Text style={styles.contactText}>{profile?.email || 'priya.singh@customer.in'}</Text>
                    <Text style={styles.contactActionHint}>· Email</Text>
                  </TouchableOpacity>
                  <View style={styles.contactRow}>
                    <MapPin size={12} color="#86efac" />
                    <Text style={styles.contactText}>
                      {profile?.address ? `${profile.address}, ${profile.city || 'Jaipur'}` : 'Flat 402, C-Scheme, Jaipur (302001)'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* Cooperative Patronage & Savings Ticker (Interactive) */}
        <FadeInView delay={80} distance={10} duration={320}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={styles.sectionHeading}>{t('customerProfile.coop_metrics_title', 'Cooperative Patronage Passbook')}</Text>
            </View>
            <TouchableOpacity
              style={styles.auditLinkPill}
              onPress={() => setPatronageModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.auditLinkText}>Audit Passbook →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSub}>{t('customerProfile.coop_metrics_sub', 'Transparent 0% platform commission ledger & living wage passbook')}</Text>

          <View style={styles.kpiGrid}>
            <TouchableOpacity
              style={[styles.kpiCard, { borderLeftColor: colors.success }]}
              onPress={() => setPatronageModalVisible(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.successLight }]}>
                <TrendingDown size={15} color={colors.successDark} />
              </View>
              <AnimatedNumber
                value={profile?.coop_savings || 1450}
                prefix="₹"
                format={n => n.toLocaleString('en-IN')}
                style={[styles.kpiValue, { color: colors.successDark }]}
              />
              <Text style={styles.kpiLabel}>{t('customerProfile.savings_vs_platforms', 'Savings vs Surge')}</Text>
              <Text style={styles.kpiHint}>Tap to view audit ledger →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { borderLeftColor: colors.primary }]}
              onPress={() => setPatronageModalVisible(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.primaryLight }]}>
                <HeartHandshake size={15} color={colors.primary} />
              </View>
              <AnimatedNumber
                value={profile?.total_spent || 4890}
                prefix="₹"
                format={n => n.toLocaleString('en-IN')}
                style={styles.kpiValue}
              />
              <Text style={styles.kpiLabel}>{t('customerProfile.direct_spent', 'Direct Artisan Payout')}</Text>
              <Text style={styles.kpiHint}>100% take-home to worker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { borderLeftColor: colors.secondary }]}
              onPress={() => setPatronageModalVisible(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.secondaryLight }]}>
                <Shield size={15} color={colors.secondaryDark} />
              </View>
              <AnimatedNumber
                value={profile?.welfare_contribution || 146}
                prefix="₹"
                format={n => n.toLocaleString('en-IN')}
                style={[styles.kpiValue, { color: colors.secondaryDark }]}
              />
              <Text style={styles.kpiLabel}>{t('customerProfile.welfare_contribution', 'Solidarity Welfare (3%)')}</Text>
              <Text style={styles.kpiHint}>Worker accident & medical fund</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { borderLeftColor: colors.violet }]}
              onPress={handleNavigateToBookings}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.violetLight }]}>
                <CheckCircle2 size={15} color={colors.violetDark} />
              </View>
              <AnimatedNumber
                value={7}
                suffix=" Bookings"
                style={[styles.kpiValue, { color: colors.violetDark }]}
              />
              <Text style={styles.kpiLabel}>{t('customerProfile.services_completed', 'Services Completed')}</Text>
              <Text style={styles.kpiHint}>Tap to view booking history →</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Saved Delivery Addresses Section */}
        <FadeInView delay={160} distance={10} duration={320}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.sectionHeading}>{t('customerProfile.saved_addresses_title', 'Saved Delivery Addresses')}</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtnSmall}
              onPress={() => {
                setAddrLabel('Home');
                setAddrStreet('');
                setAddressModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Plus size={12} color={colors.primary} />
              <Text style={styles.addBtnText}>{t('customerProfile.add_address', 'Add Address')}</Text>
            </TouchableOpacity>
          </View>

          {(profile?.saved_addresses || []).map((addr) => (
            <Card key={addr.id} style={styles.addressCard}>
              <View style={styles.addrHeaderRow}>
                <View style={styles.addrLabelBadge}>
                  <Text style={styles.addrLabelText}>{addr.label}</Text>
                </View>
                {addr.is_default && (
                  <Badge label={t('customerProfile.default_badge', 'Default')} variant="info" size="sm" />
                )}
              </View>
              <Text style={styles.addrStreet}>{addr.address}</Text>
              <Text style={styles.addrCity}>
                {addr.city}, {addr.state} - {addr.pincode}
              </Text>
              <View style={styles.addrActionsRow}>
                <TouchableOpacity
                  style={styles.editAddrBtn}
                  onPress={() => handleStartEditAddress(addr)}
                  activeOpacity={0.7}
                >
                  <Edit3 size={12} color={colors.primary} />
                  <Text style={styles.editAddrText}>Edit</Text>
                </TouchableOpacity>

                {!addr.is_default && (
                  <TouchableOpacity
                    style={styles.setDefaultBtn}
                    onPress={() => handleSetDefaultAddress(addr.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.setDefaultText}>{t('customerProfile.set_as_default', 'Set Default')}</Text>
                  </TouchableOpacity>
                )}

                {(profile?.saved_addresses || []).length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteAddrBtn}
                    onPress={() => handleDeleteAddress(addr.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={13} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </FadeInView>

        {/* Safety, Emergency SOS & Ombudsman Section */}
        <FadeInView delay={240} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <LifeBuoy size={16} color={colors.danger} />
            <Text style={styles.sectionHeading}>{t('customerProfile.safety_title', 'Safety & Emergency SOS')}</Text>
          </View>
          <Text style={styles.sectionSub}>{t('customerProfile.safety_sub', 'Priority distress response & statutory dispute assistance')}</Text>

          <Card style={styles.sosCard}>
            {/* Emergency Contact Row */}
            <View style={styles.sosHeaderRow}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setSosModalVisible(true)}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sosTitle}>{t('customerProfile.emergency_contact', 'EMERGENCY FAMILY CONTACT')}</Text>
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedPillText}>Verified</Text>
                  </View>
                </View>
                <Text style={styles.sosContactName}>
                  {currentContactName} ({contactRelation})
                </Text>
                <Text style={styles.sosContactPhone}>
                  {currentContactPhone}
                </Text>
                <Text style={styles.tapToManageText}>Tap to call, WhatsApp or edit details →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sosCallBtn}
                onPress={() => setSosModalVisible(true)}
                activeOpacity={0.8}
              >
                <PhoneCall size={14} color="#ffffff" />
                <Text style={styles.sosCallText}>{t('customerProfile.call_sos', 'Call SOS Contact')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* 24x7 Cooperative Citizen Helpline Card Row */}
            <TouchableOpacity
              style={styles.helplineBanner}
              onPress={() => setHelplineModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.helplineIcon}>
                <Shield size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.helplineTitle}>{t('customerProfile.state_helpline', '24x7 Cooperative Citizen Helpline')}</Text>
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Live 24x7</Text>
                  </View>
                </View>
                <Text style={styles.helplinePhone}>1800-SAHAKAR (1800-724-2527)</Text>
                <Text style={styles.helplineDesc}>Tap to view toll-free, control room & WhatsApp options →</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Connect with Cooperative Ombudsman Card Row */}
            <TouchableOpacity
              style={styles.ombudsmanRow}
              onPress={() => setOmbudsmanModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.ombudsmanIconWrap}>
                <Scale size={16} color={colors.secondaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ombudsmanText}>{t('customerProfile.ombudsman_btn', 'Connect with Cooperative Ombudsman')}</Text>
                <Text style={styles.ombudsmanSubText}>Statutory 12-hour binding dispute resolution & complaints portal</Text>
              </View>
              <View style={styles.activeTicketsPill}>
                <Text style={styles.activeTicketsPillText}>{tickets.length} Registered</Text>
              </View>
              <ChevronRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        </FadeInView>

        {/* App Preferences & Settings */}
        <FadeInView delay={320} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <Globe size={16} color={colors.primary} />
            <Text style={styles.sectionHeading}>{t('customerProfile.app_preferences', 'App Experience & Settings')}</Text>
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
                  <Text style={styles.settingTitle}>{t('customerProfile.language_label', 'App Display Language')}</Text>
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
                  <Text style={styles.settingTitle}>{t('customerProfile.theme_label', 'Appearance Mode')}</Text>
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
                  <Text style={styles.settingTitle}>{t('customerProfile.notifications_label', 'Real-time Dispatch Alerts')}</Text>
                  <Text style={styles.settingSub}>{t('customerProfile.notifications_sub', 'Live worker arrival, updates & supplemental bills')}</Text>
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
              <Text style={styles.logoutText}>{t('customerProfile.switch_role', 'Switch Role / Account')}</Text>
            </TouchableOpacity>
          </Card>
        </FadeInView>
      </ScrollView>

      {/* =========================================================================
          1. EMERGENCY SOS ACTION SHEET MODAL
      ========================================================================= */}
      <Modal visible={sosModalVisible} transparent animationType="fade" onRequestClose={() => setSosModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSosModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.sheetIconCircle, { backgroundColor: '#fee2e2' }]}>
                  <PhoneCall size={18} color="#dc2626" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Priority SOS Dispatch</Text>
                  <Text style={styles.modalSubHead}>Immediate emergency contact options</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSosModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {!isEditingContact ? (
              <>
                <View style={styles.emergencyTargetCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.targetLabel}>Primary Emergency Contact</Text>
                    <Text style={styles.targetName}>{currentContactName}</Text>
                    <Text style={styles.targetMeta}>{contactRelation} · {currentContactPhone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editContactIconBtn}
                    onPress={() => setIsEditingContact(true)}
                  >
                    <Edit3 size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Instant Action 1: Direct Phone Call */}
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => openDialer(currentContactPhone)}
                  activeOpacity={0.8}
                >
                  <PhoneCall size={18} color="#ffffff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.primaryActionBtnText}>Call {currentContactName} Now</Text>
                    <Text style={styles.primaryActionBtnSub}>Direct phone dialer ({currentContactPhone})</Text>
                  </View>
                  <ChevronRight size={16} color="#ffffff" />
                </TouchableOpacity>

                {/* Instant Action 2: WhatsApp Emergency Alert */}
                <TouchableOpacity
                  style={styles.whatsAppActionBtn}
                  onPress={() =>
                    openWhatsApp(
                      currentContactPhone,
                      `🚨 EMERGENCY SOS ALERT: ${profile?.full_name || 'Priya Singh'} requires immediate assistance at service address: Flat 402, C-Scheme, Jaipur. Sahakari Seva Citizen Ref: #${profile?.membership_id || 'COP-8842'}.`
                    )
                  }
                  activeOpacity={0.8}
                >
                  <MessageSquare size={16} color="#ffffff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.whatsAppActionText}>Send WhatsApp SOS with Location</Text>
                    <Text style={styles.whatsAppActionSub}>Instant coordinates & service alert message</Text>
                  </View>
                  <ChevronRight size={16} color="#ffffff" />
                </TouchableOpacity>

                {/* Instant Action 3: Send SMS Alert */}
                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() =>
                    openSms(
                      currentContactPhone,
                      `🚨 EMERGENCY: Please call me immediately. Sahakari Seva SOS triggered at Jaipur location.`
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Send size={15} color={colors.textPrimary} />
                  <Text style={styles.secondaryActionText}>Send Emergency SMS</Text>
                </TouchableOpacity>

                {/* Instant Action 4: All-India 112 Police Line */}
                <TouchableOpacity
                  style={styles.police112Btn}
                  onPress={() => openDialer('112')}
                  activeOpacity={0.8}
                >
                  <AlertTriangle size={15} color="#dc2626" />
                  <Text style={styles.police112Text}>Dial Police & Medical Emergency (112)</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Inline Edit Emergency Contact Form */
              <View>
                <Text style={styles.inputLabel}>Contact Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="e.g. Dr. Alok Singh"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.modalInput}
                  value={contactRelation}
                  onChangeText={setContactRelation}
                  placeholder="e.g. Father / Guardian / Spouse"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.inputLabel}>Emergency Mobile Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  placeholder="+91 98290 11223"
                  placeholderTextColor={colors.textMuted}
                />

                <View style={styles.modalBtnRow}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="sm"
                    onPress={() => setIsEditingContact(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Save Contact"
                    variant="primary"
                    size="sm"
                    loading={savingContact}
                    onPress={handleSaveEmergencyContact}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* =========================================================================
          2. COOPERATIVE CITIZEN HELPLINE CENTER MODAL
      ========================================================================= */}
      <Modal visible={helplineModalVisible} transparent animationType="fade" onRequestClose={() => setHelplineModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setHelplineModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.sheetIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Shield size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Rajasthan Cooperative Helpline</Text>
                  <Text style={styles.modalSubHead}>Toll-free redressal & dispatch coordination</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setHelplineModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Officer On Duty Status Banner */}
            <View style={styles.dutyOfficerBanner}>
              <View style={styles.dutyOfficerIconWrap}>
                <Building2 size={16} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dutyOfficerTitle}>Department of Cooperatives & Shramik Welfare</Text>
                <Text style={styles.dutyOfficerName}>Officer on Duty: Smt. Sunita Meena, Senior Grievance Officer</Text>
                <Text style={styles.dutyOfficerStatus}>🟢 4 Bilingual lines active · Average response time &lt; 15s</Text>
              </View>
            </View>

            {/* Direct Channel 1: Toll Free 1800-SAHAKAR */}
            <TouchableOpacity
              style={styles.helplineOptionCard}
              onPress={() => openDialer('18007242527')}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.helplineOptionTitle}>1800-SAHAKAR (1800-724-2527)</Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>Toll-Free 24x7</Text>
                  </View>
                </View>
                <Text style={styles.helplineOptionSub}>Booking disputes, billing inquiries & zero-surge audit</Text>
              </View>
              <View style={styles.callActionButton}>
                <PhoneCall size={14} color="#ffffff" />
                <Text style={styles.callActionButtonText}>Call Free</Text>
              </View>
            </TouchableOpacity>

            {/* Direct Channel 2: Jaipur Central Control Room */}
            <TouchableOpacity
              style={styles.helplineOptionCard}
              onPress={() => openDialer('01412227000')}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.helplineOptionTitle}>0141-2227000 (Central Control)</Text>
                  <View style={[styles.freeBadge, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.freeBadgeText, { color: colors.textSecondary }]}>Landline</Text>
                  </View>
                </View>
                <Text style={styles.helplineOptionSub}>Jaipur Division artisan emergency dispatch desk</Text>
              </View>
              <View style={[styles.callActionButton, { backgroundColor: colors.primaryDark }]}>
                <Phone size={14} color="#ffffff" />
                <Text style={styles.callActionButtonText}>Call Desk</Text>
              </View>
            </TouchableOpacity>

            {/* Direct Channel 3: WhatsApp Support Desk */}
            <TouchableOpacity
              style={styles.helplineOptionCard}
              onPress={() => openWhatsApp('911412227000', 'Hello Sahakari Seva Citizen Support Desk, I need assistance with my service.')}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.helplineOptionTitle}>WhatsApp Grievance Desk</Text>
                  <View style={[styles.freeBadge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.freeBadgeText, { color: '#15803d' }]}>Chat 24x7</Text>
                  </View>
                </View>
                <Text style={styles.helplineOptionSub}>Send work photos, address pins or meter readings</Text>
              </View>
              <View style={[styles.callActionButton, { backgroundColor: '#16a34a' }]}>
                <MessageSquare size={14} color="#ffffff" />
                <Text style={styles.callActionButtonText}>Chat</Text>
              </View>
            </TouchableOpacity>

            {/* Direct Channel 4: Women & Senior Citizens Priority Safety Cell */}
            <TouchableOpacity
              style={styles.helplineOptionCard}
              onPress={() => openDialer('1090')}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.helplineOptionTitle}>Safety Cell (1090 / 181)</Text>
                  <View style={[styles.freeBadge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.freeBadgeText, { color: '#b45309' }]}>Priority</Text>
                  </View>
                </View>
                <Text style={styles.helplineOptionSub}>Dedicated women & senior citizen welfare helpline</Text>
              </View>
              <View style={[styles.callActionButton, { backgroundColor: '#b45309' }]}>
                <Shield size={14} color="#ffffff" />
                <Text style={styles.callActionButtonText}>Dial 1090</Text>
              </View>
            </TouchableOpacity>

            <Button
              title="Close Helpline Center"
              variant="outline"
              size="sm"
              onPress={() => setHelplineModalVisible(false)}
              style={{ marginTop: 14 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* =========================================================================
          3. COOPERATIVE OMBUDSMAN & STATUTORY GRIEVANCE PORTAL MODAL
      ========================================================================= */}
      <Modal visible={ombudsmanModalVisible} transparent animationType="fade" onRequestClose={() => setOmbudsmanModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOmbudsmanModalVisible(false)}>
          <Pressable style={[styles.modalBox, { maxHeight: '90%' }]} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.sheetIconCircle, { backgroundColor: colors.secondaryLight }]}>
                  <Scale size={18} color={colors.secondaryDark} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Cooperative Ombudsman Portal</Text>
                  <Text style={styles.modalSubHead}>Statutory binding resolution (SLA &lt; 12 hrs)</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setOmbudsmanModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Ombudsman Nav Tabs */}
            <View style={styles.ombudsmanTabRow}>
              <TouchableOpacity
                style={[styles.ombudsmanTabBtn, ombudsmanTab === 'file' && styles.ombudsmanTabBtnActive]}
                onPress={() => setOmbudsmanTab('file')}
              >
                <Text style={[styles.ombudsmanTabBtnText, ombudsmanTab === 'file' && styles.ombudsmanTabBtnTextActive]}>
                  File Grievance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ombudsmanTabBtn, ombudsmanTab === 'tickets' && styles.ombudsmanTabBtnActive]}
                onPress={() => setOmbudsmanTab('tickets')}
              >
                <Text style={[styles.ombudsmanTabBtnText, ombudsmanTab === 'tickets' && styles.ombudsmanTabBtnTextActive]}>
                  Track Tickets ({tickets.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {ombudsmanTab === 'file' ? (
                <View>
                  {grievanceSuccessMsg ? (
                    <View style={styles.successBanner}>
                      <CheckCircle size={16} color="#15803d" />
                      <Text style={styles.successBannerText}>{grievanceSuccessMsg}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.inputLabel}>Grievance Category</Text>
                  <View style={styles.categoryChipsGrid}>
                    {[
                      'Billing & Overcharging Dispute',
                      'Service Quality / Incomplete',
                      'Worker Delay & No-Show',
                      'Worker Conduct & Safety',
                      'Welfare / Warranty Claim'
                    ].map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, grievanceCategory === cat && styles.categoryChipActive]}
                        onPress={() => setGrievanceCategory(cat)}
                      >
                        <Text style={[styles.categoryChipText, grievanceCategory === cat && styles.categoryChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Related Booking ID</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={grievanceBookingId}
                    onChangeText={setGrievanceBookingId}
                    placeholder="e.g. BK-1002"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.inputLabel}>Detailed Grievance Description</Text>
                  <TextInput
                    style={[styles.modalInput, { minHeight: 70 }]}
                    value={grievanceDesc}
                    onChangeText={setGrievanceDesc}
                    multiline
                    placeholder="Describe the issue, extra amounts charged, or defect in service..."
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.inputLabel}>Resolution Urgency</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {['Normal (12h SLA)', 'Urgent (1h SLA)'].map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.urgencyChip, grievanceUrgency === u && styles.urgencyChipActive]}
                        onPress={() => setGrievanceUrgency(u as any)}
                      >
                        <Text style={[styles.urgencyChipText, grievanceUrgency === u && styles.urgencyChipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.legalGuaranteeNotice}>
                    <Shield size={14} color={colors.primary} />
                    <Text style={styles.legalGuaranteeText}>
                      Protected under Section 19 of the Rajasthan Cooperative Societies Act 2026. Zero platform commission ensures impartial arbitral investigation.
                    </Text>
                  </View>

                  <Button
                    title={submittingGrievance ? 'Submitting to Registrar...' : 'Submit Official Grievance'}
                    variant="primary"
                    size="md"
                    loading={submittingGrievance}
                    onPress={handleSubmitGrievance}
                    style={{ marginTop: 8 }}
                  />
                </View>
              ) : (
                /* Track Registered Grievances List */
                <View>
                  {tickets.map(t => (
                    <View key={t.id} style={styles.ticketCard}>
                      <View style={styles.ticketHeaderRow}>
                        <Text style={styles.ticketIdText}>{t.id}</Text>
                        <Badge label={t.status} variant={t.statusVariant} size="sm" />
                      </View>
                      <Text style={styles.ticketCategory}>{t.category} · Ref: {t.bookingId}</Text>
                      <View style={styles.ticketResolutionBox}>
                        <Text style={styles.ticketResolutionTitle}>Arbitration Status:</Text>
                        <Text style={styles.ticketResolutionText}>{t.resolution}</Text>
                        <Text style={styles.ticketArbitratorText}>Authority: {t.arbitrator}</Text>
                      </View>
                      <Text style={styles.ticketDate}>Lodged: {t.date}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* =========================================================================
          4. PATRONAGE AUDIT & SAVINGS PASSBOOK MODAL
      ========================================================================= */}
      <Modal visible={patronageModalVisible} transparent animationType="fade" onRequestClose={() => setPatronageModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPatronageModalVisible(false)}>
          <Pressable style={[styles.modalBox, { maxHeight: '90%' }]} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.sheetIconCircle, { backgroundColor: '#dcfce7' }]}>
                  <Sparkles size={18} color="#15803d" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Cooperative Passbook Audit</Text>
                  <Text style={styles.modalSubHead}>Transparent zero-surge financial passbook</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setPatronageModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {/* Lifetime Passbook Summary Grid */}
              <View style={styles.passbookSummaryGrid}>
                <View style={styles.passbookItem}>
                  <Text style={styles.passbookItemVal}>₹4,890</Text>
                  <Text style={styles.passbookItemLabel}>Total Spent (7 Jobs)</Text>
                </View>
                <View style={styles.passbookItem}>
                  <Text style={[styles.passbookItemVal, { color: '#059669' }]}>₹4,744</Text>
                  <Text style={styles.passbookItemLabel}>Direct Worker Payout (100%)</Text>
                </View>
                <View style={styles.passbookItem}>
                  <Text style={[styles.passbookItemVal, { color: '#d97706' }]}>₹146</Text>
                  <Text style={styles.passbookItemLabel}>Solidarity Welfare Fund (3%)</Text>
                </View>
                <View style={styles.passbookItem}>
                  <Text style={[styles.passbookItemVal, { color: '#2563eb' }]}>₹1,450</Text>
                  <Text style={styles.passbookItemLabel}>Net Citizen Savings vs Surge</Text>
                </View>
              </View>

              {/* Cooperative Difference Table */}
              <Text style={styles.inputLabel}>Platform Extraction Audit</Text>
              <View style={styles.comparisonTable}>
                <View style={styles.comparisonRowHeader}>
                  <Text style={[styles.tableCol, { fontWeight: '800' }]}>Feature</Text>
                  <Text style={[styles.tableCol, { fontWeight: '800', color: colors.primary }]}>Sahakari Seva</Text>
                  <Text style={[styles.tableCol, { fontWeight: '800', color: colors.textSecondary }]}>Commercial Apps</Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={styles.tableCol}>Commission</Text>
                  <Text style={[styles.tableCol, { color: '#16a34a', fontWeight: '700' }]}>0% Direct</Text>
                  <Text style={styles.tableCol}>20% to 30% cut</Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={styles.tableCol}>Surge Rates</Text>
                  <Text style={[styles.tableCol, { color: '#16a34a', fontWeight: '700' }]}>0x Guaranteed</Text>
                  <Text style={styles.tableCol}>1.5x – 2.5x surge</Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={styles.tableCol}>Worker Welfare</Text>
                  <Text style={[styles.tableCol, { color: '#16a34a', fontWeight: '700' }]}>3% Insured</Text>
                  <Text style={styles.tableCol}>0% (Retained profit)</Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={styles.tableCol}>Arbitration</Text>
                  <Text style={[styles.tableCol, { color: '#16a34a', fontWeight: '700' }]}>Govt Ombudsman</Text>
                  <Text style={styles.tableCol}>Automated bot</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'column', gap: 8, marginTop: 14 }}>
                <TouchableOpacity
                  style={styles.passbookPrimaryBtn}
                  onPress={handleNavigateToBookings}
                >
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text style={styles.passbookPrimaryBtnText}>View All 7 Booking Invoices</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.passbookDownloadBtn}
                  onPress={handleDownloadPassbook}
                >
                  <Download size={15} color={colors.textPrimary} />
                  <Text style={styles.passbookDownloadBtnText}>Download Certified Passbook Statement (JSON)</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* =========================================================================
          5. EDIT ADDRESS MODAL
      ========================================================================= */}
      <Modal visible={editAddressModalVisible} transparent animationType="fade" onRequestClose={() => setEditAddressModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditAddressModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Delivery Address</Text>
              <TouchableOpacity onPress={() => setEditAddressModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('customerProfile.address_label', 'Address Label')}</Text>
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

            <Text style={styles.inputLabel}>{t('customerProfile.address_text', 'Street Address')}</Text>
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
                <Text style={styles.inputLabel}>{t('customerProfile.city', 'City')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrCity}
                  onChangeText={setAddrCity}
                  placeholder="Jaipur"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('customerProfile.pincode', 'Pincode')}</Text>
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
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setEditAddressModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Changes"
                variant="primary"
                size="sm"
                onPress={handleSaveEditedAddress}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* =========================================================================
          6. EDIT PROFILE MODAL
      ========================================================================= */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('customerProfile.edit_profile', 'Edit Profile')}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>{t('customerProfile.full_name', 'Full Name')}</Text>
              <TextInput
                style={styles.modalInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('customerProfile.phone', 'Phone Number')}</Text>
              <TextInput
                style={styles.modalInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('customerProfile.email', 'Email')}</Text>
              <TextInput
                style={styles.modalInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('customerProfile.city', 'City')}</Text>
              <TextInput
                style={styles.modalInput}
                value={city}
                onChangeText={setCity}
                placeholder="Jaipur"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('customerProfile.pincode', 'Pincode')}</Text>
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
                title={t('customerProfile.cancel', 'Cancel')}
                variant="outline"
                size="sm"
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('customerProfile.save_profile', 'Save Profile')}
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

      {/* =========================================================================
          7. ADD ADDRESS MODAL
      ========================================================================= */}
      <Modal visible={addressModalVisible} transparent animationType="fade" onRequestClose={() => setAddressModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddressModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('customerProfile.add_address', 'Add Delivery Address')}</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('customerProfile.address_label', 'Address Label')}</Text>
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

            <Text style={styles.inputLabel}>{t('customerProfile.address_text', 'Street Address')}</Text>
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
                <Text style={styles.inputLabel}>{t('customerProfile.city', 'City')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrCity}
                  onChangeText={setAddrCity}
                  placeholder="Jaipur"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('customerProfile.pincode', 'Pincode')}</Text>
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
                title={t('customerProfile.cancel', 'Cancel')}
                variant="outline"
                size="sm"
                onPress={() => setAddressModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('customerProfile.add_address', 'Add Address')}
                variant="primary"
                size="sm"
                onPress={handleAddAddress}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reusable Regional Language Modal */}
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
    gap: 4,
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
  contactActionHint: {
    fontSize: 10,
    color: '#86efac',
    fontWeight: '700',
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
  auditLinkPill: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  auditLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
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
    color: colors.primary,
    fontWeight: '600',
    marginTop: 3,
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
    gap: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  editAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editAddrText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
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
    fontWeight: '800',
    color: colors.danger,
    letterSpacing: 0.5,
  },
  verifiedPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#15803d',
  },
  sosContactName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sosContactPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  tapToManageText: {
    fontSize: 9.5,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 3,
  },
  sosCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sosCallText: {
    fontSize: 11,
    fontWeight: '800',
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helplineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
  },
  onlineText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#15803d',
  },
  helplineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  helplinePhone: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  helplineDesc: {
    fontSize: 9.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ombudsmanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ombudsmanIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ombudsmanText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  ombudsmanSubText: {
    fontSize: 9.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  activeTicketsPill: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTicketsPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondaryDark,
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubHead: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sheetIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 16,
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

  // Interactive SOS Sheet Styles
  emergencyTargetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
  },
  targetName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  targetMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  editContactIconBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  primaryActionBtnSub: {
    fontSize: 9.5,
    color: '#fee2e2',
    marginTop: 1,
  },
  whatsAppActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  whatsAppActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  whatsAppActionSub: {
    fontSize: 9.5,
    color: '#dcfce7',
    marginTop: 1,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  police112Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  police112Text: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#dc2626',
  },

  // Helpline Center Styles
  dutyOfficerBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: isDark ? '#142a20' : colors.primaryLight,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 12,
  },
  dutyOfficerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dutyOfficerTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  dutyOfficerName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  dutyOfficerStatus: {
    fontSize: 9.5,
    color: colors.primaryDark,
    marginTop: 2,
    fontWeight: '600',
  },
  helplineOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  helplineOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  helplineOptionSub: {
    fontSize: 9.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  freeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#15803d',
  },
  callActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  callActionButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Ombudsman Styles
  ombudsmanTabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  ombudsmanTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  ombudsmanTabBtnActive: {
    borderBottomColor: colors.primary,
  },
  ombudsmanTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  ombudsmanTabBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.primary,
  },
  urgencyChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  urgencyChipActive: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  urgencyChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  urgencyChipTextActive: {
    color: colors.warningDark,
    fontWeight: '800',
  },
  legalGuaranteeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  legalGuaranteeText: {
    flex: 1,
    fontSize: 9,
    color: colors.textSecondary,
    lineHeight: 13,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  successBannerText: {
    flex: 1,
    fontSize: 10,
    color: '#15803d',
    fontWeight: '700',
  },
  ticketCard: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Courier',
  },
  ticketCategory: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  ticketResolutionBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  ticketResolutionTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ticketResolutionText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  ticketArbitratorText: {
    fontSize: 8.5,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  ticketDate: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Passbook Modal Styles
  passbookSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  passbookItem: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 8,
  },
  passbookItemVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  passbookItemLabel: {
    fontSize: 9.5,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  comparisonTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  comparisonRowHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCol: {
    flex: 1,
    fontSize: 9.5,
    color: colors.textPrimary,
  },
  passbookPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  passbookPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  passbookDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
    borderRadius: 8,
  },
  passbookDownloadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default CustomerProfileScreen;
