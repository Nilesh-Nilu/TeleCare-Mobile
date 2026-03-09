import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Button, Card, TextInput, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useGetDoctorByIdQuery, useBookAppointmentMutation, useGetSubscriptionStatusQuery } from '../../src/store/apiSlice';
import { AppHeader, Avatar, LoadingScreen } from '../../src/components';
import { formatCurrency } from '../../src/utils/formatters';
import { getDisplayName } from '../../src/utils/name';
import { Colors } from '../../src/theme';
import type { CallType } from '../../src/types';

export default function BookingConfirmationScreen() {
  const { doctorId, date, startTime, endTime } = useLocalSearchParams<{
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
  }>();
  const { data: doctorData, isLoading } = useGetDoctorByIdQuery(Number(doctorId));
  const { data: subData } = useGetSubscriptionStatusQuery(undefined);
  const [bookAppointment] = useBookAppointmentMutation();
  const callType: CallType = subData?.data?.plan?.tier === 'PREMIUM' ? 'VIDEO' : 'VOICE';

  const [symptoms, setSymptoms] = useState('');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  if (isLoading) return <LoadingScreen />;
  const doctor = doctorData?.data;
  if (!doctor) return <LoadingScreen />;

  const fullName = getDisplayName(doctor, { doctorPrefix: true, fallback: 'Doctor' });
  const dateFormatted = date ? format(parseISO(date), 'dd MMMM yyyy') : '';

  const handleBook = async () => {
    setBooking(true);
    try {
      await bookAppointment({
        doctorId: Number(doctorId),
        appointmentDate: date!,
        startTime: startTime!,
        endTime: endTime!,
      }).unwrap();
      setBooked(true);
    } catch(error) {
      console.log(error)
      // handled by RTK
    } finally {
      setBooking(false);
    }
  };

  if (booked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your appointment with {fullName} on {dateFormatted} at {startTime} has been confirmed.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/(patient)/appointments')}
            style={styles.primaryBtn}
            contentStyle={styles.primaryBtnContent}
          >
            View Appointments
          </Button>
          <Button
            mode="text"
            onPress={() => router.replace('/(patient)')}
            textColor={Colors.primary}
          >
            Go Home
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Confirm Booking" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.doctorCard}>
          <Card.Content style={styles.doctorCardContent}>
            <Avatar name={fullName} size={56} uri={doctor.avatar} />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{fullName}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.detailCard}>
          <Card.Content>
            <Text style={styles.detailTitle}>Appointment Details</Text>
            <DetailRow icon="calendar" label="Date" value={dateFormatted} />
            <DetailRow icon="clock-outline" label="Time" value={`${startTime} - ${endTime}`} />
            <DetailRow
              icon={callType === 'VIDEO' ? 'video-outline' : 'phone-outline'}
              label="Type"
              value={callType === 'VIDEO' ? 'Video Consultation' : 'Voice Consultation'}
            />
            <Divider style={styles.divider} />
            <DetailRow icon="currency-inr" label="Fee" value={formatCurrency(doctor.consultationFee)} highlight />
          </Card.Content>
        </Card>

        <Card style={styles.detailCard}>
          <Card.Content>
            <Text style={styles.detailTitle}>Symptoms (Optional)</Text>
            <TextInput
              value={symptoms}
              onChangeText={setSymptoms}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Describe your symptoms briefly..."
              style={styles.symptomsInput}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(doctor.consultationFee)}</Text>
        </View>
        <Button
          mode="contained"
          onPress={handleBook}
          loading={booking}
          disabled={booking}
          style={styles.primaryBtn}
          contentStyle={styles.primaryBtnContent}
          labelStyle={styles.primaryBtnLabel}
        >
          {booking ? 'Booking...' : 'Confirm & Book'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, highlight }: {
  icon: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={detailStyles.row}>
      <MaterialCommunityIcons name={icon as any} size={20} color={Colors.textSecondary} />
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, highlight && detailStyles.highlight]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  label: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  highlight: { color: Colors.primary, fontSize: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 140 },
  doctorCard: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 12 },
  doctorCardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  doctorSpecialty: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  detailCard: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 12 },
  detailTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  divider: { marginVertical: 4 },
  symptomsInput: { backgroundColor: Colors.white, marginTop: 8 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
  },
  totalLabel: { fontSize: 15, color: Colors.textSecondary },
  totalValue: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  primaryBtn: { borderRadius: 12 },
  primaryBtnContent: { paddingVertical: 6 },
  primaryBtnLabel: { fontSize: 16, fontWeight: '600' },
  successContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  successIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  successSubtitle: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 32,
  },
});
