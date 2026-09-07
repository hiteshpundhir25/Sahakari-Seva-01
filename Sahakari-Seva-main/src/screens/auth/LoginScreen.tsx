// ==============================================================================
// LOGIN & ONBOARDING SCREEN — MODERN COOPERATIVE WELCOME EXPERIENCE
// Gradient hero, segmented role picker, glassy OTP card & 1-click demo login.
// Fully localized (8 languages) with the app-wide animation system.
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  User,
  Wrench,
  Shield,
  ArrowRight,
  Globe,
  CheckCircle2,
  Sparkles,
  Phone,
} from 'lucide-react-native';
import { LanguageModal } from '../../components/common/LanguageModal';
import ThemeToggle from '../../components/common/ThemeToggle';
import { FadeInView, ScalePressable, PulseView } from '../../animations';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

interface LoginScreenProps {
  onSelectRole: (role: 'customer' | 'worker' | 'admin', userProfile?: any) => void;
}

const NATIVE_SHORT: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'worker' | 'admin'>('customer');
  const [focused, setFocused] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const handlePhoneSubmit = () => {
    if (phoneNumber.length < 10) {
      Alert.alert(t('auth.invalid_phone_title'), t('auth.invalid_phone_msg'));
      return;
    }
    onSelectRole(selectedRole, {
      name: selectedRole === 'worker' ? 'Rajesh Sharma' : selectedRole === 'admin' ? 'Federation Admin' : 'Demo Customer',
      phone: phoneNumber,
      role: selectedRole
    });
  };

  const handleQuickDemoLogin = (role: 'customer' | 'worker' | 'admin') => {
    if (role === 'customer') {
      onSelectRole('customer', {
        id: 'p0000000-0000-0000-0000-000000000002',
        name: 'Priya Singh',
        phone: '+91 98711 54321',
        city: 'Jaipur',
        role: 'customer'
      });
    } else if (role === 'worker') {
      onSelectRole('worker', {
        id: 'w0000000-0000-0000-0000-000000000001',
        name: 'Rajesh Sharma',
        trade: 'Electrician',
        phone: '+91 98110 55443',
        city: 'Jaipur',
        role: 'worker'
      });
    } else {
      onSelectRole('admin', {
        id: 'admin-demo',
        name: 'Cooperative Federation Officer',
        phone: '+91 98765 43219',
        role: 'admin'
      });
    }
  };

  const roles: {
    key: 'customer' | 'worker' | 'admin';
    icon: React.ReactNode;
  }[] = [
    { key: 'customer', icon: <User size={17} color={colors.primary} /> },
    { key: 'worker', icon: <Wrench size={17} color={colors.primary} /> },
    { key: 'admin', icon: <Shield size={17} color={colors.primary} /> },
  ];

  const roleDescs: Record<string, string> = {
    customer: t('auth.customer_desc'),
    worker: t('auth.worker_desc'),
    admin: t('auth.admin_desc'),
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.logoBadge}>
          <ShieldCheck size={19} color={colors.primary} />
          <Text style={styles.brandTitle}>{t('app_name')}</Text>
        </View>

        <View style={styles.topBarActions}>
          <ThemeToggle />
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLangModalVisible(true)}
          >
            <Globe size={15} color={colors.primary} />
            <Text style={styles.langText}>
              {NATIVE_SHORT[i18n.language] || 'English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Hero */}
        <FadeInView distance={24} duration={500}>
          <LinearGradient
            colors={
              isDark
                ? ['#1e1b4b', '#312e81', '#4338ca']
                : [colors.primaryDark, colors.primary, '#6d5ae6']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Decorative floating orbs */}
            <Animated.View style={[styles.orb, styles.orbA, { transform: [{ translateY: floatY }] }]} />
            <Animated.View style={[styles.orb, styles.orbB, { transform: [{ translateY: Animated.multiply(floatY, -1.4) }] }]} />
            <View style={styles.orbC} />

            <PulseView scaleTo={1.03} duration={2200}>
              <View style={styles.heroMonogram}>
                <ShieldCheck size={30} color="#ffffff" />
              </View>
            </PulseView>

            <Text style={styles.heroTitle}>{t('app_name')}</Text>
            <Text style={styles.heroSub}>{t('auth.hero_subtitle')}</Text>

            <View style={styles.ministryPill}>
              <CheckCircle2 size={13} color="#ffffff" />
              <Text style={styles.ministryText}>{t('auth.ministry_pill')}</Text>
            </View>
          </LinearGradient>
        </FadeInView>

        {/* Role Selector — segmented chips */}
        <FadeInView delay={140} distance={14} duration={360}>
          <Text style={styles.sectionLabel}>{t('auth.role_label')}</Text>
        </FadeInView>

        <View style={styles.roleRow}>
          {roles.map((role, idx) => {
            const isActive = selectedRole === role.key;
            return (
              <FadeInView key={role.key} delay={180 + idx * 80} distance={12} duration={340} style={styles.roleFlex}>
                <ScalePressable onPress={() => setSelectedRole(role.key)} scaleTo={0.96}>
                  <LinearGradient
                    colors={isActive ? [colors.primary, colors.primaryDark] : ['transparent', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.roleChip,
                      !isActive && { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.roleChipIcon,
                        isActive
                          ? { backgroundColor: 'rgba(255,255,255,0.22)' }
                          : { backgroundColor: colors.primaryLight },
                      ]}
                    >
                      {React.cloneElement(role.icon as any, {
                        color: isActive ? '#ffffff' : colors.primary,
                      })}
                    </View>
                    <View style={styles.roleTitleWrap}>
                      <Text
                        style={[styles.roleChipTitle, !isActive && { color: colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {t(`roles.${role.key}`)}
                      </Text>
                    </View>
                    <View style={styles.roleDescWrap}>
                      <Text
                        style={[styles.roleChipDesc, !isActive && { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {roleDescs[role.key]}
                      </Text>
                    </View>
                  </LinearGradient>
                </ScalePressable>
              </FadeInView>
            );
          })}
        </View>

        {/* OTP Login Card */}
        <FadeInView delay={460} distance={16} duration={380}>
          <View style={[styles.loginCard, focused && styles.loginCardFocused]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconWrap}>
                <Phone size={16} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.boxTitle}>{t('auth.otp_login')}</Text>
                <Text style={styles.boxSub}>{t('auth.otp_sub')}</Text>
              </View>
            </View>

            <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
              <Text style={styles.countryCode}>+91</Text>
              <View style={styles.inputDivider} />
              <TextInput
                style={styles.phoneInput}
                placeholder={t('auth.phone_placeholder')}
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            <ScalePressable onPress={handlePhoneSubmit} scaleTo={0.97}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                <Text style={styles.loginBtnText}>{t('auth.continue_otp')}</Text>
                <ArrowRight size={17} color={colors.textInverse} />
              </LinearGradient>
            </ScalePressable>
          </View>
        </FadeInView>

        {/* 1-Click Demo Accounts */}
        <FadeInView delay={580} distance={16} duration={380}>
          <View style={styles.demoSection}>
            <View style={styles.demoHeader}>
              <Sparkles size={15} color={colors.secondaryDark} />
              <Text style={styles.demoTitle}>{t('auth.demo_section')}</Text>
            </View>

            <View style={styles.demoBtnRow}>
              <ScalePressable onPress={() => handleQuickDemoLogin('customer')} style={styles.demoBtnFlex}>
                <View style={styles.demoBtn}>
                  <User size={13} color={colors.secondaryDark} />
                  <Text
                    style={styles.demoBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {t('auth.demo_btn_customer')}
                  </Text>
                </View>
              </ScalePressable>
              <ScalePressable onPress={() => handleQuickDemoLogin('worker')} style={styles.demoBtnFlex}>
                <View style={styles.demoBtn}>
                  <Wrench size={13} color={colors.secondaryDark} />
                  <Text
                    style={styles.demoBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {t('auth.demo_btn_worker')}
                  </Text>
                </View>
              </ScalePressable>
              <ScalePressable onPress={() => handleQuickDemoLogin('admin')} style={styles.demoBtnFlex}>
                <View style={styles.demoBtn}>
                  <Shield size={13} color={colors.secondaryDark} />
                  <Text
                    style={styles.demoBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {t('auth.demo_btn_admin')}
                  </Text>
                </View>
              </ScalePressable>
            </View>
          </View>
        </FadeInView>
      </ScrollView>

      <LanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: colors.topPanel,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.topPanelBorder,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  scrollContent: {
    padding: 20,
  },
  // --- Gradient Hero ---
  hero: {
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: 'center',
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
    backgroundColor: '#ffffff',
  },
  orbA: {
    width: 130,
    height: 130,
    top: -40,
    left: -30,
  },
  orbB: {
    width: 90,
    height: 90,
    bottom: -25,
    right: -15,
  },
  orbC: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    top: 26,
    right: 34,
    backgroundColor: 'rgba(251, 191, 36, 0.35)',
  },
  heroMonogram: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  heroSub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 300,
  },
  ministryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 14,
  },
  ministryText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  // --- Role Segmented Row ---
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  roleFlex: {
    flex: 1,
  },
  roleChip: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 126,
  },
  roleChipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  roleTitleWrap: {
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  roleChipTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14.5,
  },
  roleDescWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  roleChipDesc: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 12.5,
  },
  // --- OTP Card ---
  loginCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  loginCardFocused: {
    borderColor: colors.primary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  boxSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
    backgroundColor: colors.surfaceSubtle,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15.5,
    color: colors.textPrimary,
    fontWeight: '600',
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  loginBtn: {
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  // --- Demo Section ---
  demoSection: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondaryDark,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtnFlex: {
    flex: 1,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    minHeight: 40,
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryDark,
    textAlign: 'center',
  },
});

export default LoginScreen;