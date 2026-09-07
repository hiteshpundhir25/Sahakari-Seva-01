// ==============================================================================
// ANIMATED NUMBER — Smooth count-up for earnings, KPIs and stats
// Counts from zero to the target value on mount with an eased ramp.
// Re-animates whenever the target value changes, and always settles on the
// final value via a timer fallback (protects against rAF stalls, e.g. when
// the page is throttled in the background or an embedded webview).
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleProp, Text, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  /** Duration of the count-up in ms. */
  duration?: number;
  /** Delay in ms before starting. */
  delay?: number;
  /** Renders before the number (e.g. "₹"). */
  prefix?: string;
  /** Renders after the number (e.g. "+", " km"). */
  suffix?: string;
  /** Format the animated number, e.g. (n) => n.toLocaleString('en-IN'). */
  format?: (n: number) => string;
  style?: StyleProp<TextStyle>;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 900,
  delay = 0,
  prefix = '',
  suffix = '',
  format,
  style,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => {
      setDisplay(v);
    });

    // Animate to the current target, starting from wherever we are now.
    Animated.timing(anim, {
      toValue: value,
      duration,
      delay,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // Fallback: if rAF is throttled (background tab / embedded webview), the
    // animation may never reach its target — force the settled value.
    const settle = setTimeout(() => {
      anim.stopAnimation();
      anim.setValue(value);
      setDisplay(value);
    }, delay + duration + 120);

    return () => {
      anim.removeListener(id);
      anim.stopAnimation();
      clearTimeout(settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted = format ? format(display) : Math.round(display).toString();

  return (
    <Text style={style}>
      {prefix}
      {formatted}
      {suffix}
    </Text>
  );
};

export default AnimatedNumber;