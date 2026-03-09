import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useGetAppointmentByIdQuery,
  useCancelAppointmentMutation,
  useGetSubscriptionStatusQuery,
  useGetVideoTokenQuery,
} from '../../../src/store/apiSlice';
import { useAppSelector } from '../../../src/store';
import { emitEvent } from '../../../src/services/socket';
import { AppHeader, Avatar, StatusBadge, LoadingScreen } from '../../../src/components';
import { formatDate, formatTime, formatCurrency } from '../../../src/utils/formatters';
import { getDisplayName } from '../../../src/utils/name';
import { Colors } from '../../../src/theme';
import type { CallType } from '../../../src/types';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useGetAppointmentByIdQuery(Number(id));
  const [cancelAppointment, { isLoading: cancelling }] = useCancelAppointmentMutation();
  const { data: subData } = useGetSubscriptionStatusQuery(undefined);
  const { data: tokenData } = useGetVideoTokenQuery(Number(id), { skip: !id });
  const { user } = useAppSelector((s) => s.auth);

  if (isLoading) return <LoadingScreen />;
  const appointment = data?.data;
  if (!appointment) return <LoadingScreen />;

  const doctor = appointment.doctor;
  const fullName = getDisplayName(doctor, { doctorPrefix: true, fallback: 'Doctor' });
  const normalizedStatus = String(appointment.status || '').toLowerCase();
  const canCancel = ['booked', 'scheduled', 'confirmed'].includes(normalizedStatus);
  const canJoin = ['booked', 'scheduled', 'confirmed', 'in_progress'].includes(normalizedStatus);

  const activeSub = subData?.data;
  const callType: CallType =
    (tokenData?.data?.callType as CallType)
    || (activeSub?.plan?.tier === 'PREMIUM' ? 'VIDEO' : 'VOICE');

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await cancelAppointment(Number(id));
          router.back();
        },
      },
    ]);
  };

  const handleJoin = () => {
    const patientName = getDisplayName(user, { fallback: 'Patient' });
    if (doctor) {
      emitEvent('call-initiate', {
        doctorId: appointment.doctorId,
        appointmentId: id,
        callerName: patientName,
        callerAvatar: user?.avatar,
        callType,
      });
    }
    router.push(`/call-lobby/${id}?callType=${callType}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Appointment Details" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.topRow}>
              <Avatar name={fullName} size={56} uri={doctor?.avatar} />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{fullName}</Text>
                <Text style={styles.specialty}>{doctor?.specialty}</Text>
              </View>
              <StatusBadge status={appointment.status} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            <InfoRow icon="calendar" label="Date" value={formatDate(appointment.date)} />
            <InfoRow icon="clock-outline" label="Time" value={formatTime(appointment.startTime)} />
            <InfoRow
              icon={callType === 'VIDEO' ? 'video-outline' : 'phone-outline'}
              label="Call Type"
              value={callType === 'VIDEO' ? 'Video Call' : 'Voice Call'}
            />
            <InfoRow icon="currency-inr" label="Fee" value={formatCurrency(appointment.fee)} />
            {appointment.symptoms && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.symptomsLabel}>Symptoms</Text>
                <Text style={styles.symptomsText}>{appointment.symptoms}</Text>
              </>
            )}
          </Card.Content>
        </Card>

        {canJoin && (
          <Card style={[styles.callTypeCard, callType === 'VIDEO' ? styles.videoCard : styles.voiceCard]}>
            <Card.Content style={styles.callTypeContent}>
              <MaterialCommunityIcons
                name={callType === 'VIDEO' ? 'video' : 'phone'}
                size={22}
                color={callType === 'VIDEO' ? '#8B5CF6' : '#3B82F6'}
              />
              <View style={styles.callTypeInfo}>
                <Text style={[styles.callTypeTitle, { color: callType === 'VIDEO' ? '#8B5CF6' : '#3B82F6' }]}>
                  {callType === 'VIDEO' ? 'Video Consultation' : 'Voice Consultation'}
                </Text>
                <Text style={styles.callTypeDesc}>
                  {callType === 'VIDEO'
                    ? 'Video consultation available for this appointment'
                    : 'Voice consultation available for this appointment'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {appointment.prescriptionId && (
          <Button
            mode="outlined"
            icon="file-document-outline"
            onPress={() => router.push(`/(patient)/prescriptions/${appointment.prescriptionId}`)}
            style={styles.rxBtn}
          >
            View Prescription
          </Button>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {canJoin && (
          <Button
            mode="contained"
            icon={callType === 'VIDEO' ? 'video' : 'phone'}
            onPress={handleJoin}
            style={styles.joinBtn}
            contentStyle={styles.btnContent}
            labelStyle={styles.btnLabel}
            buttonColor={callType === 'VIDEO' ? '#8B5CF6' : Colors.primary}
          >
            {callType === 'VIDEO' ? 'Join Video Call' : 'Join Voice Call'}
          </Button>
        )}
        {canCancel && (
          <Button
            mode="outlined"
            onPress={handleCancel}
            loading={cancelling}
            textColor={Colors.error}
            style={styles.cancelBtn}
            contentStyle={styles.btnContent}
          >
            Cancel
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <MaterialCommunityIcons name={icon as any} size={20} color={Colors.textSecondary} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  label: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 120 },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  specialty: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  divider: { marginVertical: 8 },
  symptomsLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  symptomsText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  callTypeCard: { borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  videoCard: { backgroundColor: '#F5F3FF', borderColor: '#8B5CF630' },
  voiceCard: { backgroundColor: '#EFF6FF', borderColor: '#3B82F630' },
  callTypeContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  callTypeInfo: { flex: 1 },
  callTypeTitle: { fontSize: 14, fontWeight: '700' },
  callTypeDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rxBtn: { borderRadius: 12, marginBottom: 12 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  joinBtn: { flex: 2, borderRadius: 12 },
  cancelBtn: { flex: 1, borderRadius: 12, borderColor: Colors.error },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '600' },
});
