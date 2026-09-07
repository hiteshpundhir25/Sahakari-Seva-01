// ==============================================================================
// SCALE PRESSABLE — Springy press feedback for any touchable content
// Scales content down slightly on press-in and springs back on release.
// ==============================================================================

import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ScalePressableProps {
  onPress?: () => void;
  /** Scale factor while pressed. Default 0.96. */
  scaleTo?: number;
  /** Vibrate on press (Android haptics work inside Expo Go). */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  children: React.ReactNode;
}

export const ScalePressable: React.FC<ScalePressableProps> = ({
  onPress,
  scaleTo = 0.96,
  haptic = true,
  style,
  disabled = false,
  children,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: Platform.OS !== 'web',
      speed: 32,
      bounciness: 5,
    }).start();
  };

  const handlePressIn = () => {
    if (haptic) {
      void Haptics.selectionAsync().catch(() => undefined);
    }
    animateTo(scaleTo);
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default ScalePressable;