import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '../theme';
import { formatDate, formatTime } from '../utils/formatters';
import { getDisplayName } from '../utils/name';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import type { Appointment } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
  role?: 'patient' | 'doctor';
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  role = 'patient',
}) => {
  const person = role === 'patient' ? appointment.doctor : appointment.patient;
  const displayName =
    role === 'patient'
      ? getDisplayName(person, { doctorPrefix: true, fallback: 'Doctor' })
      : getDisplayName(person, { fallback: 'Patient' });

  const handlePress = () => {
    if (role === 'doctor') {
      router.push(`/(doctor)/consultation/${appointment.id}` as any);
    } else {
      router.push(`/(patient)/appointments/${appointment.id}` as any);
    }
  };

  const displayDate = appointment.date || appointment.startTime || appointment.createdAt;
  const displayTime = appointment.startTime || appointment.date || appointment.createdAt;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Avatar name={displayName} size={48} uri={person?.avatar} />
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <StatusBadge status={appointment.status} />
          </View>
          <View style={styles.schedule}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={14}
              color={Colors.textTertiary}
            />
            <Text style={styles.scheduleText}>
              {formatDate(displayDate)}
            </Text>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={Colors.textTertiary}
              style={styles.clockIcon}
            />
            <Text style={styles.scheduleText}>
              {formatTime(displayTime)}
            </Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.md,
  },
  schedule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  scheduleText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  clockIcon: {
    marginLeft: Spacing.sm,
  },
});
