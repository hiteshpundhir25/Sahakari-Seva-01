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
  Platform,
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
  const styles = createStyles(colors, isDark);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'worker' | 'admin'>('customer');
  const [focused, setFocused] = useState(false);

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    floatLoop.start();

    // Slow, stately rotation for subtle Ashoka Chakra / Mandala motif
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    spinLoop.start();

    // Subtle breathing nudge for the OTP continue arrow
    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 4.5,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    arrowLoop.start();

    return () => {
      floatLoop.stop();
      spinLoop.stop();
      arrowLoop.stop();
    };
  }, [floatAnim, spinAnim, arrowAnim]);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const roleThemes: Record<
    'customer' | 'worker' | 'admin',
    {
      gradient: [string, string];
      activeBorder: string;
      shadowColor: string;
      inactiveIconBg: string;
      inactiveIconColor: string;
    }
  > = {
    customer: {
      gradient: ['#3b82f6', '#1d4ed8'],
      activeBorder: '#2563eb',
      shadowColor: '#2563eb',
      inactiveIconBg: isDark ? 'rgba(59, 130, 246, 0.16)' : '#eff6ff',
      inactiveIconColor: '#2563eb',
    },
    worker: {
      gradient: ['#f97316', '#ea580c'],
      activeBorder: '#ea580c',
      shadowColor: '#ea580c',
      inactiveIconBg: isDark ? 'rgba(249, 115, 22, 0.16)' : '#fff7ed',
      inactiveIconColor: '#ea580c',
    },
    admin: {
      gradient: ['#10b981', '#047857'],
      activeBorder: '#059669',
      shadowColor: '#059669',
      inactiveIconBg: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5',
      inactiveIconColor: '#059669',
    },
  };

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
          <View style={styles.heroCardShadow}>
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
              {/* Indian Tiranga Ribbon Accent Strip */}
              <View style={styles.tricolorRibbon}>
                <View style={[styles.tricolorSegment, { backgroundColor: '#FF9933' }]} />
                <View style={[styles.tricolorSegment, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.tricolorSegment, { backgroundColor: '#138808' }]} />
              </View>

              {/* Decorative floating orbs */}
              <Animated.View style={[styles.orb, styles.orbA, { transform: [{ translateY: floatY }] }]} />
              <Animated.View style={[styles.orb, styles.orbB, { transform: [{ translateY: Animated.multiply(floatY, -1.4) }] }]} />
              <View style={styles.orbC} />

              {/* Central Emblem with slow-rotating Ashoka Chakra / Mandala ring */}
              <View style={styles.emblemContainer}>
                <Animated.View style={[styles.mandalaRing, { transform: [{ rotate: spin }] }]}>
                  <View style={styles.mandalaInnerDotted} />
                </Animated.View>
                <PulseView scaleTo={1.04} duration={2200}>
                  <View style={styles.heroMonogram}>
                    <ShieldCheck size={32} color="#ffffff" />
                  </View>
                </PulseView>
              </View>

              <Text style={styles.heroTitle}>{t('app_name')}</Text>

              {/* Dignified Indian Cooperative Motto */}
              <View style={styles.mottoRow}>
                <Text style={styles.mottoText}>सहकार से समृद्धि • Sahakar Se Samriddhi</Text>
              </View>

              <Text style={styles.heroSub}>{t('auth.hero_subtitle')}</Text>

              <View style={styles.ministryPill}>
                <CheckCircle2 size={13} color="#fef08a" />
                <Text style={styles.ministryText}>{t('auth.ministry_pill')}</Text>
              </View>
            </LinearGradient>
          </View>
        </FadeInView>

        {/* Role Selector — segmented chips with round corners */}
        <FadeInView delay={140} distance={14} duration={360}>
          <Text style={styles.sectionLabel}>{t('auth.role_label')}</Text>
        </FadeInView>

        <View style={styles.roleRow}>
          {roles.map((role, idx) => {
            const isActive = selectedRole === role.key;
            const theme = roleThemes[role.key];
            return (
              <FadeInView key={role.key} delay={180 + idx * 80} distance={12} duration={340} style={styles.roleFlex}>
                <ScalePressable
                  onPress={() => setSelectedRole(role.key)}
                  scaleTo={0.96}
                  style={[
                    styles.roleCardPressable,
                    isActive && {
                      shadowColor: theme.shadowColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.roleCardWrapper,
                      isActive
                        ? { borderColor: theme.activeBorder, borderWidth: 1.6 }
                        : { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.border, borderWidth: 1.5 },
                    ]}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={theme.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.roleChipContent}
                      >
                        <View style={[styles.roleChipIcon, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                          {React.cloneElement(role.icon as any, { color: '#ffffff' })}
                        </View>
                        <View style={styles.roleTitleWrap}>
                          <Text style={styles.roleChipTitle} numberOfLines={2}>
                            {t(`roles.${role.key}`)}
                          </Text>
                        </View>
                        <View style={styles.roleDescWrap}>
                          <Text style={styles.roleChipDesc} numberOfLines={2}>
                            {roleDescs[role.key]}
                          </Text>
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.roleChipContent, { backgroundColor: colors.surface }]}>
                        <View style={[styles.roleChipIcon, { backgroundColor: theme.inactiveIconBg }]}>
                          {React.cloneElement(role.icon as any, { color: theme.inactiveIconColor })}
                        </View>
                        <View style={styles.roleTitleWrap}>
                          <Text style={[styles.roleChipTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                            {t(`roles.${role.key}`)}
                          </Text>
                        </View>
                        <View style={styles.roleDescWrap}>
                          <Text style={[styles.roleChipDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {roleDescs[role.key]}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
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
              <View style={styles.countryCodeBadge}>
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.countryCode}>+91</Text>
              </View>
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
                <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
                  <ArrowRight size={17} color={colors.textInverse} />
                </Animated.View>
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
                <View style={[styles.demoBtn, { borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : '#bfdbfe' }]}>
                  <View style={[styles.demoDot, { backgroundColor: '#2563eb' }]} />
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
                <View style={[styles.demoBtn, { borderColor: isDark ? 'rgba(249, 115, 22, 0.35)' : '#fed7aa' }]}>
                  <View style={[styles.demoDot, { backgroundColor: '#ea580c' }]} />
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
                <View style={[styles.demoBtn, { borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#bbf7d0' }]}>
                  <View style={[styles.demoDot, { backgroundColor: '#059669' }]} />
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

            {/* Subtle Cooperative Trust Badge */}
            <View style={styles.trustFooterRow}>
              <Text style={styles.trustFooterText}>
                🏛️ Regd. Multi-State Cooperative • 100% Fair Wage • Zero Middlemen
              </Text>
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

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
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
  heroCardShadow: {
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 22,
  },
  hero: {
    borderRadius: 24,
    paddingTop: 26,
    paddingBottom: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  tricolorRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
    flexDirection: 'row',
  },
  tricolorSegment: {
    flex: 1,
    height: '100%',
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
  emblemContainer: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  mandalaRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: 'rgba(253, 224, 71, 0.45)', // subtle warm gold
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandalaInnerDotted: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderStyle: 'dotted',
  },
  heroMonogram: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  mottoRow: {
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  mottoText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#fef08a',
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
    marginTop: 12,
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
  roleCardPressable: {
    borderRadius: 16,
  },
  roleCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  roleChipContent: {
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
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flagEmoji: {
    fontSize: 15,
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
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    minHeight: 40,
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryDark,
    textAlign: 'center',
  },
  trustFooterRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
  },
  trustFooterText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default LoginScreen;