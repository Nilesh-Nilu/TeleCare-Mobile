import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useGetMyAppointmentsQuery } from '../../../src/store/apiSlice';
import {
  AppHeader,
  FilterChips,
  AppointmentCard,
  EmptyState,
  ScreenContainer,
} from '../../../src/components';
import { Colors, Spacing } from '../../../src/theme';
import type { Appointment } from '../../../src/types';

const filters = ['all', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export default function MyAppointmentsScreen() {
  const [status, setStatus] = useState('all');
  const { data, isLoading, isFetching, refetch } = useGetMyAppointmentsQuery(
    status === 'all' ? {} : { status },
  );
  const appointments: Appointment[] = data?.data || [];

  return (
    <ScreenContainer>
      <AppHeader title="My Appointments" />
      <View style={styles.content}>
        <FilterChips options={filters} selected={status} onSelect={setStatus} />
        {isLoading && appointments.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={appointments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AppointmentCard appointment={item} role="patient" />}
            showsVerticalScrollIndicator={false}
            style={styles.flatList}
            contentContainerStyle={styles.list}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            ListEmptyComponent={
              <EmptyState
                icon="calendar-blank-outline"
                title="No appointments"
                subtitle="Your appointments will appear here"
              />
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  flatList: { flex: 1 },
  list: { flexGrow: 1, paddingBottom: Spacing.xxl },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

