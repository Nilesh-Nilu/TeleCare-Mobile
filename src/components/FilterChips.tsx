import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface FilterChipsProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ options, selected, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <Chip
            key={option}
            selected={isSelected}
            mode={isSelected ? 'flat' : 'outlined'}
            onPress={() => onSelect(option)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            textStyle={[styles.chipText, isSelected && styles.chipTextSelected]}
            showSelectedOverlay={false}
            compact={false}
          >
            {option.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Chip>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  chip: {
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    minHeight: 42,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    lineHeight: 18,
    paddingVertical: 1,
  },
  chipTextSelected: {
    color: Colors.white,
  },
});
