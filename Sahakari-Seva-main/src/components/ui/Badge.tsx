// mobile/src/components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme, radii, spacing } from '../../theme';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
}) => {
  const { colors } = useTheme();
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'danger':
        return { bg: colors.dangerLight, text: colors.danger };
      case 'info':
        return { bg: colors.infoLight, text: colors.info };
      default:
        return { bg: colors.surfaceSubtle, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        style,
      ]}
    >
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'sm' ? styles.textSm : styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs + 1,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});

export default Badge;
