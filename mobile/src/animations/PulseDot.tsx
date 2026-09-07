// ==============================================================================
// PULSE DOT — CONCENTRIC RADAR RIPPLE FOR LIVE GPS, STATUS & BEACONS
// 60fps buttery smooth pulse using native driver
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform, StyleProp, ViewStyle } from 'react-native';

interface PulseDotProps {
  /** Core dot color (e.g. emerald '#10B981', rose '#EF4444'). Default emerald. */
  color?: string;
  /** Diameter of the inner solid dot in px. Default 8. */
  size?: number;
  /** Max scale of the ripple ring. Default 2.6. */
  ringScale?: number;
  /** One full ripple duration in ms. Default 1600. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const PulseDot: React.FC<PulseDotProps> = ({
  color = '#10b981',
  size = 8,
  ringScale = 2.6,
  duration = 1600,
  style,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, ringScale],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.65, 0.35, 0],
  });

  const outerSize = size * ringScale;

  return (
    <View style={[styles.container, { width: outerSize, height: outerSize }, style]}>
      {/* Expanding ripple ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      {/* Solid center dot */}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
  },
  dot: {
    position: 'relative',
  },
});

export default PulseDot;
