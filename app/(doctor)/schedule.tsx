import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Switch } from 'react-native-paper';
import { useAppSelector } from '../../src/store';
import { useGetDoctorScheduleQuery } from '../../src/store/apiSlice';
import { AppCard, AppHeader, LoadingScreen, ScreenContainer } from '../../src/components';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { DoctorSchedule } from '../../src/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityManagerScreen() {
  const { user } = useAppSelector((s) => s.auth);
  const { data, isLoading } = useGetDoctorScheduleQuery(Number(user?.id));
  const schedules: DoctorSchedule[] = data?.data || [];

  if (isLoading) return <LoadingScreen />;

  const schedulesMap = new Map(schedules.map((s) => [s.dayOfWeek, s]));

  return (
    <ScreenContainer>
      <AppHeader title="Availability" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          Set your availability for each day of the week
        </Text>

        {DAY_NAMES.map((day, idx) => {
          const schedule = schedulesMap.get(idx);
          const isActive = schedule?.isActive ?? false;

          return (
            <AppCard key={idx} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day}</Text>
                    {schedule && isActive && (
                      <Text style={styles.dayTime}>
                        {schedule.startTime} - {schedule.endTime} ({schedule.slotDuration}min)
                      </Text>
                    )}
                    {!isActive && <Text style={styles.dayOff}>Day Off</Text>}
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={() => {
                      Alert.alert('Info', 'Schedule editing will be available with API integration');
                    }}
                    color={Colors.secondary}
                  />
                </View>

                {schedule && isActive && schedule.breaks && schedule.breaks.length > 0 && (
                  <View style={styles.breaks}>
                    <Text style={styles.breakLabel}>Breaks:</Text>
                    {schedule.breaks.map((b, i) => (
                      <Text key={i} style={styles.breakTime}>
                        {b.startTime} - {b.endTime}
                      </Text>
                    ))}
                  </View>
                )}
            </AppCard>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  subtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeight.normal,
  },
  dayCard: { backgroundColor: Colors.white, borderRadius: Radius.md, marginBottom: Spacing.sm },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayInfo: { flex: 1 },
  dayName: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  dayTime: { fontSize: Typography.size.sm, color: Colors.secondary, marginTop: Spacing.xs },
  dayOff: { fontSize: Typography.size.sm, color: Colors.textTertiary, marginTop: Spacing.xs },
  breaks: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  breakLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  breakTime: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: Spacing.xxs },
});
