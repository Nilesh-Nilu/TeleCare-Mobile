import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useGetMyPrescriptionsQuery } from '../../../src/store/apiSlice';
import { AppHeader, EmptyState, Avatar } from '../../../src/components';
import { formatDate } from '../../../src/utils/formatters';
import { getDisplayName } from '../../../src/utils/name';
import { Colors } from '../../../src/theme';
import type { Prescription } from '../../../src/types';

export default function PrescriptionListScreen() {
  const { data, isLoading, isFetching, refetch } = useGetMyPrescriptionsQuery(undefined);
  const prescriptions: Prescription[] = data?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Prescriptions" />
      {isLoading && prescriptions.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isFetching && !isLoading}
          renderItem={({ item }) => {
            const docName = getDisplayName(item.doctor, { doctorPrefix: true, fallback: 'Doctor' });
            return (
              <Card
                style={styles.card}
                onPress={() => router.push(`/(patient)/prescriptions/${item.id}`)}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color={Colors.accent} />
                  </View>
                  <View style={styles.info}>
                    <Text variant="titleSmall" style={styles.diagnosis} numberOfLines={1}>
                      {item.diagnosis}
                    </Text>
                    <Text variant="bodySmall" style={styles.doctor}>{docName}</Text>
                    <Text variant="labelSmall" style={styles.date}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
                </Card.Content>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="file-document-outline"
              title="No prescriptions"
              subtitle="Your prescriptions will appear here after doctor upload"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  diagnosis: { fontWeight: '600', color: Colors.textPrimary },
  doctor: { color: Colors.textSecondary, marginTop: 2 },
  date: { color: Colors.textTertiary, marginTop: 2 },
});
