import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Chip, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../src/store';
import { useGetProfileQuery } from '../../src/store/apiSlice';
import { logout } from '../../src/slices/authSlice';
import { setAccessToken } from '../../src/services/api';
import { AppButton, AppCard, Avatar, LoadingScreen, ScreenContainer } from '../../src/components';
import { formatCurrency } from '../../src/utils/formatters';
import { getDisplayName } from '../../src/utils/name';
import { confirmAlert } from '../../src/utils/alert';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function DoctorProfileEditScreen() {
  const { user } = useAppSelector((s) => s.auth);
  console.log(user)
  const dispatch = useAppDispatch();
  const { data } = useGetProfileQuery(undefined);
  const profile = data?.data || user;

  if (!profile) return <LoadingScreen />;

  const fullName = getDisplayName(profile, { doctorPrefix: true, fallback: 'Doctor' });
  const specialty = (profile as any).specialty || 'Specialist';
  const registrationNumber = (profile as any).registrationNumber || 'N/A';
  const infoItems = [
    { label: 'Email', value: profile.email || 'N/A' },
    { label: 'Phone', value: profile.phone || 'N/A' },
    { label: 'Experience', value: `${(profile as any).experience || 0} years` },
    { label: 'Consultation Fee', value: formatCurrency((profile as any).consultationFee || 0) },
  ];

  const handleLogout = () => {
    confirmAlert('Logout', 'Are you sure you want to log out?', () => {
      dispatch(logout());
      setAccessToken(null);
      router.replace('/(auth)/login');
    }, undefined, 'Logout');
  };

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>Doctor Profile</Text>
            <TouchableOpacity style={styles.editPill} activeOpacity={0.85}>
              <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.white} />
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.profileRow}>
            <Avatar name={fullName} size={82} uri={profile.avatar} />
            <View style={styles.profileMeta}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.specialty}>{specialty}</Text>
              <View style={styles.regPill}>
                <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.secondary} />
                <Text style={styles.regText}>Reg: {registrationNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        <AppCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Professional Info</Text>
          {infoItems.map((item, index) => (
            <InfoRow
              key={item.label}
              label={item.label}
              value={item.value}
              showDivider={index < infoItems.length - 1}
            />
          ))}
        </AppCard>

        {(profile as any).qualifications && (
          <AppCard style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Qualifications</Text>
              <View style={styles.chipRow}>
                {((profile as any).qualifications || []).map((q: string, i: number) => (
                  <Chip key={i} style={styles.chip} textStyle={styles.chipText}>{q}</Chip>
                ))}
              </View>
          </AppCard>
        )}

        {(profile as any).languages && (
          <AppCard style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.chipRow}>
                {((profile as any).languages || []).map((l: string, i: number) => (
                  <Chip key={i} style={styles.chip} textStyle={styles.chipText}>{l}</Chip>
                ))}
              </View>
          </AppCard>
        )}

        {(profile as any).bio && (
          <AppCard style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Bio</Text>
              <Text style={styles.bioText}>{(profile as any).bio}</Text>
          </AppCard>
        )}

        <AppCard style={styles.infoCard} padded={false}>
          <List.Item
            title="Settings"
            titleStyle={styles.settingsTitle}
            left={(p) => <List.Icon {...p} icon="cog-outline" color={Colors.textSecondary} />}
            right={(p) => <List.Icon {...p} icon="chevron-right" color={Colors.textTertiary} />}
            style={styles.settingsRow}
            onPress={() => {}}
          />
        </AppCard>

        <View style={styles.logoutWrap}>
          <AppButton
            label="Log Out"
            onPress={handleLogout}
            variant="secondary"
            mode="outlined"
            textColor={Colors.error}
            borderColor={Colors.error}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ label, value, showDivider }: { label: string; value: string; showDivider?: boolean }) {
  return (
    <View style={[infoRowStyles.row, showDivider && infoRowStyles.rowDivider]}>
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#EDF1F6' },
  label: { fontSize: Typography.size.md, color: Colors.textSecondary },
  value: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F6FB',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.3,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  editPillText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  profileMeta: {
    flex: 1,
  },
  name: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  specialty: { fontSize: Typography.size.md, color: Colors.secondary, marginTop: 4 },
  regPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: Colors.secondary + '12',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  regText: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { backgroundColor: Colors.background },
  chipText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  bioText: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.relaxed,
  },
  settingsRow: {
    paddingVertical: Spacing.xs,
  },
  settingsTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  logoutWrap: { marginTop: Spacing.xs },
});
