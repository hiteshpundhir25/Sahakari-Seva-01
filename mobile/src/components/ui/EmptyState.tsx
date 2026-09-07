// mobile/src/components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, makeTypography, spacing } from '../../theme';
import type { Palette } from '../../theme';
import Button from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🔍',
  title,
  message,
  actionTitle,
  onAction,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
        />
      ) : null}
    </View>
  );
};

const createStyles = (colors: Palette) => {
  const typography = makeTypography(colors);
  return StyleSheet.create({
    container: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.lg,
    },
    icon: {
      fontSize: 44,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.fontTitle,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    message: {
      ...typography.fontBody,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 280,
      marginBottom: spacing.md,
    },
    actionBtn: {
      marginTop: spacing.xs,
    },
  });
};

export default EmptyState;
