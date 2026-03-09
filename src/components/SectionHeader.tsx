import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {actionLabel && onAction && (
        <TouchableRipple onPress={onAction} borderless style={styles.actionButton}>
          <View style={styles.actionInner}>
            <Text style={styles.action}>{actionLabel}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={Colors.primary}
            />
          </View>
        </TouchableRipple>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.lg,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  actionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  action: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.sm,
  },
});
