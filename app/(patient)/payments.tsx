import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGetPaymentHistoryQuery } from '../../src/store/apiSlice';
import { AppHeader, StatusBadge, EmptyState, LoadingScreen } from '../../src/components';
import { formatCurrency, formatDate } from '../../src/utils/formatters';
import { Colors } from '../../src/theme';
import type { Payment } from '../../src/types';

export default function PaymentHistoryScreen() {
  const { data, isLoading, refetch } = useGetPaymentHistoryQuery(undefined);
  const payments: Payment[] = data?.data || [];

  if (isLoading && payments.length === 0) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Payment History" showBack />
      <FlatList
        data={payments}
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
                  name={item.type === 'subscription' ? 'star-outline' : 'video-outline'}
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.info}>
                <Text variant="titleSmall" style={styles.title}>
                  {item.type === 'subscription' ? 'Subscription' : 'Consultation'}
                </Text>
                <Text variant="labelSmall" style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.amountCol}>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                <StatusBadge status={item.status} />
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt"
            title="No payments"
            subtitle="Your payment history will appear here"
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
    backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontWeight: '600', color: Colors.textPrimary },
  date: { color: Colors.textTertiary, marginTop: 2 },
  amountCol: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
});
