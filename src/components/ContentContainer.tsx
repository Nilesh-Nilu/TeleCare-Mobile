import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Spacing } from '../theme';

interface ContentContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  scroll = false,
  style,
  contentStyle,
}) => {
  if (scroll) {
    return (
      <ScrollView
        style={[styles.base, style]}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.base, styles.fill, contentStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.lg,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
