// mobile/src/components/common/Header.tsx
// ==============================================================================
// MOBILE HEADER — BRANDING, FEDERATION BADGE, NOTIFICATION BELL & LANGUAGE
// The language chip shows the current language's native name and opens the
// full 8-language selector.
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Globe, Building2, Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import NotificationBar from './NotificationBar';
import LanguageModal from './LanguageModal';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onPressLanguage?: () => void;
  onPressNotifications?: () => void;
}

// Native short names shown on the language chip
const NATIVE_SHORT: Record<string, string> = {
  en: 'EN',
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

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onPressLanguage,
  onPressNotifications,
}) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const handleLanguageToggle = () => {
    setLangModalVisible(true);
    if (onPressLanguage) {
      try {
        onPressLanguage();
      } catch (err) {
        console.warn('onPressLanguage error:', err);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Building2 size={16} color={colors.textInverse} />
          </View>
          <View style={styles.brandTextWrap}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.brandName} numberOfLines={1} ellipsizeMode="tail">{title || t('app_name')}</Text>
              <View style={styles.coopTag}>
                <Text style={styles.coopTagText}>CO-OP</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {subtitle || t('auth.brand_subtitle')}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Role-aware Notification Bar with pop-up panel */}
          <NotificationBar />

          {/* Language Selector */}
          <TouchableOpacity
            style={styles.langBtn}
            onPress={handleLanguageToggle}
            accessibilityLabel={t('common.language')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Globe size={14} color={colors.primary} />
            <Text style={styles.langBtnText}>
              {NATIVE_SHORT[i18n.language] || 'EN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* In-App Modals */}
      <LanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    backgroundColor: colors.topPanel,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.topPanelBorder,
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
    minWidth: 0,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  brandTextWrap: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  brandName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  coopTag: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
    flexShrink: 0,
  },
  coopTagText: {
    fontSize: 7,
    fontWeight: '800',
    color: colors.secondaryDark,
  },
  brandSubtitle: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 34,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});

export default Header;