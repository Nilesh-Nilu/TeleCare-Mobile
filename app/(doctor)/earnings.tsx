import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGetDoctorEarningsQuery } from '../../src/store/apiSlice';
import { AppCard, AppHeader, StatusBadge, EmptyState, LoadingScreen } from '../../src/components';
import { formatCurrency, formatDate } from '../../src/utils/formatters';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Payment } from '../../src/types';

const periods = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export default function EarningsDashboardScreen() {
  const [period, setPeriod] = useState('month');
  const { data, isLoading } = useGetDoctorEarningsQuery({ period });
  const earnings = data?.data;

  if (isLoading && !earnings) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Earnings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroLabel}>Total Revenue</Text>
            <Text style={styles.heroValue}>{formatCurrency(earnings?.totalEarnings || 0)}</Text>
          </View>
          <View style={styles.heroPill}>
            <MaterialCommunityIcons name="chart-line" size={14} color={Colors.white} />
            <Text style={styles.heroPillText}>{period.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.periodSwitch}>
          {periods.map((item) => (
            <TouchableOpacity
              key={item.value}
              onPress={() => setPeriod(item.value)}
              style={[
                styles.periodTab,
                period === item.value && styles.periodTabActive,
              ]}
            >
              <Text
                style={[
                  styles.periodLabel,
                  period === item.value && styles.periodLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsRow}>
          <AppCard style={styles.statCard} padded={false}>
            <View style={styles.statContent}>
              <MaterialCommunityIcons name="wallet-outline" size={24} color={Colors.success} />
              <Text style={styles.statValue}>
                {formatCurrency(earnings?.totalEarnings || 0)}
              </Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </AppCard>
          <AppCard style={styles.statCard} padded={false}>
            <View style={styles.statContent}>
              <MaterialCommunityIcons name="calendar-month" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>
                {formatCurrency(earnings?.monthlyEarnings || 0)}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </AppCard>
        </View>

        <View style={styles.statsRow}>
          <AppCard style={styles.statCard} padded={false}>
            <View style={styles.statContent}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>
                {formatCurrency(earnings?.pendingPayout || 0)}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </AppCard>
          <AppCard style={styles.statCard} padded={false}>
            <View style={styles.statContent}>
              <MaterialCommunityIcons name="stethoscope" size={24} color={Colors.secondary} />
              <Text style={styles.statValue}>
                {earnings?.totalConsultations || 0}
              </Text>
              <Text style={styles.statLabel}>Consultations</Text>
            </View>
          </AppCard>
        </View>

        <Text style={styles.txTitle}>Recent Transactions</Text>
        {(earnings.transactions || []).length > 0 ? (
          earnings.transactions.map((tx: Payment) => (
            <AppCard key={tx.id} style={styles.txCard} padded={false}>
              <View style={styles.txContent}>
                <View style={styles.txInfo}>
                  <Text style={styles.txType}>
                    {tx.type === 'consultation' ? 'Consultation' : 'Subscription'}
                  </Text>
                  <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                </View>
                <View style={styles.txAmountCol}>
                  <Text style={styles.txAmount}>{formatCurrency(tx.amount)}</Text>
                  <StatusBadge status={tx.status} />
                </View>
              </View>
            </AppCard>
          ))
        ) : (
          <EmptyState
            icon="receipt"
            title="No transactions yet"
            subtitle="Your earnings will appear here"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FB' },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 120 },
  heroCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.size.sm,
  },
  heroValue: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: Typography.weight.bold,
    marginTop: 2,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  heroPillText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  periodSwitch: {
    flexDirection: 'row',
    backgroundColor: '#E8EEF6',
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  periodTab: {
    flex: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: Colors.white,
  },
  periodLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  periodLabelActive: {
    color: Colors.textPrimary,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 18 },
  statContent: { alignItems: 'center', paddingVertical: Spacing.md },
  statValue: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginTop: Spacing.sm },
  statLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 4 },
  txTitle: {
    fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  txCard: { backgroundColor: Colors.white, borderRadius: 16, marginBottom: Spacing.sm },
  txContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  txInfo: {},
  txType: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  txDate: { fontSize: Typography.size.sm, color: Colors.textTertiary, marginTop: 2 },
  txAmountCol: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
});
