// ==============================================================================
// SAHAKARI SEVA TRADE THEMES — VIBRANT COLOR PALETTES & GRADIENTS
// Gives every cooperative gig category an unmistakable visual identity
// Supporting both light and dark mode with high-contrast accessibility.
// ==============================================================================

export interface TradeTheme {
  primary: string;
  gradient: [string, string];
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeTextLight: string;
  badgeTextDark: string;
}

export const TRADE_THEMES: Record<string, TradeTheme> = {
  Electrical: {
    primary: '#f59e0b',
    gradient: ['#fbbf24', '#d97706'],
    bgLight: '#fffbeb',
    bgDark: '#451a03',
    borderLight: '#fde68a',
    borderDark: '#78350f',
    badgeBgLight: '#fef3c7',
    badgeBgDark: '#78350f',
    badgeTextLight: '#92400e',
    badgeTextDark: '#fde68a',
  },
  Plumbing: {
    primary: '#0ea5e9',
    gradient: ['#38bdf8', '#0284c7'],
    bgLight: '#f0f9ff',
    bgDark: '#082f49',
    borderLight: '#bae6fd',
    borderDark: '#075985',
    badgeBgLight: '#e0f2fe',
    badgeBgDark: '#075985',
    badgeTextLight: '#0369a1',
    badgeTextDark: '#bae6fd',
  },
  Carpentry: {
    primary: '#d97706',
    gradient: ['#f59e0b', '#b45309'],
    bgLight: '#fff7ed',
    bgDark: '#431407',
    borderLight: '#fed7aa',
    borderDark: '#7c2d12',
    badgeBgLight: '#ffedd5',
    badgeBgDark: '#7c2d12',
    badgeTextLight: '#9a3412',
    badgeTextDark: '#fed7aa',
  },
  Painting: {
    primary: '#8b5cf6',
    gradient: ['#a78bfa', '#7c3aed'],
    bgLight: '#faf5ff',
    bgDark: '#2e1065',
    borderLight: '#e9d5ff',
    borderDark: '#581c87',
    badgeBgLight: '#f3e8ff',
    badgeBgDark: '#581c87',
    badgeTextLight: '#6b21a8',
    badgeTextDark: '#e9d5ff',
  },
  'Cleaning & Sanitization': {
    primary: '#10b981',
    gradient: ['#34d399', '#059669'],
    bgLight: '#ecfdf5',
    bgDark: '#064e3b',
    borderLight: '#a7f3d0',
    borderDark: '#065f46',
    badgeBgLight: '#d1fae5',
    badgeBgDark: '#065f46',
    badgeTextLight: '#047857',
    badgeTextDark: '#a7f3d0',
  },
  'Gardening & Landscaping': {
    primary: '#22c55e',
    gradient: ['#4ade80', '#16a34a'],
    bgLight: '#f0fdf4',
    bgDark: '#14532d',
    borderLight: '#bbf7d0',
    borderDark: '#166534',
    badgeBgLight: '#dcfce7',
    badgeBgDark: '#166534',
    badgeTextLight: '#15803d',
    badgeTextDark: '#bbf7d0',
  },
  'Appliance Repair': {
    primary: '#6366f1',
    gradient: ['#818cf8', '#4f46e5'],
    bgLight: '#eef2ff',
    bgDark: '#1e1b4b',
    borderLight: '#c7d2fe',
    borderDark: '#3730a3',
    badgeBgLight: '#e0e7ff',
    badgeBgDark: '#3730a3',
    badgeTextLight: '#4338ca',
    badgeTextDark: '#c7d2fe',
  },
  'AC Repair & Servicing': {
    primary: '#06b6d4',
    gradient: ['#22d3ee', '#0891b2'],
    bgLight: '#ecfeff',
    bgDark: '#164e63',
    borderLight: '#a5f3fc',
    borderDark: '#155e75',
    badgeBgLight: '#cffafe',
    badgeBgDark: '#155e75',
    badgeTextLight: '#0e7490',
    badgeTextDark: '#a5f3fc',
  },
  'Driver Services': {
    primary: '#f97316',
    gradient: ['#fb923c', '#ea580c'],
    bgLight: '#fff7ed',
    bgDark: '#431407',
    borderLight: '#ffedd5',
    borderDark: '#7c2d12',
    badgeBgLight: '#ffedd5',
    badgeBgDark: '#7c2d12',
    badgeTextLight: '#c2410c',
    badgeTextDark: '#ffedd5',
  },
  'Caregiving & Nursing': {
    primary: '#f43f5e',
    gradient: ['#fb7185', '#e11d48'],
    bgLight: '#fff1f2',
    bgDark: '#4c0519',
    borderLight: '#fecdd3',
    borderDark: '#9f1239',
    badgeBgLight: '#ffe4e6',
    badgeBgDark: '#9f1239',
    badgeTextLight: '#be123c',
    badgeTextDark: '#fecdd3',
  },
};

const DEFAULT_TRADE_THEME: TradeTheme = {
  primary: '#4f46e5',
  gradient: ['#6366f1', '#4338ca'],
  bgLight: '#eef2ff',
  bgDark: '#1e1b4b',
  borderLight: '#c7d2fe',
  borderDark: '#3730a3',
  badgeBgLight: '#e0e7ff',
  badgeBgDark: '#3730a3',
  badgeTextLight: '#4338ca',
  badgeTextDark: '#c7d2fe',
};

export interface ResolvedTradeTheme {
  primary: string;
  gradient: [string, string];
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export function getTradeTheme(tradeName?: string, isDark: boolean = false): ResolvedTradeTheme {
  const matchedKey = tradeName
    ? Object.keys(TRADE_THEMES).find(
        (k) => tradeName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(tradeName.toLowerCase())
      )
    : undefined;
  const theme = matchedKey ? TRADE_THEMES[matchedKey] : DEFAULT_TRADE_THEME;

  return {
    primary: theme.primary,
    gradient: theme.gradient,
    bg: isDark ? theme.bgDark : theme.bgLight,
    border: isDark ? theme.borderDark : theme.borderLight,
    badgeBg: isDark ? theme.badgeBgDark : theme.badgeBgLight,
    badgeText: isDark ? theme.badgeTextDark : theme.badgeTextLight,
  };
}
