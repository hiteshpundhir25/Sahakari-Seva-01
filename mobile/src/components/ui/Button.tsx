// mobile/src/components/ui/Button.tsx
import React, { useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
  StyleProp,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, radii, spacing } from '../../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: Platform.OS !== 'web',
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    void Haptics.selectionAsync().catch(() => undefined);
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    let bg: ViewStyle = { backgroundColor: colors.primary };
    if (variant === 'secondary') bg = { backgroundColor: colors.secondary };
    if (variant === 'outline') bg = { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
    if (variant === 'danger') bg = { backgroundColor: colors.danger };
    if (disabled) bg = { backgroundColor: colors.border };

    let pad: ViewStyle = { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
    if (size === 'sm') pad = { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm };
    if (size === 'lg') pad = { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl };

    return {
      ...styles.base,
      ...bg,
      ...pad,
    };
  };

  const getTextStyle = (): TextStyle => {
    let col = colors.textInverse;
    if (variant === 'outline') col = colors.primary;
    if (disabled) col = colors.textMuted;

    let fontSize = 14;
    if (size === 'sm') fontSize = 12;
    if (size === 'lg') fontSize = 16;

    return {
      ...styles.baseText,
      color: col,
      fontSize,
    };
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        onPress={handlePress}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
        disabled={disabled || loading}
        style={getContainerStyle()}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.textInverse} size="small" />
        ) : (
          <>
            {icon ? <>{icon}</> : null}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Button;
