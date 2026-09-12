// mobile/src/components/common/Header.tsx
// ==============================================================================
// MOBILE HEADER — BRANDING, NOTIFICATIONS & UPPER-RIGHT PROFILE DROPDOWN MENU
// The profile icon in the upper right corner opens an all-in-one popover menu
// containing: User Profile Navigation, Dark/Light Mode Toggle, Language Switcher,
// and Role Switch / Logout.
// ==============================================================================

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {
  Building2,
  ArrowLeft,
  User,
  Shield,
  Globe,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import NotificationBar from './NotificationBar';
import LanguageModal from './LanguageModal';
import ThemeToggle from './ThemeToggle';
import { useRole } from '../../context/RoleContext';
import { AuthContext, rootNavigationRef } from '../../navigation/RootNavigator';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onPressLanguage?: () => void;
  onPressNotifications?: () => void;
  showBack?: boolean;
  onBack?: () => void;
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
  showBack,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { role } = useRole();
  const { logout } = useContext(AuthContext);

  const [menuVisible, setMenuVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const getUserMeta = () => {
    if (role === 'worker') {
      return {
        name: 'Rajesh Sharma',
        roleBadge: t('roles.worker'),
        subTitle: 'WRK-JPR-0101 · Electrician',
        initials: 'RS',
        avatarBg: colors.primaryDark,
      };
    }
    if (role === 'admin') {
      return {
        name: 'Dr. Vikramaditya Rathore',
        roleBadge: t('roles.admin'),
        subTitle: 'SEC-RAJ-COOP-001 · Chief Registrar',
        initials: 'VR',
        avatarBg: '#0f172a',
      };
    }
    return {
      name: 'Priya Singh',
      roleBadge: t('roles.customer'),
      subTitle: 'COP-CUS-2026-8842 · Citizen Patron',
      initials: 'PS',
      avatarBg: colors.primary,
    };
  };

  const userMeta = getUserMeta();

  const handleOpenProfile = () => {
    setMenuVisible(false);
    if (!rootNavigationRef.isReady()) return;
    try {
      if (role === 'customer') {
        rootNavigationRef.navigate('CustomerProfile');
      } else if (role === 'worker') {
        rootNavigationRef.navigate('WorkerProfile');
      } else if (role === 'admin') {
        rootNavigationRef.navigate('AdminProfile');
      }
    } catch (e) {
      console.warn('Navigation to profile error:', e);
    }
  };

  const handleOpenLanguage = () => {
    setMenuVisible(false);
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
    <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top + 6 : 8 }]}>
      <View style={styles.brandRow}>
        <View style={styles.logoRow}>
          {showBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t('common.back', 'Back')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={17} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={styles.logoBadge}>
            <Building2 size={16} color={colors.textInverse} />
          </View>
          <View style={styles.brandTextWrap}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.brandName} numberOfLines={1} ellipsizeMode="tail">
                {title || t('app_name')}
              </Text>
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
          {/* Role-aware Notification Bell */}
          <NotificationBar />

          {/* Profile Icon in Upper Right Corner */}
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setMenuVisible(!menuVisible)}
            accessibilityRole="button"
            accessibilityLabel="Profile and Settings Menu"
            activeOpacity={0.75}
          >
            <View style={[styles.profileAvatar, { backgroundColor: userMeta.avatarBg }]}>
              {role === 'admin' ? (
                <Shield size={14} color="#ffffff" />
              ) : (
                <Text style={styles.profileAvatarText}>{userMeta.initials}</Text>
              )}
            </View>
            <View style={styles.activeDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Drop-down Popover Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.dropdownBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable
            style={[styles.dropdownMenu, { top: insets.top > 0 ? insets.top + 48 : 50 }]}
            onPress={e => e.stopPropagation()}
          >
            {/* User Identity Card in Menu */}
            <TouchableOpacity
              style={styles.dropdownProfileHeader}
              onPress={handleOpenProfile}
              activeOpacity={0.75}
            >
              <View style={[styles.dropdownAvatarLarge, { backgroundColor: userMeta.avatarBg }]}>
                {role === 'admin' ? (
                  <Shield size={18} color="#ffffff" />
                ) : (
                  <Text style={styles.dropdownAvatarLargeText}>{userMeta.initials}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownUserName} numberOfLines={1}>
                  {userMeta.name}
                </Text>
                <View style={styles.rolePillWrap}>
                  <Text style={styles.rolePillText}>{userMeta.roleBadge}</Text>
                </View>
                <Text style={styles.dropdownUserSub} numberOfLines={1}>
                  {userMeta.subTitle}
                </Text>
              </View>
              <ChevronRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Profile Button */}
            <TouchableOpacity
              style={styles.dropdownItemBtn}
              onPress={handleOpenProfile}
              activeOpacity={0.75}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: colors.primaryLight }]}>
                <User size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{t('tabs.profile')}</Text>
                <Text style={styles.itemSubtitle}>{t('customerProfile.subtitle')}</Text>
              </View>
              <ChevronRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            {/* Dark Mode Toggle */}
            <View style={styles.dropdownRowItem}>
              <View style={[styles.itemIconWrap, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={{ fontSize: 13 }}>{isDark ? '🌙' : '☀️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{t('customerProfile.theme_label')}</Text>
                <Text style={styles.itemSubtitle}>
                  {isDark ? 'Dark Mode (Night)' : 'Light Mode (Day)'}
                </Text>
              </View>
              <ThemeToggle />
            </View>

            <View style={styles.dropdownDivider} />

            {/* Language Switch */}
            <TouchableOpacity
              style={styles.dropdownItemBtn}
              onPress={handleOpenLanguage}
              activeOpacity={0.75}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Globe size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{t('customerProfile.language_label')}</Text>
                <Text style={styles.itemSubtitle}>{t(`lang.${i18n.language || 'en'}`)}</Text>
              </View>
              <View style={styles.langPillBadge}>
                <Text style={styles.langPillBadgeText}>
                  {NATIVE_SHORT[i18n.language] || 'EN'}
                </Text>
                <ChevronRight size={12} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            {/* Role Switch / Log Out */}
            <TouchableOpacity
              style={styles.dropdownLogoutBtn}
              onPress={() => {
                setMenuVisible(false);
                logout();
              }}
              activeOpacity={0.75}
            >
              <LogOut size={14} color={colors.danger} />
              <Text style={styles.dropdownLogoutText}>{t('auth.switch_role')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language Selector Modal */}
      <LanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.topPanel,
      paddingHorizontal: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.topPanelBorder,
      width: '100%',
      zIndex: 100,
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
    backBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 2,
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
      gap: 8,
      flexShrink: 0,
    },
    profileBtn: {
      position: 'relative',
      padding: 2,
    },
    profileAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    profileAvatarText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ffffff',
    },
    activeDot: {
      position: 'absolute',
      bottom: 1,
      right: 1,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: '#10b981',
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    dropdownBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    dropdownMenu: {
      position: 'absolute',
      right: 12,
      width: 280,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.45 : 0.18,
      shadowRadius: 20,
      elevation: 14,
    },
    dropdownProfileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surfaceSubtle,
      padding: 10,
      borderRadius: 12,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownAvatarLarge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#ffffff',
    },
    dropdownAvatarLargeText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#ffffff',
    },
    dropdownUserName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    rolePillWrap: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
      marginTop: 2,
    },
    rolePillText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.primary,
    },
    dropdownUserSub: {
      fontSize: 9,
      color: colors.textSecondary,
      marginTop: 2,
    },
    dropdownItemBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 8,
    },
    dropdownRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    itemIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    itemSubtitle: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 0.5,
    },
    langPillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    langPillBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.primary,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    dropdownLogoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 8,
      marginTop: 2,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
    },
    dropdownLogoutText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.danger,
    },
  });

export default Header;