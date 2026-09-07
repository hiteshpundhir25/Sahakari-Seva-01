// ==============================================================================
// ROLE-AWARE NOTIFICATION BAR — spring pop-up panel per role
// Customer / worker / admin each receive their own notification feed with a
// smooth spring "pop" animation when the bell is pressed. The feed itself is
// owned by RoleContext so the unread badge is correct immediately and stays
// in sync across every screen.
//
// The panel is rendered inside a transparent React Native Modal, so it always
// floats ABOVE every screen (tab bars, maps, scroll views) on both native and
// web — it can never be painted behind or clipped by an ancestor.
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Easing,
  Pressable,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell, CalendarCheck, Wallet, HeartHandshake, Zap, ShieldCheck, TrendingUp, CheckCheck, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useRole } from '../../context/RoleContext';

function timeAgo(iso: string, t: (k: string, opts?: any) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.just_now');
  if (mins < 60) return t('notifications.minutes_ago', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications.hours_ago', { count: hours });
  return t('notifications.days_ago', { count: Math.floor(hours / 24) });
}

function typeIcon(type: string, colors: Palette, size = 18) {
  switch (type) {
    case 'payment': return <Wallet size={size} color={colors.successDark} />;
    case 'welfare': return <HeartHandshake size={size} color={colors.secondaryDark} />;
    case 'emergency': return <Zap size={size} color={colors.danger} />;
    case 'forecast': return <TrendingUp size={size} color={colors.violetDark} />;
    case 'admin': return <ShieldCheck size={size} color={colors.infoDark} />;
    default: return <CalendarCheck size={size} color={colors.primaryDark} />;
  }
}

function typeTint(type: string, colors: Palette): string {
  switch (type) {
    case 'payment': return colors.successLight;
    case 'welfare': return colors.secondaryLight;
    case 'emergency': return colors.dangerLight;
    case 'forecast': return colors.violetLight;
    case 'admin': return colors.infoLight;
    default: return colors.primaryLight;
  }
}

export const NotificationBar: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { role, notifications, unreadCount, markRead, markAllRead } = useRole();

  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // Spring "pop" animation when the panel opens
  useEffect(() => {
    if (open) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [open, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <>
      {/* Bell button with animated unread count */}
      <TouchableOpacity
        style={[styles.bellBtn, open && styles.bellBtnOpen]}
        onPress={() => setOpen(o => !o)}
        accessibilityLabel={t('notifications.title')}
      >
        <Bell size={16} color={open ? colors.textInverse : colors.textPrimary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Pop-up panel — true Modal overlay so it hovers above every screen */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        {/* Backdrop: taps outside close the panel */}
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel={t('common.close')}
        >
          {/* Stop propagation so panel taps don't close it */}
          <Pressable
            style={styles.modalStage}
            onPress={e => e.stopPropagation()}
          >
            <Animated.View
              style={[
                styles.panel,
                { opacity: anim, transform: [{ translateY }, { scale }] },
              ]}
            >
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>{t('notifications.title')}</Text>
                  <Text style={styles.panelSub}>
                    {role ? t(`roles.${role}`) : ''} • {t('notifications.subtitle')}
                  </Text>
                </View>
                <View style={styles.panelHeaderActions}>
                  {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllBtn} onPress={() => markAllRead()}>
                      <CheckCheck size={14} color={colors.primaryDark} />
                      <Text style={styles.markAllText}>{t('notifications.mark_all_read')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
                    <X size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={styles.emptyTitle}>{t('notifications.empty_title')}</Text>
                    <Text style={styles.emptyMsg}>{t('notifications.empty_msg')}</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <Pressable
                    key={item.id}
                    onPress={() => markRead(item.id)}
                    style={({ pressed }) => [
                      styles.item,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: typeTint(item.type, colors) }]}>
                      {typeIcon(item.type, colors)}
                    </View>
                    <View style={styles.itemBody}>
                      <View style={styles.itemTitleRow}>
                        <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {!item.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.itemMsg} numberOfLines={2}>
                        {item.message}
                      </Text>
                      <Text style={styles.itemTime}>{timeAgo(item.created_at, t)}</Text>
                    </View>
                  </Pressable>
                )}
              />
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBtnOpen: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textInverse,
  },
  // Full-screen backdrop inside the Modal — dims the app behind the panel.
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 20, 0.35)',
  },
  // Anchors the panel to the top-right of the screen, below the header.
  modalStage: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 78,
    paddingHorizontal: 12,
  },
  panel: {
    width: 340,
    maxWidth: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  panelSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  panelHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 380,
  },
  listContent: {
    padding: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: colors.surfaceSubtle,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  itemTitleUnread: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  itemMsg: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 26,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  emptyMsg: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default NotificationBar;