// ==============================================================================
// INDIA MAP OVERLAY — LIVE ACTIVITY NETWORK
// Transparent glowing outline map of India with live activity dots & network arcs.
// Green dots = cooperative worker activity | Red dots = live customer requests
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// High-fidelity, optimized India outline path (viewBox 0 0 400 425)
const INDIA_PATH =
  'M 155.2 0.0 c -0.6 0.3 -1.7 0.6 -2.4 0.6 c -2.7 0.0 -4.9 0.9 -7.2 2.7 c -2.4 2.0 -5.1 3.2 -8.3 3.7 c -1.3 0.2 -1.9 0.8 -2.4 2.5 c -0.6 1.8 -1.4 2.3 -4.0 2.6 c -4.4 0.5 -10.3 3.3 -14.4 6.8 c -2.3 2.1 -5.2 3.8 -6.4 3.8 c -1.2 0.0 -3.6 -0.6 -5.3 -1.3 c -3.1 -1.4 -3.2 -1.3 -3.4 3.1 c -0.1 2.5 -0.7 5.0 -1.3 5.5 c -0.6 0.6 -2.4 0.9 -4.0 0.8 c -2.1 -0.1 -3.4 0.5 -4.8 2.3 c -1.1 1.4 -3.1 2.9 -4.4 3.3 c -2.2 0.7 -2.4 1.1 -2.7 5.7 c -0.4 4.5 -0.9 5.3 -4.3 7.1 c -2.3 1.1 -4.1 2.9 -4.1 3.9 c 0.0 1.0 -1.0 2.2 -2.1 2.7 c -2.5 1.0 -3.0 4.1 -1.4 9.1 c 0.6 2.0 0.8 4.3 0.3 5.1 c -0.7 1.0 -0.6 1.3 0.6 1.9 c 1.8 1.0 1.9 3.0 0.2 6.0 c -1.0 1.7 -1.6 4.3 -1.4 5.9 c 0.5 3.7 2.1 4.7 9.8 6.4 c 4.9 1.1 9.4 3.1 11.8 5.2 c 2.0 1.7 4.7 2.7 7.4 2.7 c 6.5 0.0 10.7 2.6 12.1 7.4 c 0.7 2.4 1.7 3.5 3.9 4.3 c 1.7 0.7 3.8 2.0 4.6 3.0 c 1.4 1.6 1.2 2.7 -0.8 5.7 c -1.2 1.8 -3.4 3.6 -4.8 3.9 c -2.4 0.5 -2.7 1.1 -2.5 4.5 c 0.2 2.3 1.0 5.4 1.7 6.8 c 0.8 1.5 2.1 4.9 2.9 7.7 c 1.4 4.7 1.4 5.3 -0.1 8.5 c -1.2 2.7 -1.7 5.3 -1.5 8.1 c 0.3 4.1 0.1 4.8 -2.4 6.9 c -1.7 1.4 -3.1 3.7 -3.1 5.0 c 0.0 1.4 -0.6 2.8 -1.4 3.2 c -1.1 0.5 -1.1 1.2 0.0 3.7 c 0.8 1.7 1.6 4.6 1.8 6.3 c 0.4 3.7 1.2 4.4 5.2 4.4 c 5.7 0.0 8.0 2.1 8.0 7.4 c 0.0 5.1 -3.4 9.9 -9.5 13.5 c -4.4 2.6 -6.1 4.7 -6.1 7.6 c 0.0 2.2 -0.8 3.8 -2.2 4.6 c -1.2 0.7 -3.2 2.7 -4.4 4.4 c -1.9 2.7 -4.1 3.8 -8.7 4.1 c -4.5 0.3 -6.3 1.0 -8.1 3.1 c -2.1 2.5 -5.8 4.2 -11.0 5.0 c -3.4 0.5 -6.8 1.8 -7.5 2.8 c -1.3 1.7 -8.3 3.6 -18.7 5.0 c -8.4 1.1 -11.3 2.1 -14.6 4.7 c -2.6 2.0 -3.6 2.2 -6.4 1.1 c -2.3 -0.9 -3.1 -0.8 -5.2 0.8 c -1.4 1.0 -3.0 1.8 -3.6 1.8 c -4.5 0.0 -16.6 -8.2 -24.4 -16.5 c -3.9 -4.1 -8.0 -6.9 -11.9 -8.2 c -4.5 -1.5 -8.3 -4.7 -10.9 -9.2 c -1.9 -3.1 -2.9 -3.7 -5.4 -3.0 c -3.9 1.1 -12.1 1.7 -18.4 1.3 c -3.2 -0.2 -7.0 -0.8 -8.5 -1.4 c -2.6 -1.0 -2.9 -0.9 -4.8 1.2 c -2.0 2.2 -7.5 4.5 -12.9 5.3 c -4.1 0.6 -4.8 1.1 -5.7 4.0 c -0.6 2.0 -1.6 4.6 -2.3 5.8 c -1.8 3.2 -7.3 5.4 -11.9 4.7 c -2.4 -0.3 -5.0 -1.5 -5.7 -2.6 c -1.4 -2.1 -1.4 -2.2 0.7 -4.3 c 1.2 -1.2 2.2 -3.0 2.2 -3.9 c 0.0 -1.0 -0.6 -2.3 -1.4 -3.0 c -0.8 -0.7 -2.7 -1.6 -4.3 -2.0 c -2.3 -0.5 -3.2 -1.4 -3.9 -4.2 c -0.6 -2.3 -1.5 -4.4 -2.2 -4.8 c -1.7 -1.0 -2.4 -5.4 -1.1 -7.7 c 0.8 -1.4 0.6 -1.8 -0.9 -1.8 c -2.2 0.0 -7.2 4.4 -8.5 7.5 c -0.7 1.8 -2.4 4.5 -3.8 6.0 c -2.0 2.3 -2.7 4.5 -2.6 8.5 c 0.1 4.5 0.5 5.5 2.6 6.8 c 1.4 0.9 2.8 2.7 3.0 4.1 c 0.3 2.1 1.7 4.1 4.9 6.7 c 4.1 3.4 4.4 4.0 2.7 6.1 c -1.5 1.9 -4.8 2.9 -8.8 2.6 c -3.4 -0.3 -5.2 0.3 -6.3 2.2 c -1.7 2.9 -1.6 3.0 1.2 3.8 c 1.9 0.5 4.2 1.6 5.2 2.4 c 1.7 1.4 1.7 1.7 -0.2 3.6 c -1.2 1.1 -2.7 3.6 -3.5 5.5 c -1.3 3.3 -3.4 5.3 -6.8 6.4 c -3.5 1.2 -3.7 1.5 -2.1 4.4 c 1.0 1.9 2.6 4.3 3.5 5.3 c 1.7 1.9 1.7 2.6 0.0 5.4 c -1.6 2.6 -1.8 4.2 -0.8 6.0 c 1.2 2.3 0.9 3.0 -1.8 4.6 c -1.7 1.0 -4.6 2.9 -6.4 4.2 c -3.6 2.6 -4.8 5.7 -4.1 10.7 c 0.5 3.3 0.2 4.5 -1.7 7.0 c -1.5 2.0 -2.4 4.5 -2.4 6.9 c 0.0 3.7 -0.5 4.5 -3.2 5.0 c -2.5 0.5 -3.4 1.4 -4.0 4.0 c -0.6 2.3 -1.5 4.7 -2.1 5.3 c -0.6 0.6 -2.4 1.3 -4.0 1.5 c -2.2 0.3 -4.1 1.7 -6.8 5.2 c -4.4 5.6 -4.8 7.3 -3.0 11.2 c 1.2 2.6 1.8 6.0 1.4 8.7 c -0.5 3.9 -0.1 5.2 2.5 7.4 c 2.0 1.8 3.5 4.3 3.5 6.0 c 0.0 1.6 0.8 3.9 1.7 5.1 c 1.6 2.0 1.6 2.3 0.0 4.5 c -1.2 1.8 -1.7 3.9 -1.3 6.0 c 0.3 1.7 1.4 4.0 2.4 5.2 c 1.4 1.7 1.5 2.5 0.4 4.4 c -1.3 2.2 -1.1 3.7 0.9 7.0 c 1.2 2.1 2.2 4.6 2.2 5.5 c 0.0 1.6 2.6 4.6 6.3 7.3 c 3.6 2.6 4.6 4.0 4.8 6.8 c 0.3 3.5 1.5 5.5 5.1 8.7 c 3.4 3.0 4.6 4.8 4.6 6.8 c 0.0 1.7 0.8 3.8 1.8 4.8 c 2.0 1.8 3.7 7.0 2.9 8.9 c -0.4 1.0 -0.4 1.8 0.0 2.2 c 0.6 0.6 1.4 4.4 2.2 10.4 c 1.1 8.2 2.5 11.8 5.6 14.1 c 2.7 2.0 4.2 4.4 4.8 7.5 c 0.6 3.1 1.7 5.6 2.8 6.5 c 1.3 1.1 2.0 3.2 2.0 5.6 c 0.0 4.1 2.2 7.7 7.8 13.0 c 3.6 3.4 5.6 6.5 6.6 10.4 c 1.3 4.8 2.7 6.9 6.2 9.0 c 2.7 1.6 4.4 3.6 4.8 5.5 c 0.5 2.4 1.8 4.5 3.8 6.0 c 2.6 1.9 4.3 4.6 6.4 10.3 c 1.6 4.3 3.5 7.6 5.0 9.0 c 2.3 2.0 3.1 4.7 3.1 10.2 c 0.0 6.0 0.8 8.4 3.5 10.5 c 2.3 1.8 3.5 4.3 3.5 7.5 c 0.0 3.2 0.7 4.9 2.5 6.2 c 1.5 1.1 2.7 3.2 2.7 4.9 c 0.0 2.4 1.2 4.5 4.1 6.8 c 2.7 2.2 4.4 4.4 4.7 6.4 c 0.4 2.5 1.7 4.5 4.6 7.0 c 3.2 2.8 4.6 5.0 4.8 7.6 c 0.2 2.4 1.2 4.7 2.6 6.0 c 2.1 1.9 3.0 4.9 3.0 10.3 c 0.0 6.1 0.8 8.5 3.4 10.7 c 3.2 2.7 3.8 7.2 1.3 10.6 c -1.2 1.6 -1.8 4.0 -1.6 6.2 c 0.3 2.6 0.0 3.8 -1.2 5.0 c -1.8 1.9 -1.6 3.8 0.7 6.8 c 1.6 2.0 2.7 4.5 2.7 6.2 c 0.0 2.3 1.4 4.7 4.4 7.5 c 3.0 2.8 4.6 5.4 4.6 7.6 c 0.0 1.8 0.7 3.4 1.7 4.1 c 2.0 1.4 2.6 5.2 1.1 7.2 c -1.0 1.3 -1.1 2.2 -0.2 3.1 c 1.2 1.2 1.2 2.5 0.0 4.6 c -1.0 1.8 -1.1 3.1 -0.4 4.7 c 1.4 3.1 3.5 4.4 6.7 4.2 c 2.4 -0.2 4.5 0.7 6.3 2.7 c 1.8 2.0 3.7 2.9 5.8 2.7 c 2.0 -0.2 4.3 0.6 6.1 2.3 c 2.6 2.4 2.8 4.1 0.7 7.0 c -1.5 2.1 -1.8 4.4 -0.9 6.4 c 0.9 2.0 0.8 3.1 -0.5 4.5 c -1.2 1.3 -1.5 2.8 -0.8 4.4 c 1.0 2.3 0.9 2.7 -0.7 3.6 c -2.3 1.3 -2.7 5.6 -0.7 7.3 c 1.0 0.9 2.7 1.4 4.4 1.4 c 2.4 0.0 3.7 0.9 5.0 3.5 c 1.1 2.1 2.5 3.5 3.8 3.5 c 1.4 0.0 2.8 1.4 3.8 3.8 c 1.4 3.2 1.3 3.6 -0.6 4.7 c -2.0 1.2 -2.1 2.1 -0.4 4.0 c 1.4 1.6 2.5 3.9 2.5 5.3 c 0.0 1.5 1.1 3.5 2.8 4.9 c 3.4 2.9 4.3 5.4 2.8 7.8 c -0.8 1.3 -0.6 1.9 0.7 2.5 c 2.0 1.0 3.1 3.4 3.1 7.1 c 0.0 3.7 0.9 5.9 3.0 7.8 c 2.3 2.0 3.3 4.2 3.3 7.5 c 0.0 3.1 0.9 5.2 2.8 6.7 c 2.1 1.7 3.1 3.8 3.1 6.8 c 0.0 2.7 0.9 4.9 2.5 6.2 c 2.1 1.7 2.9 3.8 2.9 7.6 c 0.0 3.8 1.0 6.0 3.4 7.6 c 2.4 1.6 3.4 3.7 3.4 7.0 c 0.0 3.2 0.9 5.3 2.7 6.8 c 2.0 1.7 3.0 3.8 3.0 6.8 c 0.0 4.1 2.2 7.7 6.4 10.5 c 3.8 2.5 5.5 5.0 5.5 7.9 c 0.0 2.4 0.9 4.3 2.6 5.5 c 2.6 1.8 3.1 4.7 1.8 9.0 c -0.9 3.0 -0.8 4.0 0.8 5.7 c 1.7 1.8 2.0 3.4 1.1 5.3 c -0.9 1.8 -0.7 2.7 0.7 3.9 c 1.3 1.1 2.0 2.9 2.0 5.1 c 0.0 2.8 0.9 4.6 2.7 5.7 c 2.0 1.2 3.0 3.3 3.0 6.2 c 0.0 2.8 0.8 4.7 2.4 5.9 c 2.3 1.7 2.8 4.5 1.6 8.7 c -0.8 2.8 -0.8 3.7 0.3 4.9 c 1.2 1.3 1.4 2.8 0.7 4.7 c -0.9 2.4 -0.6 3.3 1.3 4.3 c 1.9 1.0 2.4 2.4 1.8 4.9 c -0.8 3.0 -0.4 4.0 1.6 5.3 c 2.1 1.4 2.6 3.0 1.8 5.6 c -0.7 2.4 -0.4 3.4 1.4 4.7 c 1.8 1.3 2.4 2.8 1.9 5.3 c -0.7 3.1 0.4 5.2 3.5 7.1 c 2.6 1.6 3.6 3.4 3.3 6.3 c -0.4 3.3 0.7 5.3 3.7 7.0 c 2.5 1.5 3.7 3.3 3.7 6.1 c 0.0 2.8 0.9 4.6 2.8 5.7 c 2.0 1.2 2.9 3.2 2.9 6.2 c 0.0 4.1 2.3 7.8 6.7 10.6 c 4.1 2.6 5.7 5.2 5.5 8.9 c -0.2 2.9 0.7 4.8 2.8 6.1 c 2.2 1.4 3.0 3.3 2.7 6.2 c -0.4 3.2 0.7 5.2 3.7 6.9 c 2.6 1.5 3.7 3.4 3.7 6.3 c 0.0 3.9 1.9 6.8 5.5 8.7 c 3.1 1.6 4.4 3.3 4.4 5.7 c 0.0 2.4 1.0 4.3 2.9 5.6 c 2.3 1.5 3.2 3.4 3.2 6.3 c 0.0 3.8 2.0 6.7 5.8 8.5 c 3.2 1.6 4.7 3.3 4.7 5.7 c 0.0 2.5 1.0 4.4 3.1 5.8 c 2.4 1.6 3.3 3.5 3.3 6.6 c 0.0 4.0 2.1 6.9 6.0 8.7 c 3.3 1.6 4.8 3.4 4.8 5.9 c 0.0 2.5 1.1 4.5 3.2 5.9 c 2.5 1.6 3.5 3.5 3.5 6.7 c 0.0 4.1 2.2 7.1 6.2 8.9 c 3.4 1.6 5.0 3.5 5.0 6.0 c 0.0 2.5 1.2 4.6 3.4 6.1 c 2.6 1.7 3.6 3.6 3.6 6.8 c 0.0 4.2 2.4 7.3 6.8 9.2 c 3.7 1.6 5.2 3.6 5.2 6.2 c 0.0 2.6 1.3 4.8 3.7 6.3 c 2.7 1.8 3.8 3.8 3.8 7.0 c 0.0 4.3 2.5 7.6 7.3 9.7 c 4.0 1.7 5.6 3.8 5.6 6.5 c 0.0 2.7 1.5 5.0 4.1 6.7 c 3.0 1.9 4.1 4.1 4.1 7.4 c 0.0 4.5 2.7 8.0 8.0 10.3 c 4.3 1.8 6.0 4.1 6.0 7.0 c 0.0 2.9 1.7 5.4 4.6 7.2 c 3.4 2.1 4.6 4.5 4.6 8.0 c 0.0 5.0 3.0 8.8 8.8 11.2 c 4.8 2.0 6.6 4.5 6.6 7.8 c 0.0 3.3 2.0 6.0 5.3 8.0 c 3.9 2.4 5.3 5.1 5.3 9.0 c 0.0 5.7 3.5 10.0 10.0 12.8 c 5.4 2.3 7.4 5.1 7.4 8.8 c 0.0 3.7 2.3 6.8 6.2 9.0 c 4.5 2.6 6.2 5.7 6.2 10.1 c 0.0 6.5 4.0 11.4 11.5 14.5 c 6.2 2.6 8.5 5.8 8.5 10.1 c 0.0 4.3 2.7 7.8 7.3 10.4 c 5.2 3.0 7.2 6.6 7.2 11.7 c 0.0 7.6 4.7 13.3 13.4 16.9 c 7.2 3.0 9.8 6.8 9.8 11.8 c 0.0 5.0 3.2 9.2 8.5 12.2 c 6.1 3.5 8.4 7.7 8.4 13.7 c 0.0 8.9 5.5 15.6 15.7 19.8 z';

export interface ActivityDot {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'worker' | 'customer';
  phase: 'A' | 'B' | 'C' | 'D';
}

const NETWORK_NODES: ActivityDot[] = [
  { id: 'del', name: 'Delhi NCR', x: 150, y: 142, type: 'worker', phase: 'A' },
  { id: 'jai', name: 'Jaipur', x: 128, y: 168, type: 'customer', phase: 'B' },
  { id: 'chd', name: 'Chandigarh', x: 140, y: 112, type: 'worker', phase: 'C' },
  { id: 'sri', name: 'Srinagar', x: 138, y: 56, type: 'customer', phase: 'D' },
  { id: 'luc', name: 'Lucknow', x: 194, y: 162, type: 'customer', phase: 'A' },
  { id: 'pat', name: 'Patna', x: 232, y: 172, type: 'worker', phase: 'B' },
  { id: 'kol', name: 'Kolkata', x: 258, y: 212, type: 'customer', phase: 'C' },
  { id: 'guw', name: 'Guwahati', x: 312, y: 160, type: 'worker', phase: 'D' },
  { id: 'ahm', name: 'Ahmedabad', x: 74, y: 212, type: 'worker', phase: 'B' },
  { id: 'mum', name: 'Mumbai', x: 84, y: 268, type: 'customer', phase: 'A' },
  { id: 'pun', name: 'Pune', x: 98, y: 284, type: 'worker', phase: 'C' },
  { id: 'hyd', name: 'Hyderabad', x: 154, y: 282, type: 'worker', phase: 'B' },
  { id: 'blr', name: 'Bengaluru', x: 134, y: 342, type: 'worker', phase: 'A' },
  { id: 'che', name: 'Chennai', x: 174, y: 344, type: 'customer', phase: 'D' },
  { id: 'koc', name: 'Kochi', x: 122, y: 388, type: 'worker', phase: 'C' },
  { id: 'bhu', name: 'Bhubaneswar', x: 236, y: 248, type: 'customer', phase: 'A' },
];

const NETWORK_LINKS: [string, string][] = [
  ['del', 'chd'],
  ['del', 'jai'],
  ['del', 'luc'],
  ['del', 'mum'],
  ['mum', 'ahm'],
  ['mum', 'pun'],
  ['mum', 'hyd'],
  ['hyd', 'blr'],
  ['blr', 'che'],
  ['blr', 'koc'],
  ['luc', 'pat'],
  ['pat', 'kol'],
  ['kol', 'bhu'],
  ['kol', 'guw'],
  ['hyd', 'bhu'],
];

interface IndiaMapOverlayProps {
  style?: any;
}

export const IndiaMapOverlay: React.FC<IndiaMapOverlayProps> = ({ style }) => {
  // Staggered pulsing phases for organic heartbeat network feel
  const pulseA = useRef(new Animated.Value(0)).current;
  const pulseB = useRef(new Animated.Value(0)).current;
  const pulseC = useRef(new Animated.Value(0)).current;
  const pulseD = useRef(new Animated.Value(0)).current;
  const lineGlow = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const createPulseLoop = (anim: Animated.Value, delay: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    };

    const loopA = createPulseLoop(pulseA, 0, 1800);
    const loopB = createPulseLoop(pulseB, 450, 2000);
    const loopC = createPulseLoop(pulseC, 900, 2200);
    const loopD = createPulseLoop(pulseD, 1350, 1900);

    const lineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineGlow, {
          toValue: 0.5,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(lineGlow, {
          toValue: 0.18,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    loopA.start();
    loopB.start();
    loopC.start();
    loopD.start();
    lineLoop.start();

    return () => {
      loopA.stop();
      loopB.stop();
      loopC.stop();
      loopD.stop();
      lineLoop.stop();
    };
  }, [pulseA, pulseB, pulseC, pulseD, lineGlow]);

  const getPhaseAnim = (phase: ActivityDot['phase']) => {
    switch (phase) {
      case 'A': return pulseA;
      case 'B': return pulseB;
      case 'C': return pulseC;
      case 'D': return pulseD;
    }
  };

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg
        viewBox="0 0 400 425"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <RadialGradient id="mapFillGrad" cx="50%" cy="45%" r="60%">
            <Stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
            <Stop offset="55%" stopColor="#0284c7" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#060a14" stopOpacity="0.0" />
          </RadialGradient>
          <RadialGradient id="glowWorker" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <Stop offset="60%" stopColor="#10b981" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glowCustomer" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <Stop offset="60%" stopColor="#ef4444" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Outer ambient glow path */}
        <Path
          d={INDIA_PATH}
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="3.2"
          strokeOpacity="0.16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crisp illuminated India boundary */}
        <Path
          d={INDIA_PATH}
          fill="url(#mapFillGrad)"
          stroke="#2dd4bf"
          strokeWidth="1.4"
          strokeOpacity="0.48"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Network connection lines between Indian metros */}
        {NETWORK_LINKS.map(([startId, endId], idx) => {
          const start = NETWORK_NODES.find((n) => n.id === startId);
          const end = NETWORK_NODES.find((n) => n.id === endId);
          if (!start || !end) return null;

          return (
            <AnimatedLine
              key={`link-${startId}-${endId}-${idx}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#2dd4bf"
              strokeWidth="0.9"
              strokeDasharray="3,3"
              strokeOpacity={lineGlow}
            />
          );
        })}

        {/* Pulsing activity dots (Green = workers, Red = customers) */}
        {NETWORK_NODES.map((node) => {
          const anim = getPhaseAnim(node.phase);
          const isWorker = node.type === 'worker';
          const coreColor = isWorker ? '#10b981' : '#f43f5e';
          const ringColor = isWorker ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)';

          const haloRadius = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 11],
          });

          const haloOpacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.65, 0.35, 0.0],
          });

          return (
            <G key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              {/* Outer breathing aura */}
              <AnimatedCircle
                r={haloRadius}
                fill="none"
                stroke={ringColor}
                strokeWidth="1.4"
                opacity={haloOpacity}
              />

              {/* Steady soft glow ring */}
              <Circle
                r={4.2}
                fill={coreColor}
                opacity={0.3}
              />

              {/* Bright center core pin */}
              <Circle
                r={2.2}
                fill={coreColor}
                opacity={0.95}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 430,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default IndiaMapOverlay;
