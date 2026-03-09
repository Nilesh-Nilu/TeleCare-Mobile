import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Radius, Spacing, Typography } from '../theme';
import { STATUS_COLORS } from '../utils/constants';

interface StatusBadgeProps {
  status: string;
}

const DEFAULT_COLOR = '#94A3B8';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = String(status || '').toLowerCase();
  const color = STATUS_COLORS[normalizedStatus] ?? DEFAULT_COLOR;
  const label = normalizedStatus
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={[styles.badge, { backgroundColor: color + '14' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1,
    borderRadius: Radius.full,
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
});
