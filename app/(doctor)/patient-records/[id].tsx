import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useGetPatientRecordsQuery } from '../../../src/store/apiSlice';
import { AppHeader, EmptyState, LoadingScreen } from '../../../src/components';
import { formatDate } from '../../../src/utils/formatters';
import { Colors } from '../../../src/theme';
import type { MedicalRecord } from '../../../src/types';

const typeIcons: Record<string, string> = {
  consultation: 'stethoscope',
  report: 'file-chart-outline',
  lab_result: 'test-tube',
  imaging: 'image-outline',
};

export default function PatientRecordsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, refetch } = useGetPatientRecordsQuery(Number(id));
  const records: MedicalRecord[] = data?.data || [];

  if (isLoading && records.length === 0) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Patient Records" showBack />
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons
                  name={(typeIcons[item.type] || 'file-outline') as any}
                  size={22}
                  color={Colors.secondary}
                />
              </View>
              <View style={styles.info}>
                <Text variant="titleSmall" style={styles.title}>{item.title}</Text>
                {item.description && (
                  <Text variant="bodySmall" style={styles.desc} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <Text variant="labelSmall" style={styles.date}>{formatDate(item.date)}</Text>
              </View>
              <Text style={styles.typeBadge}>
                {item.type.replace(/_/g, ' ')}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="No records"
            subtitle="No medical records found for this patient"
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
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.secondary + '12', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontWeight: '600', color: Colors.textPrimary },
  desc: { color: Colors.textSecondary, marginTop: 2 },
  date: { color: Colors.textTertiary, marginTop: 4 },
  typeBadge: {
    fontSize: 10, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'capitalize', backgroundColor: Colors.background,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
});
