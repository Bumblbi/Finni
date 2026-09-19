// src/constants/theme.ts
import { StyleSheet, Platform } from 'react-native';

// ─── Color Palette ────────────────────────────────────────────────────────────
export const Colors = {
  // Backgrounds
  bgMain: '#F4F6FB',
  bgCard: '#FFFFFF',
  bgCardAlt: '#F8FAFF',

  // Accents
  mint: '#67D8AF',
  mintLight: 'rgba(103, 216, 175, 0.15)',
  mintDark: '#4FC49A',

  purple: '#B1A6F1',
  purpleLight: 'rgba(177, 166, 241, 0.15)',

  pink: '#FFA1C5',
  pinkLight: 'rgba(255, 161, 197, 0.15)',

  yellow: '#F5B942',
  yellowLight: 'rgba(245, 185, 66, 0.15)',

  red: '#FF7675',
  redLight: 'rgba(255, 118, 117, 0.15)',

  // Text
  textPrimary: '#2C3A4B',
  textSecondary: '#8A95A5',
  textMuted: '#C2C9D6',
  textWhite: '#FFFFFF',
  textMint: '#67D8AF',

  // UI
  border: '#EDF0F7',
  shadow: '#8A95A5',
  overlay: 'rgba(44, 58, 75, 0.4)',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  // Font families (Android rounded)
  fontRounded: Platform.select({
    android: 'sans-serif-rounded',
    ios: 'System',
    default: 'System',
  }),
  fontBold: Platform.select({
    android: 'sans-serif-medium',
    ios: 'System',
    default: 'System',
  }),

  // Sizes (sp — scale-independent pixels)
  size3XL: 32,
  size2XL: 28,
  sizeXL: 24,
  sizeLG: 20,
  sizeMD: 18,
  sizeBase: 16,
  sizeSM: 14,
  sizeXS: 12,
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenH: 20,   // horizontal screen padding
} as const;

// ─── Border Radii ─────────────────────────────────────────────────────────────
export const Radius = {
  card: 28,
  button: 18,
  tag: 16,
  sm: 12,
  circle: 9999,
} as const;

// ─── Shadows (Soft UI) ────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardStrong: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  tabBar: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 16,
  },
  button: {
    shadowColor: Colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ─── Minimum touch targets (WCAG) ─────────────────────────────────────────────
export const TouchTarget = {
  min: 48,  // dp
  action: 56,
  fab: 64,
} as const;

// ─── Common card style (reusable) ─────────────────────────────────────────────
export const cardStyle = {
  backgroundColor: Colors.bgCard,
  borderRadius: Radius.card,
  ...Shadows.card,
};

// ─── Helper: badge background with opacity ───────────────────────────────────
export function badgeBg(hex: string, opacity = 0.15): string {
  // Convert hex to rgba manually (simple version for 6-digit hex)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
