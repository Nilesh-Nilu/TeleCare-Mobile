import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface QuickActionProps {
  icon: React.ReactNode | string;
  label: string;
  color: string;
  onPress: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({ icon, label, color, onPress }) => {
  const iconElement =
    typeof icon === 'string' ? (
      <MaterialCommunityIcons name={icon as any} size={28} color={color} />
    ) : (
      icon
    );

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        {iconElement}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '31%',
    marginBottom: Spacing.md,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
});
