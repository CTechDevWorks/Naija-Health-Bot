/**
 * 9ja Health design tokens — source: prompts-and-guides/9ja-health-design.md
 * Light mode only. Do not invent alternate palettes.
 */

export const colors = {
  primary: '#7DBA84',
  primaryActive: '#5F9A66',
  primaryDisabled: '#B8D9BC',
  secondary: '#3D6B45',
  secondaryActive: '#2F5236',
  onPrimary: '#FFFFFF',
  onSecondary: '#F5ECD4',

  canvas: '#F5ECD4',
  canvasSoft: '#EDE4C9',
  surfaceCard: '#FFFDF8',
  surfaceStrong: '#E8DFC8',

  ink: '#232323',
  body: '#3F3F3F',
  muted: '#6B6B6B',
  mutedSoft: '#9A9A9A',
  onDark: '#F5ECD4',

  hairline: '#D9CFB5',
  hairlineSoft: '#E8DFC8',
  borderStrong: '#B8AD90',
  scrim: 'rgba(0,0,0,0.5)',

  success: '#5F9A66',
  error: '#C45C4A',
  warning: '#C4923A',
  info: '#5A7A8A',

  riskLow: '#7DBA84',
  riskModerate: '#C4A35A',
  riskElevated: '#C47A4A',
  riskHigh: '#B85C4A',

  chartSeries: ['#7DBA84', '#3D6B45', '#C4A35A', '#5A7A8A'] as const,
} as const;

export const fonts = {
  display: 'Inter_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyStrong: 'Inter_600SemiBold',
  mono: 'monospace',
} as const;

export const typography = {
  displayXl: { fontFamily: fonts.display, fontSize: 32, lineHeight: 37, letterSpacing: -0.5 },
  displayLg: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.25 },
  displayMd: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  headingXl: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  headingLg: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  headingMd: { fontFamily: fonts.display, fontSize: 16, lineHeight: 22 },
  bodyLg: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26 },
  bodyMd: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodyStrong, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  badge: { fontFamily: fonts.bodyStrong, fontSize: 11, lineHeight: 14 },
  buttonMd: { fontFamily: fonts.bodyStrong, fontSize: 16, lineHeight: 20 },
  buttonSm: { fontFamily: fonts.bodyStrong, fontSize: 14, lineHeight: 18 },
  tabLabel: { fontFamily: fonts.bodyStrong, fontSize: 11, lineHeight: 14 },
  dataValue: { fontFamily: fonts.bodyStrong, fontSize: 20, lineHeight: 24 },
  dataLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
} as const;

export const rounded = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 9999,
  button: 9999,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 32,
  sectionLg: 48,
  huge: 64,
} as const;

export const layout = {
  gutterPhone: 16,
  gutterTablet: 24,
  readingMax: 560,
  bottomTabHeight: 64,
  headerHeightPhone: 56,
  stickyActionHeight: 64,
  touchMin: 44,
  touchPreferred: 48,
  logoNavHeight: 32,
  logoClearSpace: 16,
} as const;

export const elevation = {
  float: {
    shadowColor: '#232323',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const motion = {
  shortMs: 150,
  defaultMs: 220,
  chartMs: 500,
  easing: 'ease-out' as const,
};
