import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button, Card, TextInput, Divider, Banner } from 'react-native-paper';
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
  const { doctorId, date, startTime, endTime, callType: callTypeParam } = useLocalSearchParams<{
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    callType?: string;
  }>();
  const { data: doctorData, isLoading } = useGetDoctorByIdQuery(Number(doctorId));
  const { data: subData } = useGetSubscriptionStatusQuery(undefined);
  const [bookAppointment] = useBookAppointmentMutation();
  const isPremiumPlan = subData?.data?.plan?.tier === 'PREMIUM';
  const hasActiveSubscription = String(subData?.data?.status || '').toLowerCase() === 'active';
  const remainingConsultations = Number(subData?.data?.remainingConsultations ?? 0);
  const hasRemainingConsultations = remainingConsultations > 0;
  const defaultCallType: CallType = callTypeParam === 'VIDEO' || callTypeParam === 'VOICE'
    ? (callTypeParam as CallType)
    : (isPremiumPlan ? 'VIDEO' : 'VOICE');

  const [symptoms, setSymptoms] = useState('');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [selectedCallType, setSelectedCallType] = useState<CallType>(defaultCallType);
  const [error, setError] = useState('');

  if (isLoading) return <LoadingScreen />;
  const doctor = doctorData?.data;
  if (!doctor) return <LoadingScreen />;

  const fullName = getDisplayName(doctor, { doctorPrefix: true, fallback: 'Doctor' });
  const dateFormatted = date ? format(parseISO(date), 'dd MMMM yyyy') : '';

  const handleBook = async () => {
    setError('');
    if (!hasActiveSubscription) {
      setError('You need an active subscription to book an appointment.');
      return;
    }
    if (!hasRemainingConsultations) {
      setError('No remaining consultations');
      return;
    }
    setBooking(true);
    try {
      await bookAppointment({
        doctorId: Number(doctorId),
        appointmentDate: date!,
        startTime: startTime!,
        endTime: endTime!,
        callType: selectedCallType,
      }).unwrap();
      setBooked(true);
    } catch (err: any) {
      const message = err?.data?.message || 'Booking failed. Please try again.';
      setError(message);
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
            <View style={styles.typePickerRow}>
              <Text style={styles.typePickerLabel}>Consultation Type</Text>
              <View style={styles.typePickerChips}>
                <TouchableOpacity
                  onPress={() => setSelectedCallType('VOICE')}
                  style={[styles.typeChip, selectedCallType === 'VOICE' && styles.typeChipSelected]}
                >
                  <Text style={selectedCallType === 'VOICE' ? styles.typeChipTextSelected : styles.typeChipText}>
                    Voice
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (!isPremiumPlan) {
                      Alert.alert('Premium required', 'Video consultation is available only on Premium plans.');
                      return;
                    }
                    setSelectedCallType('VIDEO');
                  }}
                  style={[
                    styles.typeChip,
                    selectedCallType === 'VIDEO' && styles.typeChipSelected,
                    !isPremiumPlan && styles.typeChipDisabled,
                  ]}
                >
                  <Text
                    style={[
                      selectedCallType === 'VIDEO' ? styles.typeChipTextSelected : styles.typeChipText,
                      !isPremiumPlan && styles.typeChipTextDisabled,
                    ]}
                  >
                    Video
                  </Text>
                </TouchableOpacity>
              </View>
              {!isPremiumPlan && (
                <Text style={styles.typeHint}>Video consultation is available on Premium plans.</Text>
              )}
            </View>
            <DetailRow
              icon={selectedCallType === 'VIDEO' ? 'video-outline' : 'phone-outline'}
              label="Type"
              value={selectedCallType === 'VIDEO' ? 'Video Consultation' : 'Voice Consultation'}
            />
            <Divider style={styles.divider} />
            <DetailRow icon="currency-inr" label="Fee" value={formatCurrency(doctor.consultationFee)} highlight />
          </Card.Content>
        </Card>

        <Banner
          visible={!!error}
          actions={[{ label: 'Dismiss', onPress: () => setError('') }]}
          icon="alert-circle"
          style={styles.errorBanner}
        >
          {error}
        </Banner>

        {!hasActiveSubscription && (
          <Button
            mode="outlined"
            onPress={() => router.push('/(patient)/subscription')}
            style={styles.subscribeBtn}
          >
            View Plans
          </Button>
        )}
        {hasActiveSubscription && !hasRemainingConsultations && (
          <Button
            mode="outlined"
            onPress={() => router.push('/(patient)/subscription/active')}
            style={styles.subscribeBtn}
          >
            Renew Subscription
          </Button>
        )}

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
          disabled={booking || !hasActiveSubscription || !hasRemainingConsultations}
          style={styles.primaryBtn}
          contentStyle={styles.primaryBtnContent}
          labelStyle={styles.primaryBtnLabel}
        >
          {booking ? 'Booking...' : !hasRemainingConsultations ? 'No Consultations Left' : 'Confirm & Book'}
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
  typePickerRow: { marginTop: 8, marginBottom: 4 },
  typePickerLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  typePickerChips: { flexDirection: 'row', gap: 8 },
  typeChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 84,
    alignItems: 'center',
  },
  typeChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipDisabled: { opacity: 0.45 },
  typeChipText: { color: Colors.textPrimary, fontWeight: '600' },
  typeChipTextSelected: { color: Colors.white, fontWeight: '700' },
  typeChipTextDisabled: { color: Colors.textTertiary },
  typeHint: { marginTop: 6, fontSize: 12, color: Colors.textTertiary },
  divider: { marginVertical: 4 },
  symptomsInput: { backgroundColor: Colors.white, marginTop: 8 },
  errorBanner: {
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: Colors.errorLight,
  },
  subscribeBtn: { borderRadius: 10, marginBottom: 12 },
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
