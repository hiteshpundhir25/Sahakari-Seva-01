// mobile/src/components/common/NotificationsModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme, makeTypography, radii, spacing } from '../../theme';
import type { Palette } from '../../theme';
import { Badge, Button, EmptyState } from '../ui';
import { ApiClient } from '../../services/apiClient';
import { Notification } from '../../types';
import { useTranslation } from 'react-i18next';
import { FadeInView } from '../../animations';

export interface NotificationsModalProps {
  visible: boolean;
  userId?: string;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  userId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const list = await ApiClient.getNotifications(userId);
      setNotifications(list);
    } catch {
      // Handled in ApiClient fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifs();
    }
  }, [visible]);

  const handleMarkRead = async (id: string) => {
    await ApiClient.markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getBadgeVariant = (type: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (type) {
      case 'payment':
        return 'success';
      case 'welfare':
        return 'info';
      case 'admin':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('notifications.title')}</Text>
              <Text style={styles.subtitle}>{t('notifications.subtitle')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {notifications.length === 0 ? (
            <EmptyState
              icon="🔔"
              title={t('notifications.empty_title')}
              message={t('notifications.empty_msg')}
            />
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => (
                <FadeInView key={item.id} delay={index * 70} distance={10} duration={280}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleMarkRead(item.id)}
                    style={[styles.itemCard, item.read && styles.itemCardRead]}
                  >
                    <View style={styles.itemHeader}>
                      <Badge
                        label={item.type.toUpperCase()}
                        variant={getBadgeVariant(item.type)}
                        size="sm"
                      />
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMessage}>{item.message}</Text>
                    <Text style={styles.itemDate}>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                </FadeInView>
              )}
            />
          )}

          <Button
            title={t('notifications.close')}
            variant="outline"
            size="md"
            onPress={onClose}
            style={styles.closeButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette) => {
  const typography = makeTypography(colors);
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.fontHeadline,
    fontSize: 18,
  },
  subtitle: {
    ...typography.fontCaption,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  itemCardRead: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.border,
    opacity: 0.8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  itemTitle: {
    ...typography.fontSubtitle,
    marginTop: spacing.xxs,
    marginBottom: 2,
  },
  itemMessage: {
    ...typography.fontBody,
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemDate: {
    ...typography.fontCaption,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  closeButton: {
    marginTop: spacing.sm,
  },
  });
};

export default NotificationsModal;
