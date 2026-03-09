import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors, Spacing } from '../theme';
import { getInitials } from '../utils/formatters';

interface AvatarProps {
  name: string;
  size?: number;
  uri?: string;
  borderColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 40,
  uri,
  borderColor,
}) => {
  const fontSize = size * 0.38;
  const ring = borderColor ?? Colors.white;
  const borderWidth = size >= 48 ? 2.5 : 2;

  if (uri) {
    return (
      <View
        style={[
          styles.ring,
          {
            width: size + borderWidth * 2 + 2,
            height: size + borderWidth * 2 + 2,
            borderRadius: (size + borderWidth * 2 + 2) / 2,
            borderColor: ring,
            borderWidth,
          },
        ]}
      >
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.ring,
        {
          width: size + borderWidth * 2 + 2,
          height: size + borderWidth * 2 + 2,
          borderRadius: (size + borderWidth * 2 + 2) / 2,
          borderColor: ring,
          borderWidth,
        },
      ]}
    >
      <View
        style={[
          styles.initialsContainer,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsContainer: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
});
