import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  const iconElement =
    typeof icon === 'string' ? (
      <MaterialCommunityIcons name={icon as any} size={36} color={Colors.textTertiary} />
    ) : (
      icon
    );

  return (
    <View style={styles.container}>
      {iconElement && (
        <View style={styles.iconCircle}>{iconElement}</View>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button
          mode="outlined"
          onPress={onAction}
          style={styles.actionBtn}
          labelStyle={styles.actionLabel}
          compact
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.jumbo,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.lg,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontSize: Typography.size.md,
    lineHeight: Typography.lineHeight.normal,
  },
  actionBtn: {
    marginTop: Spacing.xl,
    borderRadius: Radius.md,
    borderColor: Colors.primary,
  },
  actionLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});
