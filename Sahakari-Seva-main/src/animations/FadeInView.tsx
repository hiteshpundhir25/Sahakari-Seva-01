// ==============================================================================
// FADE-IN VIEW — Smooth entrance animation (fade + gentle upward slide)
// Used across every screen for a classy, consistent motion language.
// Entrance plays once per mount; language switches do NOT replay it (no glitch).
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  /** Delay in ms before the entrance starts (use for stagger effects). */
  delay?: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Distance in px to slide up from. 0 = pure fade. */
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 360,
  distance = 16,
  style,
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // Runs once on mount only — re-renders (language changes) never replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });

  return (
    <Animated.View
      style={[
        { opacity: progress, transform: [{ translateY }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default FadeInView;