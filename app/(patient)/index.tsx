import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppSelector } from '../../src/store';
import {
  useGetMyAppointmentsQuery,
  useGetDoctorsQuery,
  useGetMyNotificationsQuery,
} from '../../src/store/apiSlice';
import {
  Avatar,
  SectionHeader,
  AppointmentCard,
  DoctorCard,
  EmptyState,
  ScreenContainer,
} from '../../src/components';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

const quickActions = [
  { icon: 'video-outline', label: 'Consult', color: Colors.primary, route: '/(patient)/doctors' },
  { icon: 'calendar-outline', label: 'Appointments', color: Colors.info, route: '/(patient)/appointments' },
  { icon: 'file-document-outline', label: 'Prescriptions', color: Colors.accent, route: '/(patient)/prescriptions' },
  { icon: 'star-outline', label: 'Plans', color: Colors.warning, route: '/(patient)/subscription' },
  { icon: 'folder-outline', label: 'Records', color: Colors.secondary, route: '/(patient)/records' },
  { icon: 'heart-pulse', label: 'Vitals', color: Colors.error, route: '/(patient)/vitals' },
] as const;

export default function PatientHomeScreen() {
  const { user } = useAppSelector((s) => s.auth);
  const { data: apptData, refetch: refetchAppts } =
    useGetMyAppointmentsQuery({ status: 'scheduled', limit: 3 });
  const { data: doctorData } = useGetDoctorsQuery({ limit: 5 });
  const { data: notifData } = useGetMyNotificationsQuery(undefined);

  const appointments = apptData?.data || [];
  const doctors = doctorData?.data || [];
  const unreadCount =
    (notifData?.data || []).filter((n: { isRead: boolean }) => !n.isRead).length;

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAppts();
    setRefreshing(false);
  };

  const fullName = user ? `${user.firstName}` : 'User';
  const upcomingCount = appointments.length;

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <View style={styles.heroBanner}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.push('/(patient)/profile')}>
                <Avatar name={fullName} size={48} uri={user?.avatar} />
              </TouchableOpacity>
              <View style={styles.greeting}>
                <Text style={styles.greetingLabel}>Good {getTimeGreeting()}</Text>
                <Text style={styles.greetingName}>{fullName}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(patient)/notifications')}
              style={styles.notifBtn}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.heroSubtext}>Your health journey, all in one place.</Text>
        </View>

        <View style={styles.metricsRow}>
          <MetricCard
            icon="calendar-check-outline"
            label="Upcoming"
            value={String(upcomingCount)}
            color={Colors.primary}
          />
          <MetricCard
            icon="bell-ring-outline"
            label="Alerts"
            value={String(unreadCount)}
            color={Colors.warning}
          />
        </View>

        {/* <TouchableOpacity
          style={styles.searchTeaser}
          activeOpacity={0.85}
          onPress={() => router.push('/(patient)/doctors')}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textTertiary} />
          <Text style={styles.searchPlaceholder}>Search doctors, specialties, clinics...</Text>
        </TouchableOpacity> */}

        <SectionHeader
          title="Quick Actions"
          actionLabel="All Services"
          onAction={() => router.push('/(patient)/settings')}
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

        {/* Top Doctors */}
        <SectionHeader
          title="Top Doctors"
          actionLabel="View All"
          onAction={() => router.push('/(patient)/doctors')}
        />
        {doctors.map((doc: any) => (
          <DoctorCard key={doc.id} doctor={doc} />
        ))}

        <View style={styles.bottomPad} />
      </ScrollView>
    </ScreenContainer>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F6FB',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  heroBanner: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: Spacing.lg,
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
  heroSubtext: {
    marginTop: Spacing.md,
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.size.md,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    borderRadius: Radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    marginTop: 4,
  },
  searchTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchPlaceholder: {
    color: Colors.textTertiary,
    fontSize: Typography.size.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
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
    width: 38,
    height: 38,
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
  bottomPad: { height: Spacing.sm },
});
