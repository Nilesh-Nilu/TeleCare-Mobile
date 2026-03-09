import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Divider, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useGetSubscriptionStatusQuery, useRenewSubscriptionMutation } from '../../../src/store/apiSlice';
import { AppHeader, LoadingScreen, EmptyState } from '../../../src/components';
import { formatDate } from '../../../src/utils/formatters';
import { Colors } from '../../../src/theme';

export default function ActiveSubscriptionScreen() {
  const { data, isLoading } = useGetSubscriptionStatusQuery(undefined);
  const [renew, { isLoading: renewing }] = useRenewSubscriptionMutation();
  const sub = data?.data;

  if (isLoading) return <LoadingScreen />;
  if (!sub || sub.status !== 'active') {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Subscription" showBack />
        <EmptyState
          icon="star-off-outline"
          title="No Active Plan"
          subtitle="Subscribe to a plan to start your consultations"
          actionLabel="View Plans"
          onAction={() => router.push('/(patient)/subscription')}
        />
      </SafeAreaView>
    );
  }

  const isPremium = sub.plan?.tier === 'PREMIUM';
  const usage = sub.plan?.maxConsultations
    ? sub.consultationsUsed / sub.plan.maxConsultations
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="My Subscription" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.planCard}>
          <Card.Content>
            <View style={styles.planHeader}>
              <MaterialCommunityIcons name="shield-check" size={28} color={Colors.success} />
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{sub.plan?.name}</Text>
                <Text style={styles.planStatus}>Active</Text>
              </View>
            </View>

            <View style={[styles.tierChip, { backgroundColor: isPremium ? '#8B5CF618' : '#3B82F618' }]}>
              <MaterialCommunityIcons
                name={isPremium ? 'video' : 'phone'}
                size={16}
                color={isPremium ? '#8B5CF6' : '#3B82F6'}
              />
              <Text style={[styles.tierText, { color: isPremium ? '#8B5CF6' : '#3B82F6' }]}>
                {isPremium ? 'Premium — Video + Voice Calling' : 'Base — Voice Calling Only'}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Start Date</Text>
              <Text style={styles.value}>{formatDate(sub.startDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>End Date</Text>
              <Text style={styles.value}>{formatDate(sub.endDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Auto Renew</Text>
              <Text style={styles.value}>{sub.autoRenew ? 'Yes' : 'No'}</Text>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.usageTitle}>Usage</Text>
            <View style={styles.usageRow}>
              <Text style={styles.usageText}>
                {sub.consultationsUsed} / {sub.plan?.maxConsultations} consultations
              </Text>
              <Text style={styles.usagePercent}>{Math.round(usage * 100)}%</Text>
            </View>
            <ProgressBar
              progress={usage}
              color={usage > 0.8 ? Colors.warning : Colors.primary}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        {!isPremium && (
          <Card style={styles.upgradeCard}>
            <Card.Content style={styles.upgradeContent}>
              <MaterialCommunityIcons name="arrow-up-circle" size={24} color="#8B5CF6" />
              <View style={styles.upgradeInfo}>
                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeDesc}>Get video consultations with your doctor</Text>
              </View>
              <Button
                mode="contained"
                compact
                onPress={() => router.push('/(patient)/subscription')}
                buttonColor="#8B5CF6"
                style={styles.upgradeBtn}
              >
                Upgrade
              </Button>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="outlined"
          onPress={() => renew({ subscriptionId: Number(sub.id) })}
          loading={renewing}
          style={styles.renewBtn}
          icon="refresh"
        >
          Renew Subscription
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 24 },
  planCard: { backgroundColor: Colors.white, borderRadius: 16, marginBottom: 16 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planInfo: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  planStatus: { fontSize: 13, color: Colors.success, fontWeight: '600', marginTop: 2 },
  tierChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 12,
  },
  tierText: { fontSize: 12, fontWeight: '700' },
  divider: { marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  usageTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  usageText: { fontSize: 13, color: Colors.textSecondary },
  usagePercent: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  progressBar: { height: 6, borderRadius: 3 },
  upgradeCard: { backgroundColor: '#F5F3FF', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#8B5CF630' },
  upgradeContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeInfo: { flex: 1 },
  upgradeTitle: { fontSize: 14, fontWeight: '700', color: '#8B5CF6' },
  upgradeDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  upgradeBtn: { borderRadius: 10 },
  renewBtn: { borderRadius: 12, borderColor: Colors.primary },
});
