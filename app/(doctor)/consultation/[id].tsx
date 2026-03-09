import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Button, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useGetAppointmentByIdQuery,
  useGetVideoTokenQuery,
  useUpdateAppointmentStatusMutation,
} from '../../../src/store/apiSlice';
import { useAppSelector } from '../../../src/store';
import { emitEvent } from '../../../src/services/socket';
import { AppHeader, Avatar, StatusBadge, LoadingScreen } from '../../../src/components';
import { formatDate, formatTime } from '../../../src/utils/formatters';
import { getDisplayName } from '../../../src/utils/name';
import { Colors } from '../../../src/theme';
import type { CallType } from '../../../src/types';

export default function DoctorConsultationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useGetAppointmentByIdQuery(Number(id));
  const { data: tokenData } = useGetVideoTokenQuery(Number(id));
  const [updateAppointmentStatus, { isLoading: updatingStatus }] = useUpdateAppointmentStatusMutation();
  const { user } = useAppSelector((s) => s.auth);

  if (isLoading) return <LoadingScreen />;
  const appointment = data?.data;
  if (!appointment) return <LoadingScreen />;

  const patient = appointment.patient;
  const patientName = getDisplayName(patient, { fallback: 'Patient' });
  const normalizedStatus = String(appointment.status || '').toLowerCase();

  const sessionCallType: CallType = tokenData?.data?.callType || 'VOICE';
  const doctorName = getDisplayName(user, { doctorPrefix: true, fallback: 'Doctor' });

  const handleStartCall = async () => {
    if (['booked', 'scheduled'].includes(normalizedStatus)) {
      try {
        await updateAppointmentStatus({ id: Number(id), status: 'CONFIRMED' }).unwrap();
      } catch {
        return;
      }
    }
    if (patient) {
      emitEvent('call-initiate', {
        patientId: patient.id,
        appointmentId: id,
        callerName: doctorName,
        callerAvatar: user?.avatar,
        callType: sessionCallType,
      });
    }
    router.push(`/call-lobby/${id}?callType=${sessionCallType}`);
  };

  const handleMarkCompleted = async () => {
    try {
      await updateAppointmentStatus({ id: Number(id), status: 'DONE' }).unwrap();
      router.back();
    } catch {
      // RTK Query error handling can surface this globally
    }
  };

  const handlePrescribe = () => {
    router.push(`/(doctor)/prescribe/${id}`);
  };

  const handleViewRecords = () => {
    if (patient) {
      router.push(`/(doctor)/patient-records/${patient.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Consultation" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content style={styles.patientRow}>
            <Avatar name={patientName} size={56} uri={patient?.avatar} />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patientName}</Text>
              {patient && (
                <Text style={styles.patientMeta}>
                  {patient.gender} • {patient.bloodGroup || 'N/A'}
                </Text>
              )}
            </View>
            <StatusBadge status={appointment.status} />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Appointment</Text>
            <InfoRow icon="calendar" label="Date" value={formatDate(appointment.date)} />
            <InfoRow icon="clock-outline" label="Time" value={formatTime(appointment.startTime)} />
            <InfoRow
              icon={sessionCallType === 'VIDEO' ? 'video-outline' : 'phone-outline'}
              label="Call Type"
              value={sessionCallType === 'VIDEO' ? 'Video Call' : 'Voice Call'}
            />
            {appointment.symptoms && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.symptomsLabel}>Symptoms</Text>
                <Text style={styles.symptomsText}>{appointment.symptoms}</Text>
              </>
            )}
          </Card.Content>
        </Card>

        {patient?.allergies && patient.allergies.length > 0 && (
          <Card style={[styles.card, styles.allergyCard]}>
            <Card.Content style={styles.allergyContent}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.error} />
              <View style={styles.allergyInfo}>
                <Text style={styles.allergyTitle}>Known Allergies</Text>
                <Text style={styles.allergyText}>{patient.allergies.join(', ')}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.actionGrid}>
          <Button
            mode="contained"
            icon={sessionCallType === 'VIDEO' ? 'video' : 'phone'}
            onPress={handleStartCall}
            loading={updatingStatus}
            disabled={updatingStatus}
            style={[styles.actionBtn, {
              backgroundColor: sessionCallType === 'VIDEO' ? '#8B5CF6' : Colors.secondary,
            }]}
            contentStyle={styles.actionBtnContent}
          >
            {sessionCallType === 'VIDEO' ? 'Start Video Call' : 'Start Voice Call'}
          </Button>
          <Button
            mode="outlined"
            icon="file-document-edit-outline"
            onPress={handlePrescribe}
            style={styles.actionBtn}
            contentStyle={styles.actionBtnContent}
          >
            Write Prescription
          </Button>
          <Button
            mode="outlined"
            icon="folder-outline"
            onPress={handleViewRecords}
            style={styles.actionBtn}
            contentStyle={styles.actionBtnContent}
          >
            Patient Records
          </Button>
          {['confirmed', 'in_progress'].includes(normalizedStatus) && (
            <Button
              mode="contained-tonal"
              icon="check-circle-outline"
              onPress={handleMarkCompleted}
              loading={updatingStatus}
              disabled={updatingStatus}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
            >
              Mark as Completed
            </Button>
          )}
        </View>
      </ScrollView>
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
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  label: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 12 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  patientMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  divider: { marginVertical: 8 },
  symptomsLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  symptomsText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  allergyCard: { backgroundColor: Colors.errorLight, borderWidth: 1, borderColor: Colors.error + '30' },
  allergyContent: { flexDirection: 'row', gap: 10 },
  allergyInfo: { flex: 1 },
  allergyTitle: { fontSize: 13, fontWeight: '600', color: Colors.error },
  allergyText: { fontSize: 13, color: Colors.textPrimary, marginTop: 2 },
  actionGrid: { gap: 10, marginTop: 4 },
  actionBtn: { borderRadius: 12 },
  actionBtnContent: { paddingVertical: 6 },
});
