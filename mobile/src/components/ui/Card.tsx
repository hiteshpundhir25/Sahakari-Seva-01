// mobile/src/components/ui/Card.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme, makeShadows, radii, spacing } from '../../theme';
import type { Palette } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, noPadding = false }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [entrance]);

  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    noPadding ? styles.noPadding : styles.padding,
    style,
  ];
  const animatedStyle = {
    opacity: entrance,
    transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={containerStyle} accessibilityRole="button">
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <Animated.View style={[containerStyle, animatedStyle]}>{children}</Animated.View>;
};

const createStyles = (colors: Palette) => {
  const shadows = makeShadows(colors);
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderColor: colors.border,
      borderWidth: 1,
      ...shadows.card,
      marginVertical: spacing.xs,
    },
    padding: {
      padding: spacing.md,
    },
    noPadding: {
      padding: 0,
    },
  });
};

export default Card;
