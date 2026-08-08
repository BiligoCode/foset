/** Shared visual constants. Neutral palette in light and dark. */

export type ThemeColors = {
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  danger: string;
  overlay: string;
};

export type ThemePreference = 'system' | 'light' | 'dark';

export type ColorScheme = 'light' | 'dark';

export const lightColors: ThemeColors = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  border: '#E4E3DF',
  text: '#1B1B1A',
  muted: '#77776F',
  accent: '#1B1B1A',
  accentText: '#FFFFFF',
  danger: '#B3261E',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const darkColors: ThemeColors = {
  background: '#121211',
  surface: '#1C1C1A',
  border: '#2E2E2B',
  text: '#F5F5F2',
  muted: '#9A9A92',
  accent: '#F5F5F2',
  accentText: '#121211',
  danger: '#E5736A',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export function colorsFor(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  title: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '400' },
} as const;
