// ==============================================================================
// LOGIN SCREEN — SAHAKARI SEVA (ANTTI-GRAVITY REDESIGN)
// Transparent glowing India map with live activity dots, "Bharat Works Together" badge,
// bilingual branding (सहकारी सेवा), segmented role toggle, OTP input, social logins,
// 1-click evaluation profiles, and "Scroll to explore" feature showcase with tricolor wave.
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
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ShieldCheck,
  User,
  Wrench,
  Shield,
  ArrowRight,
  Globe,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Users,
  Coins,
} from 'lucide-react-native';
import { LanguageModal } from '../../components/common/LanguageModal';
import ThemeToggle from '../../components/common/ThemeToggle';
import { IndiaMapOverlay } from '../../components/auth/IndiaMapOverlay';
import { useTheme } from '../../theme';

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
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  or: 'ଓଡ଼ିଆ',
  as: 'অসমীয়া',
  ur: 'اردو',
  bho: 'भोजपुरी',
};

// Official Google 'G' 4-color vector logo
const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </Svg>
);

// Official Apple vector icon
const AppleIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 170 170">
    <Path
      fill="#ffffff"
      d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.94-12.03-14.58-6.1-9.39-10.9-19.78-14.42-31.18-3.52-11.39-5.28-22.13-5.28-32.22 0-14.16 3.65-25.79 10.95-34.91 7.3-9.12 16.48-13.79 27.53-14.01 4.71 0 10.15 1.24 16.32 3.72 6.17 2.48 10.02 3.77 11.55 3.88 1.8 0 5.86-1.39 12.18-4.17 6.32-2.78 11.75-3.99 16.3-3.62 12.33.64 22.33 5.37 30 14.19-10.79 6.53-16.08 15.53-15.87 27 0 9.81 3.85 18.06 11.55 24.74 7.7 6.68 16.79 10.49 27.27 11.43-2.12 6.42-4.78 12.98-7.98 19.68zM119.22 31.84c0-7.19 2.61-13.98 7.83-20.37 5.22-6.39 11.83-10.47 19.82-12.24.21 1.7.32 3.18.32 4.45 0 7.08-2.69 13.91-8.07 20.49-5.38 6.58-12.1 10.74-20.16 12.48-.22-1.49-.33-2.82-.33-4.81z"
    />
  </Svg>
);

// Silhouette of Indian landmark monuments (India Gate, Red Fort, domes & minarets)
const SkylineSilhouette = () => (
  <Svg viewBox="0 0 400 50" width="100%" height={50} preserveAspectRatio="none">
    <Path
      d="M 0 50 L 0 38 L 12 38 L 12 32 L 18 32 L 18 24 L 22 24 L 22 32 L 28 32 L 28 38 L 40 38 L 40 30 L 46 30 L 46 22 L 48 18 L 50 22 L 50 30 L 56 30 L 56 38 L 75 38 L 75 33 L 80 33 L 80 26 L 85 22 L 90 26 L 90 33 L 95 33 L 95 38 L 120 38 L 120 28 L 125 28 L 125 18 L 128 13 L 131 18 L 131 28 L 135 28 L 135 38 L 155 38 L 155 32 L 160 32 L 160 22 L 165 22 L 165 14 L 170 10 L 175 14 L 175 22 L 180 22 L 180 32 L 185 32 L 185 38 L 215 38 L 215 32 L 220 32 L 220 22 L 225 22 L 225 14 L 230 10 L 235 14 L 235 22 L 240 22 L 240 32 L 245 32 L 245 38 L 265 38 L 265 28 L 270 28 L 270 18 L 273 13 L 276 18 L 276 28 L 280 28 L 280 38 L 305 38 L 305 33 L 310 33 L 310 26 L 315 22 L 320 26 L 320 33 L 325 33 L 325 38 L 344 38 L 344 30 L 350 30 L 350 22 L 352 18 L 354 22 L 354 30 L 360 30 L 360 38 L 372 38 L 372 32 L 378 32 L 378 24 L 382 24 L 382 32 L 388 32 L 388 38 L 400 38 L 400 50 Z"
      fill="#0c172e"
      opacity="0.75"
    />
  </Svg>
);

// Gentle Indian tricolor ribbon wave at base
const TricolorWave = () => (
  <Svg viewBox="0 0 400 22" width="100%" height={22} preserveAspectRatio="none">
    <Path
      d="M 0 0 C 110 12 210 -4 400 8 L 400 13 C 210 1 110 17 0 5 Z"
      fill="#FF9933"
      opacity="0.95"
    />
    <Path
      d="M 0 5 C 110 17 210 1 400 13 L 400 17 C 210 5 110 21 0 9 Z"
      fill="#FFFFFF"
      opacity="0.8"
    />
    <Path
      d="M 0 9 C 110 21 210 5 400 17 L 400 22 L 0 22 Z"
      fill="#138808"
      opacity="0.95"
    />
  </Svg>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'worker' | 'admin'>('customer');
  const [inputFocused, setInputFocused] = useState(false);

  // Soft bouncing down arrow animation for "Scroll to explore"
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const arrowNudgeAnim = useRef(new Animated.Value(0)).current;
  const logoPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Smooth vertical bounce for the scroll indicator
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 6,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    bounceLoop.start();

    // Subtle breathing nudge on the Send OTP arrow
    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowNudgeAnim, {
          toValue: 4,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(arrowNudgeAnim, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    arrowLoop.start();

    // Gentle logo breathing pulse
    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulseAnim, {
          toValue: 1.04,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(logoPulseAnim, {
          toValue: 1.0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    logoLoop.start();

    return () => {
      bounceLoop.stop();
      arrowLoop.stop();
      logoLoop.stop();
    };
  }, [bounceAnim, arrowNudgeAnim, logoPulseAnim]);

  const handlePhoneSubmit = () => {
    if (phoneNumber.length < 10) {
      Alert.alert(t('auth.invalid_phone_title'), t('auth.invalid_phone_msg'));
      return;
    }
    onSelectRole(selectedRole, {
      name:
        selectedRole === 'worker'
          ? 'Rajesh Sharma'
          : selectedRole === 'admin'
          ? 'Federation Admin'
          : 'Demo Customer',
      phone: phoneNumber,
      role: selectedRole,
    });
  };

  const handleQuickDemoLogin = (role: 'customer' | 'worker' | 'admin') => {
    if (role === 'customer') {
      onSelectRole('customer', {
        id: 'p0000000-0000-0000-0000-000000000002',
        name: 'Priya Singh',
        phone: '+91 98711 54321',
        city: 'Jaipur',
        role: 'customer',
      });
    } else if (role === 'worker') {
      onSelectRole('worker', {
        id: 'w0000000-0000-0000-0000-000000000001',
        name: 'Rajesh Sharma',
        trade: 'Electrician',
        phone: '+91 98110 55443',
        city: 'Jaipur',
        role: 'worker',
      });
    } else {
      onSelectRole('admin', {
        id: 'admin-demo',
        name: 'Cooperative Federation Officer',
        phone: '+91 98765 43219',
        role: 'admin',
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Deep dark gradient canvas */}
      <LinearGradient
        colors={['#050914', '#091226', '#0d1a36', '#070c18']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Transparent India Map with live red & green activity dots */}
      <IndiaMapOverlay style={[styles.mapOverlay, { top: insets.top + 10 }]} />

      {/* Top Header Bar */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.topHeaderLeft}>
          <ThemeToggle />
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.75}
          >
            <Globe size={13} color="#2dd4bf" />
            <Text style={styles.langPillText}>
              {NATIVE_SHORT[i18n.language] || 'English'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bharat Works Together badge with tricolor underline */}
        <View style={styles.bharatBadge}>
          <Text style={styles.bharatTitle}>Bharat</Text>
          <Text style={styles.bharatSub}>Works Together</Text>
          <View style={styles.tricolorPill}>
            <View style={[styles.tricolorBar, { backgroundColor: '#FF9933' }]} />
            <View style={[styles.tricolorBar, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.tricolorBar, { backgroundColor: '#138808' }]} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + 36 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Central Logo & Branding */}
        <View style={styles.brandCenter}>
          <Animated.View
            style={[
              styles.logoCircleGlow,
              { transform: [{ scale: logoPulseAnim }] },
            ]}
          >
            <View style={styles.logoCircleInner}>
              <Image
                source={require('../../../assets/logo-transparent.png')}
                style={styles.brandEmblemImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <Text style={styles.brandHeading}>Sahakari Seva</Text>
          <Text style={styles.brandHindiHeading}>सहकारी सेवा</Text>

          <Text style={styles.brandTagline}>
            India's First Worker-Owned Cooperative{'\n'}Platform for Urban & Household Gig Services
          </Text>
        </View>

        {/* Segmented Role Switcher: Customer vs Worker (with subtle Admin toggle) */}
        <View style={styles.rolePickerCard}>
          <View style={styles.segmentedToggle}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                selectedRole === 'customer' && styles.segmentBtnActive,
              ]}
              onPress={() => setSelectedRole('customer')}
              activeOpacity={0.85}
            >
              <User
                size={16}
                color={selectedRole === 'customer' ? '#ffffff' : '#94a3b8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  selectedRole === 'customer' && styles.segmentTextActive,
                ]}
              >
                {t('roles.customer') || 'Customer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                selectedRole === 'worker' && styles.segmentBtnActive,
              ]}
              onPress={() => setSelectedRole('worker')}
              activeOpacity={0.85}
            >
              <Wrench
                size={16}
                color={selectedRole === 'worker' ? '#ffffff' : '#94a3b8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  selectedRole === 'worker' && styles.segmentTextActive,
                ]}
              >
                {t('roles.worker') || 'Worker'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Admin switch for federation officers */}
          <TouchableOpacity
            style={[
              styles.adminPill,
              selectedRole === 'admin' && styles.adminPillActive,
            ]}
            onPress={() => setSelectedRole('admin')}
            activeOpacity={0.7}
          >
            <Shield
              size={12}
              color={selectedRole === 'admin' ? '#10b981' : '#64748b'}
            />
            <Text
              style={[
                styles.adminPillText,
                selectedRole === 'admin' && styles.adminPillTextActive,
              ]}
            >
              Federation Admin Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Phone Input Card */}
        <View
          style={[
            styles.phoneCard,
            inputFocused && styles.phoneCardFocused,
          ]}
        >
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeWrap}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>

            <View style={styles.inputDivider} />

            <TextInput
              style={styles.phoneTextInput}
              placeholder="Enter your mobile number"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </View>
        </View>

        {/* Emerald "Send OTP →" Action Button */}
        <TouchableOpacity
          style={styles.sendOtpBtnShadow}
          onPress={handlePhoneSubmit}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sendOtpBtn}
          >
            <Text style={styles.sendOtpBtnText}>Send OTP</Text>
            <Animated.View style={{ transform: [{ translateX: arrowNudgeAnim }] }}>
              <ArrowRight size={18} color="#ffffff" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>

        {/* "or continue with" Divider */}
        <View style={styles.orDividerRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or continue with</Text>
          <View style={styles.orLine} />
        </View>

        {/* Google & Apple Social Login Buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleQuickDemoLogin(selectedRole)}
            activeOpacity={0.8}
          >
            <GoogleIcon />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleQuickDemoLogin(selectedRole)}
            activeOpacity={0.8}
          >
            <AppleIcon />
            <Text style={styles.socialBtnText}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* 1-Click Instant Demo Evaluation Pills */}
        <View style={styles.demoSection}>
          <View style={styles.demoHeader}>
            <Sparkles size={13} color="#f59e0b" />
            <Text style={styles.demoHeaderText}>1-Click Instant Evaluation</Text>
          </View>

          <View style={styles.demoPillsRow}>
            <TouchableOpacity
              style={[styles.demoPill, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}
              onPress={() => handleQuickDemoLogin('customer')}
              activeOpacity={0.75}
            >
              <View style={[styles.demoDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.demoPillText}>Customer (Priya)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoPill, { borderColor: 'rgba(249, 115, 22, 0.4)' }]}
              onPress={() => handleQuickDemoLogin('worker')}
              activeOpacity={0.75}
            >
              <View style={[styles.demoDot, { backgroundColor: '#f97316' }]} />
              <Text style={styles.demoPillText}>Worker (Rajesh)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoPill, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}
              onPress={() => handleQuickDemoLogin('admin')}
              activeOpacity={0.75}
            >
              <View style={[styles.demoDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.demoPillText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms of Service & Privacy Policy */}
        <View style={styles.legalRow}>
          <Text style={styles.legalText}>By continuing, you agree to our </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'Sahakari Seva is a registered multi-state cooperative federation providing ethical urban gig services.')}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}> and </Text>
            <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Your data is secured under cooperative data privacy principles.')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* "Scroll to explore" Bounce Section */}
        <View style={styles.scrollIndicatorWrap}>
          <Text style={styles.scrollIndicatorText}>Scroll to explore</Text>
          <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
            <ChevronDown size={18} color="#94a3b8" />
          </Animated.View>
        </View>

        {/* Bottom Revealed Section: 3 Feature Highlight Cards */}
        <View style={styles.featureShowcase}>
          {/* Feature 1: Verified Workers */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
              <ShieldCheck size={22} color="#10b981" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Verified Workers</Text>
              <Text style={styles.featureTagline}>Trusted. Skilled. Reliable.</Text>
              <Text style={styles.featureDesc}>
                Aadhaar verified, background-checked, and trade-certified local professionals.
              </Text>
            </View>
          </View>

          {/* Feature 2: Fair Earnings */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
              <Coins size={22} color="#f59e0b" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Fair Earnings</Text>
              <Text style={styles.featureTagline}>Empowering Workers.</Text>
              <Text style={styles.featureDesc}>
                Workers retain 95% of customer payments. Zero predatory commission fees.
              </Text>
            </View>
          </View>

          {/* Feature 3: Stronger Communities */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.14)' }]}>
              <Users size={22} color="#38bdf8" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Stronger Communities</Text>
              <Text style={styles.featureTagline}>Building a Better India.</Text>
              <Text style={styles.featureDesc}>
                Worker-owned multi-state cooperative fostering dignity, healthcare, and pensions.
              </Text>
            </View>
          </View>
        </View>

        {/* Indian Landmark Skyline Silhouette */}
        <View style={styles.skylineWrap}>
          <SkylineSilhouette />
        </View>

        {/* Tricolor Bottom Wave & Slogan Footer */}
        <View style={styles.footerWrap}>
          <TricolorWave />
          <View style={styles.footerContent}>
            <Text style={styles.footerSlogan}>
              Seva  •  Samman  •  Samriddhi
            </Text>
            <Text style={styles.footerHindi}>
              सेवा • सम्मान • समृद्धि
            </Text>
            <Text style={styles.footerMinistry}>
              🏛️ Ministry of Cooperation Recognized Cooperative Model
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Multilingual Selector Modal */}
      <LanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#060a14',
  },
  mapOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 410,
    opacity: 0.95,
  },
  scrollContainer: {
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  // --- Top Header ---
  topHeader: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  bharatBadge: {
    alignItems: 'flex-end',
  },
  bharatTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  bharatSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: -1,
  },
  tricolorPill: {
    flexDirection: 'row',
    width: 32,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  tricolorBar: {
    flex: 1,
    height: '100%',
  },
  // --- Brand Center ---
  brandCenter: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 20,
  },
  logoCircleGlow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 14,
  },
  logoCircleInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(10, 20, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  brandEmblemImage: {
    width: 52,
    height: 52,
  },
  brandHeading: {
    fontSize: 27,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  brandHindiHeading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 310,
  },
  // --- Role Picker Card ---
  rolePickerCard: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 14,
    alignItems: 'center',
  },
  segmentedToggle: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  adminPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  adminPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  adminPillTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  // --- Phone Card ---
  phoneCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(11, 18, 34, 0.88)',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
  },
  phoneCardFocused: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  countryCodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginHorizontal: 12,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#ffffff',
    paddingVertical: 0,
  },
  // --- Send OTP Button ---
  sendOtpBtnShadow: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  sendOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
  },
  sendOtpBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  // --- Social Logins ---
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginVertical: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  orText: {
    fontSize: 12,
    color: '#64748b',
    paddingHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 360,
    gap: 12,
    marginBottom: 16,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  socialBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#f8fafc',
  },
  // --- Demo Profiles ---
  demoSection: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  // --- Legal Notice ---
  legalRow: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
  },
  legalLink: {
    fontSize: 11.5,
    color: '#2dd4bf',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // --- Scroll Indicator ---
  scrollIndicatorWrap: {
    alignItems: 'center',
    gap: 4,
    marginVertical: 14,
  },
  scrollIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    letterSpacing: 0.2,
  },
  // --- Features Section ---
  featureShowcase: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
    marginTop: 10,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  featureTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2dd4bf',
    marginVertical: 2,
  },
  featureDesc: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 16,
  },
  // --- Skyline & Footer ---
  skylineWrap: {
    width: '100%',
    marginTop: 10,
    marginBottom: -6,
  },
  footerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  footerContent: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  footerSlogan: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.8,
  },
  footerHindi: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 2,
  },
  footerMinistry: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default LoginScreen;