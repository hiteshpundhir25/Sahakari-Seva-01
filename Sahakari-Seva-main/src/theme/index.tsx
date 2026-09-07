// mobile/src/theme/index.ts
// Sahakari Seva Unified Design System Tokens — Light & Dark Themes
// Palette: "Ivory & Royal Indigo" (light) / "Midnight Indigo" (dark)

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// -----------------------------------------------------------------------------
// PALETTES
// -----------------------------------------------------------------------------

export interface Palette {
  primary: string;
  primaryLight: string;
  primaryDark: string;

  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  background: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  borderFocus: string;

  topPanel: string;
  topPanelBorder: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  danger: string;
  dangerLight: string;
  dangerDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  violet: string;
  violetLight: string;
  violetDark: string;

  star: string;
}

// LIGHT — Ivory canvas, Royal Indigo, Antique Gold
export const lightColors: Palette = {
  primary: '#4f46e5',        // Royal Indigo
  primaryLight: '#e0e7ff',   // Soft Indigo Tint
  primaryDark: '#4338ca',    // Deep Royal Indigo

  secondary: '#a16207',      // Antique Gold
  secondaryLight: '#fef3c7', // Soft Gold Tint
  secondaryDark: '#854d0e',  // Deep Bronze Gold

  background: '#faf7f2',     // Warm Ivory canvas
  surface: '#ffffff',        // Pure white cards
  surfaceSubtle: '#f4efe6',  // Warm sand containers
  border: '#e7dfd2',         // Taupe dividers
  borderFocus: '#4f46e5',
  topPanel: '#ffffff',       // Top panel canvas in light mode
  topPanelBorder: '#e7dfd2', // Taupe dividers

  textPrimary: '#1c1917',    // Warm stone ink
  textSecondary: '#57534e',  // Muted warm gray
  textMuted: '#a8a29e',      // Fine captions
  textInverse: '#ffffff',

  success: '#059669',
  successLight: '#d1fae5',
  successDark: '#065f46',
  warning: '#d97706',
  warningLight: '#fef3c7',
  warningDark: '#92400e',
  danger: '#e11d48',
  dangerLight: '#ffe4e6',
  dangerDark: '#9f1239',
  info: '#0369a1',
  infoLight: '#e0f2fe',
  infoDark: '#075985',
  violet: '#7c3aed',
  violetLight: '#f3e8ff',
  violetDark: '#5b21b6',

  star: '#f59e0b',
};

// DARK — Midnight Indigo with luminous accents
export const darkColors: Palette = {
  primary: '#a5b4fc',        // Luminous Indigo
  primaryLight: '#312e81',   // Indigo fill (dark tint)
  primaryDark: '#c7d2fe',    // Pale indigo text-on-fill

  secondary: '#fbbf24',      // Champagne Gold
  secondaryLight: '#451a03', // Deep amber fill
  secondaryDark: '#fcd34d',  // Pale gold text-on-fill

  background: '#0c101f',     // Deep midnight navy
  surface: '#151b2e',        // Card surface
  surfaceSubtle: '#1d2438',  // Raised containers
  border: '#2b3452',         // Muted indigo dividers
  borderFocus: '#a5b4fc',
  topPanel: '#0f172a',       // Deep midnight slate
  topPanelBorder: '#1e293b', // Muted dark dividers

  textPrimary: '#eef1f9',    // Near-white ink
  textSecondary: '#a9b1c9',  // Soft slate
  textMuted: '#6e7690',      // Dim captions
  textInverse: '#0c101f',

  success: '#34d399',
  successLight: '#064e3b',
  successDark: '#6ee7b7',
  warning: '#fbbf24',
  warningLight: '#451a03',
  warningDark: '#fcd34d',
  danger: '#fb7185',
  dangerLight: '#4c0519',
  dangerDark: '#fda4af',
  info: '#38bdf8',
  infoLight: '#0c4a6e',
  infoDark: '#7dd3fc',
  violet: '#a78bfa',
  violetLight: '#2e1065',
  violetDark: '#c4b5fd',

  star: '#fbbf24',
};

// -----------------------------------------------------------------------------
// FIXED TOKENS
// -----------------------------------------------------------------------------

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const makeTypography = (colors: Palette) => ({
  fontDisplay: { fontSize: 26, fontWeight: '700' as const, color: colors.textPrimary },
  fontHeadline: { fontSize: 21, fontWeight: '700' as const, color: colors.textPrimary },
  fontTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.textPrimary },
  fontSubtitle: { fontSize: 14, fontWeight: '600' as const, color: colors.textPrimary },
  fontBody: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  fontBodySm: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
  fontCaption: { fontSize: 10, fontWeight: '500' as const, color: colors.textMuted },
});

export const makeShadows = (colors: Palette) => ({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  floating: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

// -----------------------------------------------------------------------------
// THEME CONTEXT — glitch-free animated switching
// -----------------------------------------------------------------------------

const STORAGE_KEY = 'sahakari_theme_v1';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  colors: Palette;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  mode: 'light',
  toggleTheme: () => {},
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );
  const [hydrated, setHydrated] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const switchingRef = useRef(false);
  const targetRef = useRef<ThemeMode>(mode);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Restore the user's saved preference (defaults to system appearance)
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!active) return;
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      })
      .catch(() => {})
      .finally(() => active && setHydrated(true));
    return () => {
      active = false;
    };
  }, []);

  const isDark = mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const commitMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  // Smooth cross-fade: fade in the branded overlay, swap the palette in a
  // single render pass behind it, then fade out — no visible color jump.
  // State transitions are timer-driven (not animation-callback-driven) so the
  // overlay can never get stuck intercepting touches if a frame callback is
  // throttled or dropped — the animation still provides the smooth fade.
  const switchMode = (next: ThemeMode) => {
    if (switchingRef.current || next === mode) return;
    switchingRef.current = true;
    setOverlayActive(true);
    targetRef.current = next;
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // Swap the palette underneath the overlay after the fade-in window,
    // regardless of whether the animation callback fired.
    setTimeout(() => {
      commitMode(next);
      setTimeout(() => {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }).start();
        // Unlock pointer events once the fade-out window has elapsed.
        setTimeout(() => {
          switchingRef.current = false;
          setOverlayActive(false);
        }, 340);
      }, 60);
    }, 170);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      isDark,
      mode,
      toggleTheme: () => switchMode(isDark ? 'light' : 'dark'),
      setMode: switchMode,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors, isDark, mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}

      {/* Animated theme-switch overlay */}
      <Animated.View
        pointerEvents={overlayActive ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <View style={[styles.overlayBand, { backgroundColor: '#312e81' }]} />
        <View style={[styles.overlayBand, { backgroundColor: '#4f46e5' }]} />
        <View style={styles.overlayContent}>
          <View style={styles.overlayIconWrap}>
            {targetRef.current === 'dark' ? (
              <Ionicons name="moon" size={40} color={lightColors.primaryLight} />
            ) : (
              <Ionicons name="sunny" size={40} color={lightColors.secondary} />
            )}
          </View>
          <Text style={styles.overlayBrand}>Sahakari Seva</Text>
          <Text style={styles.overlayTagline}>
            {targetRef.current === 'dark' ? 'Dark Theme' : 'Light Theme'}
          </Text>
          <ActivityIndicator
            size="small"
            color={isDark ? darkColors.primary : lightColors.primaryLight}
            style={{ marginTop: 10 }}
          />
        </View>
      </Animated.View>
    </ThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 99,
  },
  overlayBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  },
  overlayBrand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  overlayTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    letterSpacing: 1.2,
  },
});

export default {
  lightColors,
  darkColors,
  spacing,
  radii,
  makeTypography,
  makeShadows,
  ThemeProvider,
  useTheme,
};