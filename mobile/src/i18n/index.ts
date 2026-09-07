// ==============================================================================
// MOBILE I18N INITIALIZATION — 8 LOCALES (ENGLISH + 7 INDIAN LANGUAGES)
// Language is persisted and restored instantly on next launch.
// ==============================================================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import hi from './hi.json';
import bn from './bn.json';
import ta from './ta.json';
import te from './te.json';
import mr from './mr.json';
import gu from './gu.json';
import kn from './kn.json';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'sahakari_seva_language';

// -----------------------------------------------------------------------------
// Persistence helpers (AsyncStorage — bundled inside Expo Go, no native build)
// -----------------------------------------------------------------------------
export async function loadSavedLanguage(): Promise<SupportedLanguage | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      return saved as SupportedLanguage;
    }
  } catch (err) {
    // Storage unavailable (rare) — fall back to default language
  }
  return null;
}

export async function saveLanguage(lng: string) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lng);
  } catch (err) {
    // Non-fatal: language simply won't persist across restarts
  }
}

// -----------------------------------------------------------------------------
// Trade-name helper — maps backend English trade names to localized strings
// -----------------------------------------------------------------------------
const TRADE_KEY_MAP: Record<string, string> = {
  Electrical: 'trades.electrical',
  Plumbing: 'trades.plumbing',
  Carpentry: 'trades.carpentry',
  Painting: 'trades.painting',
  'Cleaning & Sanitization': 'trades.cleaning',
  'Gardening & Landscaping': 'trades.gardening',
  'Appliance Repair': 'trades.appliance',
  'AC Repair & Servicing': 'trades.ac',
  'Driver Services': 'trades.driver',
  'Caregiving & Nursing': 'trades.caregiving'
};

/** Returns the localized trade name for a backend English trade name. */
export function translateTrade(name?: string | null): string {
  if (!name) return '';
  const key = TRADE_KEY_MAP[name.trim()];
  if (!key) return name;
  return i18n.t(key);
}

// -----------------------------------------------------------------------------
// Bootstrap — register resources first, then hydrate the saved language
// -----------------------------------------------------------------------------
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      bn: { translation: bn },
      ta: { translation: ta },
      te: { translation: te },
      mr: { translation: mr },
      gu: { translation: gu },
      kn: { translation: kn }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Restore the user's previously selected language (fire-and-forget, resolves
// before first paint in virtually all cases because it is a tiny local read).
loadSavedLanguage().then((saved) => {
  if (saved && saved !== i18n.language) {
    i18n.changeLanguage(saved);
  }
});

// Persist any future change so the choice survives app restarts.
i18n.on('languageChanged', (lng) => {
  saveLanguage(lng);
});

export default i18n;