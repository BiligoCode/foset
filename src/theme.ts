/** Shared visual constants. Foset is a light, neutral utility app, so this is
 *  deliberately small. */

export const colors = {
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
