import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Colors, Radius, Shadows, Spacing, Typography } from '../theme';

interface SearchBarProps {
  value: string;
  onChange?: (value: string) => void;
  onChangeText?: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onChangeText,
  placeholder = 'Search...',
}) => {
  return (
    <View style={styles.wrapper}>
      <Searchbar
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText || onChange}
        style={styles.searchbar}
        inputStyle={styles.input}
        iconColor={Colors.textTertiary}
        placeholderTextColor={Colors.placeholder}
        elevation={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: Spacing.sm,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  searchbar: {
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  input: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
});
