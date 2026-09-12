// ==============================================================================
// LOGIN BACKGROUND FLOURISH — DUAL THEME (DARK & LIGHT)
// Renders the authentic patriotic flourishes visible in the reference design:
// 1. Large faint Ashoka Chakra watermark in the upper-right background
// 2. Graceful swooping Indian Tricolor ribbon on the left edge
// 3. Graceful swooping Indian Tricolor ribbon on the right edge
// Pointer-events none, non-intrusive, and adapts seamlessly to both themes.
// ==============================================================================

import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

interface LoginBackgroundFlourishProps {
  isDark: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LoginBackgroundFlourish: React.FC<LoginBackgroundFlourishProps> = ({ isDark }) => {
  // Theme-aware tokens
  const chakraStroke = isDark ? '#38bdf8' : '#1e3a8a';
  const chakraOpacity = isDark ? 0.14 : 0.08;

  // 24 spokes for Ashoka Chakra (every 15 degrees)
  const chakraCX = 150;
  const chakraCY = 150;
  const chakraRadius = 135;
  const innerRadius = 22;

  const spokes = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const angleRad = (i * 15 * Math.PI) / 180;
      return {
        x1: chakraCX + innerRadius * Math.cos(angleRad),
        y1: chakraCY + innerRadius * Math.sin(angleRad),
        x2: chakraCX + (chakraRadius - 8) * Math.cos(angleRad),
        y2: chakraCY + (chakraRadius - 8) * Math.sin(angleRad),
        key: `watermark-spoke-${i}`,
      };
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* =================================================================== */}
      {/* 1. UPPER-RIGHT ASHOKA CHAKRA WATERMARK                              */}
      {/* =================================================================== */}
      <View style={styles.chakraWrap}>
        <Svg width={280} height={280} viewBox="0 0 300 300">
          <G opacity={chakraOpacity}>
            {/* Outer Rim */}
            <Circle
              cx={chakraCX}
              cy={chakraCY}
              r={chakraRadius}
              fill="none"
              stroke={chakraStroke}
              strokeWidth={3}
            />
            {/* Concentric Step Rim */}
            <Circle
              cx={chakraCX}
              cy={chakraCY}
              r={chakraRadius - 8}
              fill="none"
              stroke={chakraStroke}
              strokeWidth={1.5}
            />
            {/* Center Outer Hub */}
            <Circle
              cx={chakraCX}
              cy={chakraCY}
              r={innerRadius}
              fill="none"
              stroke={chakraStroke}
              strokeWidth={2.5}
            />
            {/* Center Solid Pivot */}
            <Circle
              cx={chakraCX}
              cy={chakraCY}
              r={7}
              fill={chakraStroke}
            />
            {/* 24 Radial Spokes */}
            {spokes.map((s) => (
              <Line
                key={s.key}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke={chakraStroke}
                strokeWidth={1.8}
              />
            ))}
          </G>
        </Svg>
      </View>

      {/* =================================================================== */}
      {/* 2. LEFT EDGE SWOOPING TRICOLOR RIBBON                               */}
      {/* =================================================================== */}
      <View style={styles.leftRibbonWrap}>
        <Svg width={140} height={180} viewBox="0 0 140 180">
          <Defs>
            <SvgLinearGradient id="leftSaffronGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FF9933" stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#FF7700" stopOpacity={0.45} />
            </SvgLinearGradient>
            <SvgLinearGradient id="leftWhiteGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.9 : 0.95} />
              <Stop offset="100%" stopColor={isDark ? '#e2e8f0' : '#cbd5e1'} stopOpacity={0.4} />
            </SvgLinearGradient>
            <SvgLinearGradient id="leftGreenGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#138808" stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#0B6B06" stopOpacity={0.4} />
            </SvgLinearGradient>
          </Defs>

          {/* Saffron Layer */}
          <Path
            d="M 0 20 C 50 35, 95 65, 135 110 L 125 125 C 85 80, 45 50, 0 35 Z"
            fill="url(#leftSaffronGrad)"
          />
          {/* White Layer */}
          <Path
            d="M 0 35 C 45 50, 85 80, 125 125 L 115 140 C 75 95, 35 65, 0 50 Z"
            fill="url(#leftWhiteGrad)"
          />
          {/* Green Layer */}
          <Path
            d="M 0 50 C 35 65, 75 95, 115 140 L 105 155 C 65 110, 25 80, 0 65 Z"
            fill="url(#leftGreenGrad)"
          />
        </Svg>
      </View>

      {/* =================================================================== */}
      {/* 3. RIGHT EDGE SWOOPING TRICOLOR RIBBON                              */}
      {/* =================================================================== */}
      <View style={styles.rightRibbonWrap}>
        <Svg width={140} height={190} viewBox="0 0 140 190">
          <Defs>
            <SvgLinearGradient id="rightSaffronGrad" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FF9933" stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#FF7700" stopOpacity={0.35} />
            </SvgLinearGradient>
            <SvgLinearGradient id="rightWhiteGrad" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.9 : 0.95} />
              <Stop offset="100%" stopColor={isDark ? '#e2e8f0' : '#cbd5e1'} stopOpacity={0.35} />
            </SvgLinearGradient>
            <SvgLinearGradient id="rightGreenGrad" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#138808" stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#0B6B06" stopOpacity={0.35} />
            </SvgLinearGradient>
          </Defs>

          {/* Saffron Layer */}
          <Path
            d="M 140 15 C 95 35, 50 75, 5 125 L 15 140 C 60 90, 105 50, 140 30 Z"
            fill="url(#rightSaffronGrad)"
          />
          {/* White Layer */}
          <Path
            d="M 140 30 C 105 50, 60 90, 15 140 L 25 155 C 70 105, 115 65, 140 45 Z"
            fill="url(#rightWhiteGrad)"
          />
          {/* Green Layer */}
          <Path
            d="M 140 45 C 115 65, 70 105, 25 155 L 35 170 C 80 120, 125 80, 140 60 Z"
            fill="url(#rightGreenGrad)"
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chakraWrap: {
    position: 'absolute',
    top: 130,
    right: -70,
    zIndex: 1,
  },
  leftRibbonWrap: {
    position: 'absolute',
    top: 155,
    left: 0,
    zIndex: 2,
  },
  rightRibbonWrap: {
    position: 'absolute',
    top: 120,
    right: 0,
    zIndex: 2,
  },
});

export default LoginBackgroundFlourish;
