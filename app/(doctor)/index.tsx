import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppSelector } from '../../src/store';
import {
  useGetDoctorDashboardQuery,
  useGetDoctorQueueQuery,
} from '../../src/store/apiSlice';
import {
  Avatar,
  SectionHeader,
  AppointmentCard,
  EmptyState,
  AppCard,
  ScreenContainer,
} from '../../src/components';
import { formatCurrency } from '../../src/utils/formatters';
import { getDisplayName } from '../../src/utils/name';
import { Colors, Spacing, Typography } from '../../src/theme';

const quickActions = [
  { icon: 'account-group-outline', label: 'Queue', color: Colors.primary, route: '/(doctor)/queue' },
  { icon: 'clock-outline', label: 'Schedule', color: Colors.info, route: '/(doctor)/schedule' },
  { icon: 'wallet-outline', label: 'Earnings', color: Colors.success, route: '/(doctor)/earnings' },
  { icon: 'account-outline', label: 'Profile', color: Colors.accent, route: '/(doctor)/profile' },
] as const;

export default function DoctorHomeScreen() {
  const { user } = useAppSelector((s) => s.auth);
  const { data: dashData, refetch } = useGetDoctorDashboardQuery(undefined);
  const { data: queueData } = useGetDoctorQueueQuery({});

  const dashboard = dashData?.data || {};
  const queue = (queueData?.data || []).slice(0, 3);
  const fullName = getDisplayName(user, { doctorPrefix: true, fallback: 'Doctor' });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.secondary]} />
        }
      >
        <View style={styles.heroBanner}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <View style={styles.headerLeft}>
              <Avatar name={fullName} size={48} uri={user?.avatar} />
              <View style={styles.greeting}>
                <Text style={styles.greetingLabel}>Welcome back</Text>
                <Text style={styles.greetingName}>{fullName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.85}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.heroFooter}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color={Colors.white} />
              <Text style={styles.heroBadgeText}>Verified Doctor</Text>
            </View>
            <Text style={styles.heroMeta}>Your dashboard is up to date</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="account-group"
              label="Today Patients"
              value={String(dashboard.todayPatients || 0)}
              color={Colors.primary}
            />
            <StatCard
              icon="currency-inr"
              label="Today Earnings"
              value={formatCurrency(dashboard.todayEarnings || 0)}
              color={Colors.success}
            />
            <StatCard
              icon="clock-alert-outline"
              label="Pending"
              value={String(dashboard.pendingCount || 0)}
              color={Colors.warning}
            />
          </View>
        </View>

        <SectionHeader
          title="Quick Actions"
          actionLabel="Manage"
          onAction={() => router.push('/(doctor)/profile')}
        />
        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <QuickActionTile
              key={a.label}
              icon={a.icon as string}
              label={a.label}
              color={a.color}
              onPress={() => router.push(a.route as any)}
            />
          ))}
        </View>

        <SectionHeader
          title="Next Patients"
          actionLabel={queue.length > 0 ? 'View Queue' : undefined}
          onAction={() => router.push('/(doctor)/queue')}
        />
        {queue.length > 0 ? (
          queue.map((appt: any) => (
            <AppointmentCard key={appt.id} appointment={appt} role="doctor" />
          ))
        ) : (
          <EmptyState
            icon="account-group-outline"
            title="No patients in queue"
            subtitle="Your upcoming patients will appear here"
          />
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </ScreenContainer>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) {
  return (
    <AppCard style={styles.statCard} padded={false}>
      <View style={styles.statContent}>
        <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </AppCard>
  );
}

function QuickActionTile({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionIconBox, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F6FB',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  heroBanner: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderRadius: 28,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -40,
    top: -50,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  greeting: {},
  greetingLabel: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.82)',
  },
  greetingName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroFooter: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.size.xs,
  },
  statsContainer: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 20 },
  statContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: 6,
  },
  statIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  actionTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  bottomPad: { height: Spacing.xxl },
});
