import { MD3LightTheme } from 'react-native-paper';
import { Colors } from './colors';
import { Radius } from './radius';

export { Colors } from './colors';
export { Radius } from './radius';
export { Shadows } from './shadows';
export { Spacing } from './spacing';
export { Typography } from './typography';

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryLight,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryLight,
    tertiary: Colors.accent,
    surface: Colors.surface,
    surfaceVariant: Colors.background,
    background: Colors.background,
    error: Colors.error,
    errorContainer: Colors.errorLight,
    onPrimary: Colors.white,
    onSecondary: Colors.white,
    onSurface: Colors.textPrimary,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    outlineVariant: Colors.divider,
  },
  roundness: Radius.lg,
};

export type AppTheme = typeof paperTheme;
