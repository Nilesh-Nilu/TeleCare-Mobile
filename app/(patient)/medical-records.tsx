import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Card, Text, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useGetMedicalRecordsQuery } from '../../src/store/apiSlice';
import { AppHeader, FilterChips, EmptyState } from '../../src/components';
import { formatDate } from '../../src/utils/formatters';
import { Colors } from '../../src/theme';
import type { MedicalRecord } from '../../src/types';

const typeIcons: Record<string, string> = {
  consultation: 'stethoscope',
  report: 'file-chart-outline',
  lab_result: 'test-tube',
  imaging: 'image-outline',
};
const filters = ['all', 'consultation', 'report', 'lab_result', 'imaging'];

export default function MedicalHistoryScreen() {
  const [type, setType] = useState('all');
  const { data, isLoading, isFetching, refetch } = useGetMedicalRecordsQuery(
    type === 'all' ? {} : { type },
  );
  const records: MedicalRecord[] = data?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Medical Records" showBack />
      <View style={styles.content}>
        <FilterChips options={filters} selected={type} onSelect={setType} />
        {isLoading && records.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons
                      name={(typeIcons[item.type] || 'file-outline') as any}
                      size={22}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.info}>
                    <Text variant="titleSmall" style={styles.title} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.doctor && (
                      <Text variant="bodySmall" style={styles.doctor}>
                        Dr. {item.doctor.firstName} {item.doctor.lastName}
                      </Text>
                    )}
                    <Text variant="labelSmall" style={styles.date}>
                      {formatDate(item.date)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
                </Card.Content>
              </Card>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="folder-open-outline"
                title="No records found"
                subtitle="Upload your medical reports to keep them organized"
                actionLabel="Upload Report"
                onAction={() => router.push('/(patient)/upload-reports')}
              />
            }
          />
        )}
      </View>
      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.white}
        onPress={() => router.push('/(patient)/upload-reports')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  list: { paddingBottom: 80, flexGrow: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontWeight: '600', color: Colors.textPrimary },
  doctor: { color: Colors.textSecondary, marginTop: 2 },
  date: { color: Colors.textTertiary, marginTop: 2 },
  fab: {
    position: 'absolute', right: 16, bottom: 24,
    backgroundColor: Colors.primary, borderRadius: 16,
  },
});
