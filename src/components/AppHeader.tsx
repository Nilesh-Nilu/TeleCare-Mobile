import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '../theme';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack, actions }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {showBack ? (
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={Colors.textPrimary}
            onPress={() => router.back()}
            style={styles.backButton}
          />
        ) : (
          <View style={styles.spacer} />
        )}

        <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.actions}>{actions ?? <View style={styles.spacer} />}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    ...Shadows.md,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.xs,
  },
  backButton: {
    margin: 0,
    borderRadius: Radius.full,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semibold,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    width: 48,
  },
});
