import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useGetDoctorByIdQuery } from '../../../src/store/apiSlice';
import { AppHeader, Avatar, LoadingScreen } from '../../../src/components';
import { formatCurrency } from '../../../src/utils/formatters';
import { getDisplayName } from '../../../src/utils/name';
import { Colors } from '../../../src/theme';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useGetDoctorByIdQuery(Number(id));

  if (isLoading) return <LoadingScreen />;

  const doctor = data?.data;
  if (!doctor) return <LoadingScreen />;

  const fullName = getDisplayName(doctor, { doctorPrefix: true, fallback: 'Doctor' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Doctor Profile" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <Avatar name={fullName} size={80} uri={doctor.avatar} />
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.specialty}>{doctor.specialty}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="star" size={20} color={Colors.warning} />
              <Text style={styles.statValue}>{doctor.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MaterialCommunityIcons name="briefcase-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{doctor.experience || 0}+</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color={Colors.secondary} />
              <Text style={styles.statValue}>{doctor.totalReviews || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{doctor.bio || 'No bio available.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Qualifications</Text>
          <View style={styles.chipRow}>
            {(doctor.qualifications || []).map((q: string, i: number) => (
              <Chip key={i} style={styles.chip} textStyle={styles.chipText}>{q}</Chip>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.chipRow}>
            {(doctor.languages || []).map((l: string, i: number) => (
              <Chip key={i} style={styles.chip} textStyle={styles.chipText}>{l}</Chip>
            ))}
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.feeRow}>
          {/* <View>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeValue}>{formatCurrency(doctor.consultationFee)}</Text>
          </View> */}
          <Chip
            icon={() => (
              <MaterialCommunityIcons
                name="circle"
                size={10}
                color={doctor.isAvailable ? Colors.success : Colors.error}
              />
            )}
            style={styles.availChip}
            textStyle={{ fontSize: 12, color: doctor.isAvailable ? Colors.success : Colors.error }}
          >
            {doctor.isAvailable ? 'Available' : 'Busy'}
          </Chip>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={() => router.push(`/(patient)/doctor-slots/${id}`)}
          style={styles.bookBtn}
          contentStyle={styles.bookBtnContent}
          labelStyle={styles.bookBtnLabel}
          icon="calendar-clock"
        >
          Book Appointment
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 100 },
  profileCard: {
    alignItems: 'center', backgroundColor: Colors.white,
    paddingVertical: 24, paddingHorizontal: 16, marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  specialty: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    backgroundColor: Colors.background, borderRadius: 12, padding: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  section: {
    backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  bio: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.background },
  chipText: { fontSize: 12, color: Colors.textSecondary },
  divider: { marginVertical: 4 },
  feeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, padding: 16,
  },
  feeLabel: { fontSize: 13, color: Colors.textSecondary },
  feeValue: { fontSize: 20, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  availChip: { backgroundColor: Colors.background },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  bookBtn: { borderRadius: 12 },
  bookBtnContent: { paddingVertical: 6 },
  bookBtnLabel: { fontSize: 16, fontWeight: '600' },
});
