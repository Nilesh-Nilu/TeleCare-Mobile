import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { useGetDoctorQueueQuery } from '../../src/store/apiSlice';
import { AppHeader, Avatar, StatusBadge, EmptyState, LoadingScreen } from '../../src/components';
import { formatTime } from '../../src/utils/formatters';
import { getDisplayName } from '../../src/utils/name';
import { Colors } from '../../src/theme';
import type { Appointment } from '../../src/types';

export default function PatientQueueScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data, isLoading, refetch } = useGetDoctorQueueQuery({ date: today });
  const queue: Appointment[] = data?.data || [];

  if (isLoading && queue.length === 0) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Patient Queue" showBack />
      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={({ item, index }) => {
          const patient = item.patient;
          const patientName = getDisplayName(patient, { fallback: 'Patient' });
          const normalizedStatus = String(item.status || '').toLowerCase();
          const canStart = ['booked', 'scheduled', 'confirmed', 'in_progress'].includes(normalizedStatus);
          const isNext = index === 0 && canStart;

          return (
            <Card style={[styles.card, isNext && styles.nextCard]}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.queueNum}>
                  <Text style={styles.queueNumText}>{index + 1}</Text>
                </View>
                <Avatar name={patientName} size={44} uri={patient?.avatar} />
                <View style={styles.info}>
                  <Text style={styles.patientName}>{patientName}</Text>
                  <View style={styles.timeRow}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <StatusBadge status={item.status} />
                  {canStart && (
                    <Button
                      mode="contained"
                      compact
                      onPress={() => router.push(`/(doctor)/consultation/${item.id}`)}
                      style={styles.startBtn}
                      buttonColor={Colors.secondary}
                    >
                      Start
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="account-group-outline"
            title="Queue is empty"
            subtitle="No patients scheduled for today"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 10 },
  nextCard: { borderLeftWidth: 3, borderLeftColor: Colors.secondary },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  queueNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  queueNumText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  info: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 12, color: Colors.textSecondary },
  actions: { alignItems: 'flex-end', gap: 6 },
  startBtn: { borderRadius: 8 },
});
