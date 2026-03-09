import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { getDisplayName } from '../utils/name';
import { Avatar } from './Avatar';
import type { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const fullName = getDisplayName(doctor, { doctorPrefix: true, fallback: 'Doctor' });
  const rating =
    typeof doctor.rating === 'number' && Number.isFinite(doctor.rating) ? doctor.rating : 0;
  const totalReviews = doctor.totalReviews || 0;
  const consultationFee = doctor.consultationFee || 0;
  const specialty = doctor.specialty || 'General Physician';

  const handlePress = () => {
    router.push(`/(patient)/doctors/${doctor.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Avatar name={fullName} size={52} uri={doctor.avatar} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {specialty}
          </Text>

          <View style={styles.meta}>
            <View style={styles.rating}>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color={Colors.warning}
              />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({totalReviews})
              </Text>
            </View>

            <View style={styles.feeChip}>
              <Text style={styles.feeText}>
                {formatCurrency(consultationFee)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.md,
  },
  specialty: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    marginTop: Spacing.xxs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  ratingText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  reviewCount: {
    color: Colors.textTertiary,
    fontSize: Typography.size.sm,
  },
  feeChip: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.sm,
  },
  feeText: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },
});
