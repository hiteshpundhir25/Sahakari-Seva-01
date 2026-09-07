// ==============================================================================
// LANGUAGE SWITCH PROVIDER — Glitch-free whole-app language switching
//
// Changing the i18next language swaps every string on screen in a single
// render pass. To make that swap look intentional and classy instead of a
// jarring text jump, we briefly cross-fade a branded overlay over the app:
//
//   1. Overlay fades in (≈140ms)  →  old language is hidden
//   2. i18n.changeLanguage(...)   →  every screen re-renders in the new language
//   3. Overlay fades out (≈260ms) →  the new language is revealed seamlessly
//
// Call `switchLanguage(lng)` from anywhere via useLanguageSwitch().
// ==============================================================================

import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';
import i18n from '../i18n';
import { SupportedLanguage } from '../i18n';
import { useTheme } from '../theme';

interface LanguageSwitchContextValue {
  switchLanguage: (lng: SupportedLanguage) => void;
}

const LanguageSwitchContext = createContext<LanguageSwitchContextValue>({
  switchLanguage: () => {},
});

export const useLanguageSwitch = () => useContext(LanguageSwitchContext);

export const LanguageSwitchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const [switching, setSwitching] = useState(false);

  const switchLanguage = (lng: SupportedLanguage) => {
    if (switching || lng === i18n.language) return;
    setSwitching(true);

    Animated.timing(opacity, {
      toValue: 1,
      duration: 140,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // Swap the language underneath the overlay — every screen re-renders
    // simultaneously while the app is fully covered, so no text jumps are
    // ever visible. The state machine is timer-driven so the overlay can
    // never get stuck blocking touches if an animation callback is dropped.
    setTimeout(() => {
      i18n.changeLanguage(lng);
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
        setTimeout(() => setSwitching(false), 300);
      }, 60);
    }, 160);
  };

  return (
    <LanguageSwitchContext.Provider value={{ switchLanguage }}>
      {children}

      {/* Full-screen cross-fade overlay */}
      <Animated.View
        pointerEvents={switching ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, styles.overlayWrap, { opacity }]}
      >
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, colors.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.brandCircle, { backgroundColor: colors.surface }]}>
          <ShieldCheck size={34} color={colors.primary} />
        </View>
        <Text style={[styles.brandName, { color: isDark ? '#0c101f' : '#ffffff' }]}>
          {i18n.t('app_name')}
        </Text>
        <Text style={[styles.brandSub, { color: isDark ? 'rgba(12,16,31,0.7)' : 'rgba(255,255,255,0.9)' }]}>
          {i18n.t('app_tagline')}
        </Text>
        <ActivityIndicator
          color={isDark ? '#0c101f' : '#ffffff'}
          style={styles.spinner}
        />
      </Animated.View>
    </LanguageSwitchContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlayWrap: {
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  brandName: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  spinner: {
    marginTop: 22,
  },
});

export default LanguageSwitchProvider;