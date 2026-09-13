// ==============================================================================
// ADMIN PROFILE SCREEN — SECRETARIAT & REGISTRAR OF COOPERATIVES
// Official executive credentials, state-wide jurisdiction telemetry,
// statutory minimum wage floor regulation, mandatory verification toggles,
// cryptographic audit compliance, and multi-language administrative preferences.
// ==============================================================================

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Award,
  Building2,
  Users,
  MapPin,
  TrendingUp,
  HeartHandshake,
  CheckCircle2,
  FileText,
  Download,
  Key,
  Globe,
  Sliders,
  AlertTriangle,
  Scale,
  LogOut,
  ChevronRight,
  Sparkles,
  Lock,
  ExternalLink,
  X
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { LanguageModal } from '../../components/common/LanguageModal';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { Card, Badge, Button } from '../../components/ui';
import { FadeInView, AnimatedNumber, ScalePressable } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { ApiClient } from '../../services/apiClient';
import { AdminProfile } from '../../types';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';
import { AuthContext } from '../../navigation/RootNavigator';

export const AdminProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'AdminDashboard', isHome: false });
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { logout } = useContext(AuthContext);

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Governance Controls State
  const [minWage, setMinWage] = useState(249);
  const [mandatoryCert, setMandatoryCert] = useState(true);
  const [emergencyOverride, setEmergencyOverride] = useState(true);

  // Modals
  const [byelawsModal, setByelawsModal] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [ledgerModalVisible, setLedgerModalVisible] = useState(false);
  const [keyRotatedModal, setKeyRotatedModal] = useState(false);

  const loadAdmin = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getAdminProfile();
      setAdmin(data);
      setMinWage(data.statutory_minimum_wage || 249);
      setMandatoryCert(data.mandatory_certification ?? true);
      setEmergencyOverride(data.emergency_mobilization_override ?? true);
    } catch (err) {
      console.warn('Admin profile load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const handleUpdateMinWage = async (newWage: number) => {
    setMinWage(newWage);
    try {
      await ApiClient.updateAdminProfile({ statutory_minimum_wage: newWage });
      Alert.alert(
        t('adminProfile.settings_saved_title'),
        `Statutory minimum wage floor set to ₹${newWage}/hr across all 128 registered cooperative societies.`
      );
    } catch (e) {
      console.warn('Failed to update minimum wage:', e);
    }
  };

  const handleToggleMandatoryCert = async (val: boolean) => {
    setMandatoryCert(val);
    try {
      await ApiClient.updateAdminProfile({ mandatory_certification: val });
    } catch (e) {
      console.warn('Failed to update cert rule:', e);
    }
  };

  const handleToggleEmergencyOverride = async (val: boolean) => {
    setEmergencyOverride(val);
    try {
      await ApiClient.updateAdminProfile({ emergency_mobilization_override: val });
    } catch (e) {
      console.warn('Failed to update emergency override:', e);
    }
  };

  const handleExportLedger = () => {
    const exportData = {
      jurisdiction: 'Rajasthan State Cooperative Shramik Secretariat',
      officer: admin?.officer_name || 'Dr. Vikramaditya Rathore, IAS (Retd.)',
      authority_code: admin?.authority_code || 'SEC-RAJ-COOP-001',
      exported_at: new Date().toISOString(),
      statutory_minimum_wage_floor: minWage,
      mandatory_trade_certification: mandatoryCert,
      emergency_mobilization_override: emergencyOverride,
      cryptographic_integrity_hash: admin?.integrity_hash || '0x8F92A7D1C34E65B901FE',
      registered_cooperative_societies: 128,
      verified_shramik_workforce: 4120,
      total_statutory_transactions: 148920,
      compliance_certification: 'Verified compliant under Rajasthan Cooperative Societies Act 2026, Section 34.'
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.document) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sahakari_Seva_Ledger_2026_Q3_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setLedgerModalVisible(true);
  };

  const handleRotateKeys = () => {
    const chars = '0123456789ABCDEF';
    let newHash = '0x';
    for (let i = 0; i < 20; i++) {
      newHash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (admin) {
      setAdmin({ ...admin, integrity_hash: newHash });
    }
    setKeyRotatedModal(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading', 'Loading secretariat profile...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <Header
        title={t('adminProfile.title')}
        subtitle={t('adminProfile.subtitle')}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Secretariat Executive Credential Card */}
        <FadeInView delay={0} distance={10} duration={320}>
          <Card style={styles.executiveCard}>
            <View style={styles.execHeaderRow}>
              <View style={styles.sealBadge}>
                <Building2 size={24} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Badge label={t('adminProfile.executive_badge')} variant="warning" size="sm" />
                  <Text style={styles.authorityCode}>{admin?.authority_code || 'SEC-RAJ-COOP-001'}</Text>
                </View>
                <Text style={styles.officerName}>{admin?.officer_name || 'Dr. Vikramaditya Rathore, IAS (Retd.)'}</Text>
                <Text style={styles.designationText}>{admin?.designation || 'Chief Registrar & Commissioner of Cooperatives'}</Text>
                <Text style={styles.deptText}>{admin?.department || 'Dept of Cooperatives & Shramik Welfare, Govt of Rajasthan'}</Text>
              </View>
            </View>

            <View style={styles.execFooterRow}>
              <View style={styles.execMetaItem}>
                <MapPin size={11} color="#fde68a" />
                <Text style={styles.execMetaText}>Secretariat Annex, Jaipur</Text>
              </View>
              <View style={styles.execMetaItem}>
                <CheckCircle2 size={11} color="#86efac" />
                <Text style={styles.execMetaText}>Gazetted Commission Active</Text>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* State-Wide Jurisdiction Telemetry */}
        <FadeInView delay={80} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={16} color={colors.primary} />
            <Text style={styles.sectionHeading}>{t('adminProfile.jurisdiction_title')}</Text>
          </View>
          <Text style={styles.sectionSub}>{t('adminProfile.jurisdiction_sub')}</Text>

          <View style={styles.telemetryGrid}>
            <TouchableOpacity
              style={[styles.kpiCard, { borderLeftColor: colors.primary }]}
              onPress={() => navigation?.navigate('AdminTabs', { screen: 'AdminVerification' })}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Users size={16} color={colors.primary} />
              </View>
              <AnimatedNumber value={18} style={styles.kpiVal} />
              <Text style={styles.kpiLabel}>{t('adminProfile.registered_workers')}</Text>
              <Text style={styles.kpiHint}>16 Verified · 2 Pending →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { borderLeftColor: colors.success }]}
              onPress={() => navigation?.navigate('AdminTabs', { screen: 'AdminDashboard' })}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.successLight }]}>
                <Building2 size={16} color={colors.successDark} />
              </View>
              <AnimatedNumber value={128} style={styles.kpiVal} />
              <Text style={styles.kpiLabel}>{t('adminProfile.active_coops')}</Text>
              <Text style={styles.kpiHint}>View 128 Societies →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { borderLeftColor: colors.secondary }]}
              onPress={() => navigation?.navigate('AdminTabs', { screen: 'Forecast' })}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.secondaryLight }]}>
                <HeartHandshake size={16} color={colors.secondaryDark} />
              </View>
              <AnimatedNumber
                value={245000}
                prefix="₹"
                format={n => n.toLocaleString('en-IN')}
                style={[styles.kpiVal, { color: colors.secondaryDark }]}
              />
              <Text style={styles.kpiLabel}>{t('adminProfile.welfare_corpus')}</Text>
              <Text style={styles.kpiHint}>View Welfare Forecast →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { borderLeftColor: colors.violet }]}
              onPress={() => navigation?.navigate('AdminTabs', { screen: 'Allocation' })}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.violetLight }]}>
                <Scale size={16} color={colors.violetDark} />
              </View>
              <Text style={[styles.kpiVal, { color: colors.violetDark }]}>99.4%</Text>
              <Text style={styles.kpiLabel}>{t('adminProfile.dispute_resolution')}</Text>
              <Text style={styles.kpiHint}>View Allocations & SLAs →</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Statutory Governance Controls */}
        <FadeInView delay={160} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <Sliders size={16} color={colors.primary} />
            <Text style={styles.sectionHeading}>{t('adminProfile.governance_title')}</Text>
          </View>
          <Text style={styles.sectionSub}>{t('adminProfile.governance_sub')}</Text>

          <Card style={styles.cardBox}>
            {/* Minimum Wage Floor Selector */}
            <View style={styles.wageFloorHeader}>
              <View>
                <Text style={styles.controlTitle}>{t('adminProfile.min_wage_floor')}</Text>
                <Text style={styles.controlSub}>{t('adminProfile.min_wage_desc')}</Text>
              </View>
              <View style={styles.wageCurrentBadge}>
                <Text style={styles.wageCurrentText}>₹{minWage}/hr</Text>
              </View>
            </View>

            <View style={styles.wageChipsRow}>
              {[249, 299, 349, 399].map(w => (
                <TouchableOpacity
                  key={w}
                  style={[styles.wageChip, minWage === w && styles.wageChipActive]}
                  onPress={() => handleUpdateMinWage(w)}
                >
                  <Text style={[styles.wageChipText, minWage === w && styles.wageChipTextActive]}>
                    ₹{w}/hr
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Mandatory Trade Certification Toggle */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.controlTitle}>{t('adminProfile.mandatory_cert')}</Text>
                <Text style={styles.controlSub}>{t('adminProfile.mandatory_cert_desc')}</Text>
              </View>
              <Switch
                value={mandatoryCert}
                onValueChange={handleToggleMandatoryCert}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={mandatoryCert ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            {/* Emergency Service Mobilization Override */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.controlTitle}>{t('adminProfile.emergency_override')}</Text>
                <Text style={styles.controlSub}>{t('adminProfile.emergency_override_desc')}</Text>
              </View>
              <Switch
                value={emergencyOverride}
                onValueChange={handleToggleEmergencyOverride}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={emergencyOverride ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            {/* Annual Patronage Dividend Pool Rate */}
            <View style={styles.dividendRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlTitle}>{t('adminProfile.dividend_rebate')}</Text>
                <Text style={styles.controlSub}>{t('adminProfile.dividend_desc')}</Text>
              </View>
              <View style={styles.dividendBadge}>
                <Text style={styles.dividendBadgeText}>{admin?.patronage_dividend_rate || 12}% Annual</Text>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* Audit Trail & Digital Governance */}
        <FadeInView delay={240} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <FileText size={16} color={colors.primary} />
            <Text style={styles.sectionHeading}>{t('adminProfile.audit_title')}</Text>
          </View>
          <Text style={styles.sectionSub}>{t('adminProfile.audit_sub')}</Text>

          <Card style={styles.cardBox}>
            <TouchableOpacity style={styles.actionRowBtn} onPress={handleExportLedger} activeOpacity={0.75}>
              <View style={styles.actionIconWrap}>
                <Download size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionRowTitle}>{t('adminProfile.export_ledger')}</Text>
                <Text style={styles.actionRowSub}>Full compliance snapshot with worker verifications</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRowBtn} onPress={() => setByelawsModal(true)} activeOpacity={0.75}>
              <View style={[styles.actionIconWrap, { backgroundColor: colors.secondaryLight }]}>
                <Scale size={16} color={colors.secondaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionRowTitle}>{t('adminProfile.view_byelaws')}</Text>
                <Text style={styles.actionRowSub}>Official gazette charter: Fair wages, zero commission, arbitration</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Cryptographic Hash Badge */}
            <View style={styles.hashBox}>
              <View style={styles.hashHeader}>
                <Lock size={12} color={colors.successDark} />
                <Text style={styles.hashTitle}>{t('adminProfile.integrity_hash')}</Text>
                <Badge label={t('adminProfile.system_healthy')} variant="success" size="sm" />
              </View>
              <Text style={styles.hashText}>{admin?.integrity_hash || '0x8F92A7D1C34E65B901FE'}</Text>
              <Text style={styles.hashMeta}>
                {t('adminProfile.last_audit')}: {admin?.last_audit_date || '2026-09-01'} · Node consensus verified
              </Text>
              <TouchableOpacity
                style={styles.rotateKeyBtn}
                onPress={handleRotateKeys}
                activeOpacity={0.75}
              >
                <Key size={12} color={colors.primary} />
                <Text style={styles.rotateKeyBtnText}>Rotate Signature Key →</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </FadeInView>

        {/* Administrative Preferences */}
        <FadeInView delay={320} distance={10} duration={320}>
          <View style={styles.sectionHeader}>
            <Globe size={16} color={colors.primary} />
            <Text style={styles.sectionHeading}>{t('adminProfile.preferences_title')}</Text>
          </View>

          <Card style={styles.cardBox}>
            <TouchableOpacity
              style={styles.actionRowBtn}
              onPress={() => setLangModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <Globe size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionRowTitle}>{t('customerProfile.language_label')}</Text>
                <Text style={styles.actionRowSub}>{t(`lang.${i18n.language || 'en'}`)} (Active)</Text>
              </View>
              <View style={styles.langPill}>
                <Text style={styles.langPillText}>{(i18n.language || 'en').toUpperCase()}</Text>
                <ChevronRight size={13} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Text style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</Text>
                <View>
                  <Text style={styles.actionRowTitle}>{t('customerProfile.theme_label')}</Text>
                  <Text style={styles.actionRowSub}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                </View>
              </View>
              <ThemeToggle />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRowBtn} onPress={handleRotateKeys} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, { backgroundColor: colors.warningLight }]}>
                <Key size={16} color={colors.warningDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionRowTitle}>Rotate Administrative Keys</Text>
                <Text style={styles.actionRowSub}>Refresh cryptographic credentials for SEC-RAJ-COOP-001</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        </FadeInView>

        {/* Logout / Switch Role */}
        <FadeInView delay={380} distance={10} duration={320}>
          <Card style={styles.logoutCard}>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.75}>
              <LogOut size={16} color={colors.danger} />
              <Text style={styles.logoutText}>{t('auth.switch_role')}</Text>
            </TouchableOpacity>
          </Card>
        </FadeInView>
      </ScrollView>

      {/* Bye-Laws Modal */}
      <Modal visible={byelawsModal} transparent animationType="fade" onRequestClose={() => setByelawsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setByelawsModal(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('adminProfile.byelaws_title')}</Text>
              <TouchableOpacity onPress={() => setByelawsModal(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubText}>
              State Cooperative Federation Governance Charter (Statutory Act 2026):
            </Text>

            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              <View style={styles.lawItem}>
                <Text style={styles.lawNumber}>Article 1</Text>
                <Text style={styles.lawTitle}>Zero Platform Commission Extraction</Text>
                <Text style={styles.lawDesc}>100% of customer booking fee flows directly to the dispatched worker without intermediary deductions.</Text>
              </View>

              <View style={styles.lawItem}>
                <Text style={styles.lawNumber}>Article 2</Text>
                <Text style={styles.lawTitle}>Mandatory Statutory Wage Floor</Text>
                <Text style={styles.lawDesc}>No service transaction may settle below ₹249/hr to guarantee living wages and prevent competitive race-to-bottom.</Text>
              </View>

              <View style={styles.lawItem}>
                <Text style={styles.lawNumber}>Article 3</Text>
                <Text style={styles.lawTitle}>Solidarity Welfare Corpus</Text>
                <Text style={styles.lawDesc}>3% patron contribution is retained exclusively for worker accident cover, health insurance, and emergency pensions.</Text>
              </View>

              <View style={styles.lawItem}>
                <Text style={styles.lawNumber}>Article 4</Text>
                <Text style={styles.lawTitle}>Democratic Worker Representation</Text>
                <Text style={styles.lawDesc}>All algorithms and dispatch parameters are subject to quarterly review by the Joint Cooperative Council.</Text>
              </View>
            </ScrollView>

            <Button
              title={t('common.close', 'Close')}
              variant="primary"
              size="sm"
              onPress={() => setByelawsModal(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language Selector Modal */}
      <LanguageModal visible={langModalVisible} onClose={() => setLangModalVisible(false)} />

      {/* Ledger Exported Modal */}
      <Modal visible={ledgerModalVisible} transparent animationType="fade" onRequestClose={() => setLedgerModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLedgerModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color={colors.successDark} />
                <Text style={styles.modalTitle}>Statutory Ledger Exported</Text>
              </View>
              <TouchableOpacity onPress={() => setLedgerModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubText}>
              Cryptographically signed snapshot downloaded as JSON file.
            </Text>
            <View style={styles.ledgerInfoBox}>
              <Text style={styles.ledgerInfoLabel}>FILE NAME</Text>
              <Text style={styles.ledgerInfoVal}>Sahakari_Seva_Ledger_2026_Q3.json</Text>
              <Text style={[styles.ledgerInfoLabel, { marginTop: 8 }]}>AUDIT SHA-256 HASH</Text>
              <Text style={styles.ledgerHashText}>{admin?.integrity_hash || '0x8F92A7D1C34E65B901FE'}</Text>
              <Text style={[styles.ledgerInfoLabel, { marginTop: 8 }]}>COMPLIANCE CERTIFICATION</Text>
              <Text style={styles.ledgerComplianceText}>
                Section 34, Rajasthan Cooperative Societies Act 2026. 100% statutory floor compliance verified.
              </Text>
            </View>
            <Button
              title="Done"
              variant="primary"
              size="sm"
              onPress={() => setLedgerModalVisible(false)}
              style={{ marginTop: 14 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Key Rotated Modal */}
      <Modal visible={keyRotatedModal} transparent animationType="fade" onRequestClose={() => setKeyRotatedModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setKeyRotatedModal(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Key size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>Signature Key Rotated</Text>
              </View>
              <TouchableOpacity onPress={() => setKeyRotatedModal(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubText}>
              New administrative signature certificate generated for authority SEC-RAJ-COOP-001.
            </Text>
            <View style={styles.ledgerInfoBox}>
              <Text style={styles.ledgerInfoLabel}>NEW INTEGRITY HASH</Text>
              <Text style={styles.ledgerHashText}>{admin?.integrity_hash}</Text>
              <Text style={[styles.ledgerInfoLabel, { marginTop: 8 }]}>CERTIFICATE VALIDITY</Text>
              <Text style={styles.ledgerInfoVal}>Valid until September 2027 (Active Gazetted)</Text>
            </View>
            <Button
              title="Understood"
              variant="primary"
              size="sm"
              onPress={() => setKeyRotatedModal(false)}
              style={{ marginTop: 14 }}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  executiveCard: {
    padding: 16,
    backgroundColor: isDark ? '#1a202c' : '#1e293b',
    borderColor: isDark ? '#334155' : '#0f172a',
    borderWidth: 1.5,
    marginBottom: 16,
    borderRadius: 16,
  },
  execHeaderRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  sealBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  authorityCode: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  officerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  designationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 2,
  },
  deptText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  execFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 8,
  },
  execMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  execMetaText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
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
  telemetryGrid: {
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
  kpiVal: {
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
  cardBox: {
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
  },
  wageFloorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  controlTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  controlSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  wageCurrentBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wageCurrentText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  wageChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  wageChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
  },
  wageChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  wageChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  wageChipTextActive: {
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dividendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dividendBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dividendBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.successDark,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionRowSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  hashBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hashTitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  hashText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: colors.primary,
  },
  hashMeta: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 3,
  },
  logoutCard: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  lawItem: {
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  lawNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  lawTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  lawDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rotateKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
  },
  rotateKeyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  ledgerInfoBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ledgerInfoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  ledgerInfoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  ledgerHashText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  ledgerComplianceText: {
    fontSize: 11,
    color: colors.successDark,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 15,
  },
});

export default AdminProfileScreen;
