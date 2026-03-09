import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../theme';

type Variant = 'flat' | 'outlined' | 'elevated';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: Variant;
  padded?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  variant = 'flat',
  padded = true,
}) => {
  return (
    <View style={[styles.base, padded && styles.padded, stylesByVariant[variant], style]}>
      {children}
    </View>
  );
};

const stylesByVariant = StyleSheet.create({
  flat: {
    backgroundColor: Colors.card,
  },
  outlined: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    backgroundColor: Colors.card,
    ...Shadows.md,
  },
});

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
  },
  padded: {
    padding: Spacing.lg,
  },
});
