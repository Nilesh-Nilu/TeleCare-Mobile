import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Colors, Radius, Spacing, Typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  mode?: 'text' | 'outlined' | 'contained';
  variant?: ButtonVariant;
  textColor?: string;
  buttonColor?: string;
  borderColor?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  disabled,
  loading,
  mode,
  variant = 'primary',
  textColor,
  buttonColor,
  borderColor,
}) => {
  const isPrimary = variant === 'primary';

  return (
    <Button
      mode={mode ?? (isPrimary ? 'contained' : 'outlined')}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        buttonColor ? { backgroundColor: buttonColor } : undefined,
        borderColor ? { borderColor } : undefined,
      ]}
      contentStyle={styles.content}
      labelStyle={styles.label}
      textColor={textColor ?? (isPrimary ? Colors.white : Colors.primary)}
    >
      {label}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
  },
  primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  content: {
    paddingVertical: Spacing.sm,
  },
  label: {
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.lg,
    letterSpacing: 0.5,
  },
});
