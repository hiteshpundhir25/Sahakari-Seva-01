// ==============================================================================
// PULSE VIEW — Gentle infinite pulse for live / emergency indicators
// A soft breathing effect that draws the eye without being distracting.
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';

interface PulseViewProps {
  children: React.ReactNode;
  /** Peak scale (default 1.04). */
  scaleTo?: number;
  /** One full pulse cycle in ms (default 1400). */
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  scaleTo = 1.04,
  duration = 1400,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: scaleTo,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
};

export default PulseView;